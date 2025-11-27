import imaps from 'imap-simple';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { analyzeEmail, generateAppointmentSuggestions, generateEmailResponse, generateTaskFromEmail } from './openai';
import type { IStorage } from './storage';
import type { EmailAccount, InsertEmail, InsertDocument, InsertAppointment } from '../shared/schema';
import { uploadFileToDrive, getOrCreateFolder, getOrCreateSubfolder, getUserGoogleDriveClient } from './googleDrive';
import { uploadFileToOneDrive, getOrCreateOneDriveFolder } from './onedrive';
import { forwardAttachments } from './emailForwarder';
import type { EmailAttachment } from './emailSender';
import { PassThrough } from 'stream';

// Utility function to safely extract text from AddressObject
function getAddressText(address: AddressObject | AddressObject[] | undefined): string {
  if (!address) return '';
  if (Array.isArray(address)) {
    return address.map(a => a.text || '').join(', ');
  }
  return address.text || '';
}

// Utility function to safely extract email addresses from AddressObject
function getEmailAddresses(address: AddressObject | AddressObject[] | undefined): string[] {
  if (!address) return [];
  if (Array.isArray(address)) {
    return address.flatMap(a => a.value || []).map(v => v.address || '').filter(Boolean);
  }
  return (address.value || []).map(v => v.address || '').filter(Boolean);
}

interface ScanResult {
  scanned: number;
  created: number;
  errors: number;
}

export class EmailScanner {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async scanAccount(account: EmailAccount): Promise<ScanResult> {
    const result: ScanResult = { scanned: 0, created: 0, errors: 0 };

    try {
      // Fetch global settings for document extraction and appointment scheduling
      const settings = await this.storage.getAllSettings();
      const documentExtractionEnabled = settings.documentExtractionEnabled === true;
      const documentStorageProvider = settings.documentStorageProvider || 'google_drive';
      const isDocumentStorageEnabled = documentStorageProvider !== 'disabled';
      const autoScheduleAppointments = settings.autoScheduling !== false;

      console.log(`[IMAP] Document extraction: ${documentExtractionEnabled ? 'enabled' : 'disabled'}, Storage provider: ${documentStorageProvider}`);

      // Fetch email categories for this account (system + custom categories)
      const categories = await this.storage.getEmailCategoriesForAccount(account.id);
      const availableCategories = categories.map(c => ({ key: c.key, label: c.label }));
      const availableCategoryKeys = new Set(categories.map(c => c.key));
      
      // Create a map for category settings (generateAutoResponse, autoCreateTask, autoMarkAsProcessed, and redirectEmails)
      const categorySettingsMap = new Map(categories.map(c => [c.key, c.generateAutoResponse]));
      const autoCreateTaskMap = new Map(categories.map(c => [c.key, c.autoCreateTask]));
      const autoMarkAsProcessedMap = new Map(categories.map(c => [c.key, c.autoMarkAsProcessed]));
      const redirectEmailsMap = new Map(categories.map(c => [c.key, c.redirectEmails || []]));
      
      const config = {
        imap: {
          user: account.username,
          password: account.password,
          host: account.imapHost,
          port: account.imapPort,
          tls: true,
          authTimeout: 10000,
          tlsOptions: {
            rejectUnauthorized: false, // Accept self-signed certificates (needed for Replit environment)
          },
        },
      };

      console.log(`[IMAP] Connecting to ${account.email}...`);
      const connection = await imaps.connect(config);

      await connection.openBox('INBOX');

      // Fetch only recent unread emails (last 30 days)
      const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: true, // Mark as read after processing to prevent reprocessing
      };

      const messages = await connection.search(searchCriteria, fetchOptions);
      console.log(`[IMAP] Found ${messages.length} unread messages for ${account.email}`);

      for (const item of messages) {
        result.scanned++;
        
        try {
          const all = item.parts.find((part) => part.which === '');
          if (!all) continue;

          const mail: ParsedMail = await simpleParser(all.body);

          // Check if email already exists by messageId (exact match)
          if (mail.messageId) {
            const existingEmail = await this.storage.getEmailByMessageId(mail.messageId);
            if (existingEmail) {
              console.log(`[IMAP] Email ${mail.messageId} already exists, skipping`);
              continue;
            }
          }

          // Analyze email with GPT (with advanced sentiment analysis) - pass available categories
          const analysis = await analyzeEmail({
            subject: mail.subject || 'Sans objet',
            body: mail.text || mail.html || '',
            from: getAddressText(mail.from) || 'Inconnu',
          }, availableCategories);

          // Check if email type is in the account's available categories
          let emailType = analysis.emailType || 'autre';
          
          if (!availableCategoryKeys.has(emailType)) {
            console.log(`[IMAP] Email type '${emailType}' not available for this account, classifying as 'autre'`);
            emailType = 'autre'; // Fallback to 'autre' category
          }

          // Generate suggested response with GPT (with timeout and error handling)
          // Exclude auto-response generation for categories with generateAutoResponse=false (like "autre")
          const shouldGenerateResponse = categorySettingsMap.get(emailType) !== false;
          console.log(`[IMAP] Auto-response generation ${shouldGenerateResponse ? 'enabled' : 'disabled'} for category '${emailType}'`);
          
          let suggestedResponse: string | undefined;
          if (shouldGenerateResponse) {
            console.log(`[IMAP] Generating suggested response...`);
            try {
              const responsePromise = generateEmailResponse({
                subject: mail.subject || 'Sans objet',
                body: mail.text || mail.html || '',
                from: getAddressText(mail.from) || 'Inconnu',
                context: `Type: ${analysis.emailType}, Priority: ${analysis.priority}, Sentiment: ${analysis.sentiment}`,
              });
              
              // Add 15 second timeout with proper cleanup to prevent blocking scan
              let timeoutHandle: NodeJS.Timeout;
              const timeoutPromise = new Promise<string>((_, reject) => {
                timeoutHandle = setTimeout(() => reject(new Error('Response generation timeout')), 15000);
              });
              
              try {
                suggestedResponse = await Promise.race([responsePromise, timeoutPromise]);
                clearTimeout(timeoutHandle!); // Clear timeout if response completes in time
                console.log(`[IMAP] Response generated successfully`);
              } catch (error) {
                clearTimeout(timeoutHandle!); // Clear timeout on error too
                throw error;
              }
            } catch (error) {
              console.warn(`[IMAP] Failed to generate response:`, error);
              suggestedResponse = undefined; // Continue scan even if response generation fails
            }
          }

          // Determine if email should be automatically marked as processed
          const shouldAutoMarkAsProcessed = autoMarkAsProcessedMap.get(emailType) === true;
          console.log(`[IMAP] Auto-mark as processed ${shouldAutoMarkAsProcessed ? 'enabled' : 'disabled'} for category '${emailType}'`);
          
          // Create email record
          const emailData: InsertEmail = {
            companyId: account.companyId, // Multi-tenant isolation: associate email with the company
            userId: account.userId, // Associate email with the user who owns the email account
            emailAccountId: account.id,
            messageId: mail.messageId || `${Date.now()}-${Math.random()}`,
            subject: mail.subject || 'Sans objet',
            from: getAddressText(mail.from) || 'Inconnu',
            to: getAddressText(mail.to) || '',
            cc: getAddressText(mail.cc) || '',
            body: mail.text || '',
            htmlBody: mail.html || '',
            receivedAt: mail.date || new Date(),
            emailType: emailType, // Use the normalized emailType (fallback to 'autre' if category not available)
            priority: analysis.priority,
            sentiment: analysis.sentiment,
            status: shouldAutoMarkAsProcessed ? 'traite' : 'nouveau', // Auto-mark as processed if enabled
            suggestedResponse: suggestedResponse, // Add AI-generated response
            aiAnalysis: {
              summary: analysis.summary,
              extractedData: analysis.extractedData,
              suggestedTags: analysis.suggestedTags,
              // Advanced sentiment analysis fields
              riskLevel: analysis.riskLevel || 'none',
              riskFactors: analysis.riskFactors || [],
              urgencyType: analysis.urgencyType || 'none',
              conflictIndicators: analysis.conflictIndicators || [],
              actionRecommendations: analysis.actionRecommendations || [],
            },
            hasAttachments: (mail.attachments?.length || 0) > 0,
            isRead: false, // New emails start as unread
            requiresResponse: emailType === 'devis' || analysis.priority === 'urgent',
            responseDeadline: emailType === 'devis' 
              ? new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h for quotes
              : undefined,
          };

          const createdEmail = await this.storage.createEmail(emailData);
          result.created++;

          console.log(`[IMAP] Created email: ${createdEmail.id} - ${mail.subject}`);

          // Auto-create task if category has autoCreateTask enabled
          const shouldCreateTask = autoCreateTaskMap.get(emailType) === true;
          if (shouldCreateTask) {
            console.log(`[IMAP] Auto-creating task for email category '${emailType}'...`);
            try {
              const taskData = await generateTaskFromEmail({
                subject: mail.subject || 'Sans objet',
                body: mail.text || mail.html || '',
                from: getAddressText(mail.from) || 'Inconnu',
                category: emailType,
              });
              
              await this.storage.createTask({
                companyId: account.companyId, // Multi-tenant isolation
                emailId: createdEmail.id,
                title: taskData.title,
                description: taskData.description,
                status: 'nouveau',
                priority: taskData.priority,
                createdById: account.userId,
              });
              
              console.log(`[IMAP] Task created successfully: ${taskData.title}`);
            } catch (taskError) {
              console.error(`[IMAP] Failed to create task:`, taskError);
              // Continue processing even if task creation fails
            }
          }

          // Auto-create appointment if automatic scheduling is enabled and appointment is detected
          if (autoScheduleAppointments && (emailType === 'rdv' || analysis.extractedData?.appointmentDate)) {
            console.log(`[IMAP] Auto-scheduling appointment for email category '${emailType}'...`);
            try {
              // Extract appointment date from AI analysis
              const appointmentDate = analysis.extractedData?.appointmentDate 
                ? new Date(analysis.extractedData.appointmentDate)
                : null;
              
              if (appointmentDate && appointmentDate > new Date()) {
                // Set end time to 1 hour after start time by default
                const endTime = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
                
                const appointmentData: InsertAppointment = {
                  companyId: account.companyId, // Multi-tenant isolation
                  emailId: createdEmail.id,
                  title: mail.subject || 'RDV détecté automatiquement',
                  description: `Détecté automatiquement depuis l'email de ${getAddressText(mail.from)}\n\nCorps du message:\n${mail.text || mail.html || ''}`,
                  startTime: appointmentDate,
                  endTime: endTime,
                  status: 'planifie',
                  location: analysis.extractedData?.contact || '',
                  attendees: getEmailAddresses(mail.from),
                  createdById: account.userId,
                };
                
                const createdAppointment = await this.storage.createAppointment(appointmentData);
                console.log(`[IMAP] Appointment created successfully: ${appointmentData.title} on ${appointmentDate.toISOString()}`);
                
                // Generate AI suggestions for appointment preparation
                try {
                  console.log(`[IMAP] Generating AI suggestions for appointment preparation...`);
                  const aiSuggestions = await generateAppointmentSuggestions({
                    title: appointmentData.title,
                    description: appointmentData.description,
                    attendees: appointmentData.attendees as string[] | undefined,
                  });
                  
                  // Update appointment with AI suggestions
                  await this.storage.updateAppointment(createdAppointment.id, {
                    aiSuggestions,
                  });
                  console.log(`[IMAP] AI suggestions added to appointment successfully`);
                } catch (suggestionsError) {
                  console.error(`[IMAP] Failed to generate AI suggestions:`, suggestionsError);
                  // Continue processing even if suggestions generation fails
                }
              } else {
                console.log(`[IMAP] Appointment date is invalid or in the past, skipping appointment creation`);
              }
            } catch (appointmentError) {
              console.error(`[IMAP] Failed to create appointment:`, appointmentError);
              // Continue processing even if appointment creation fails
            }
          }

          // Forward attachments if category has redirectEmails configured
          const redirectEmails = redirectEmailsMap.get(emailType) || [];
          if (redirectEmails.length > 0 && mail.attachments && mail.attachments.length > 0) {
            console.log(`[IMAP] Category '${emailType}' has ${redirectEmails.length} redirect email(s) configured`);
            
            // Filter out inline images (those with contentDisposition === 'inline' or cid)
            // Only forward actual file attachments
            const actualAttachments = mail.attachments.filter(att => {
              const isInlineImage = att.contentDisposition === 'inline' || !!att.cid;
              return !isInlineImage;
            });
            
            // Only forward if there are actual attachments (not just inline images)
            if (actualAttachments.length === 0) {
              console.log(`[IMAP] No actual file attachments to forward (only inline images)`);
            } else {
              // Convert mailparser attachments to EmailAttachment format
              const emailAttachments: EmailAttachment[] = actualAttachments.map(att => ({
                filename: att.filename || `attachment-${Date.now()}`,
                content: att.content,
                contentType: att.contentType,
              }));

              try {
                const forwardResult = await forwardAttachments(this.storage, {
                fromAccount: account,
                recipientEmails: redirectEmails,
                originalSubject: mail.subject || 'Sans objet',
                originalFrom: getAddressText(mail.from) || 'Inconnu',
                attachments: emailAttachments,
              });

              if (!forwardResult.success) {
                console.error(`[IMAP] Attachment forwarding encountered ${forwardResult.errors.length} error(s)`);
              } else {
                console.log(`[IMAP] Successfully forwarded attachments to all recipients`);
              }
              } catch (forwardError) {
                console.error(`[IMAP] Exception during attachment forwarding:`, forwardError);
                // Continue processing even if forwarding fails
              }
            }
          }

          // Process attachments (only if document extraction is enabled)
          if (mail.attachments && mail.attachments.length > 0 && documentExtractionEnabled && isDocumentStorageEnabled) {
            // Filter out inline images (those with contentDisposition === 'inline' or cid)
            // Only process actual file attachments
            const actualAttachments = mail.attachments.filter(att => {
              const isInlineImage = att.contentDisposition === 'inline' || !!att.cid;
              return !isInlineImage;
            });
            
            if (actualAttachments.length === 0) {
              console.log(`[IMAP] No actual file attachments to process (only inline images)`);
            } else {
              console.log(`[IMAP] Processing ${actualAttachments.length} actual attachments (filtered out inline images) for ${documentStorageProvider}...`);
            }
            
            try {
              if (documentStorageProvider === 'google_drive' && actualAttachments.length > 0) {
                // Google Drive upload with user credentials
                const userDrive = await getUserGoogleDriveClient(account.userId);
                
                // Get or create folders using user's drive client
                const mainFolderName = 'PME-Assistant-Documents';
                let mainFolderId: string;
                
                // Search for main folder
                const mainFolderResponse = await userDrive.files.list({
                  q: `name='${mainFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                  fields: 'files(id, name)',
                  spaces: 'drive',
                });
                
                if (mainFolderResponse.data.files && mainFolderResponse.data.files.length > 0) {
                  mainFolderId = mainFolderResponse.data.files[0].id!;
                } else {
                  // Create main folder
                  const folderMetadata = {
                    name: mainFolderName,
                    mimeType: 'application/vnd.google-apps.folder',
                  };
                  const folder = await userDrive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                  });
                  mainFolderId = folder.data.id!;
                }
                
                // Get or create category-specific subfolder
                const categoryFolderResponse = await userDrive.files.list({
                  q: `name='${emailType}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                  fields: 'files(id, name)',
                  spaces: 'drive',
                });
                
                let categoryFolderId: string;
                if (categoryFolderResponse.data.files && categoryFolderResponse.data.files.length > 0) {
                  categoryFolderId = categoryFolderResponse.data.files[0].id!;
                } else {
                  const folderMetadata = {
                    name: emailType,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [mainFolderId],
                  };
                  const folder = await userDrive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                  });
                  categoryFolderId = folder.data.id!;
                }
                
                console.log(`[IMAP] Using Google Drive category folder: ${emailType}`);
                
                // Upload each actual attachment (inline images already filtered out)
                for (const attachment of actualAttachments) {
                  try {
                    const filename = attachment.filename || `attachment-${Date.now()}`;
                    const mimeType = attachment.contentType || 'application/octet-stream';
                    const buffer = attachment.content;

                    console.log(`[IMAP] Uploading attachment: ${filename} to Google Drive /${emailType}/`);
                    
                    // Upload to Google Drive
                    const fileMetadata: any = {
                      name: filename,
                      parents: [categoryFolderId],
                    };
                    
                    const stream = new PassThrough();
                    stream.end(buffer);
                    
                    const media = {
                      mimeType,
                      body: stream,
                    };
                    
                    const response = await userDrive.files.create({
                      requestBody: fileMetadata,
                      media,
                      fields: 'id, webViewLink',
                    });

                    // Detect document type
                    let documentType: 'facture' | 'devis' | 'contrat' | 'autre' = 'autre';
                    if (emailType === 'facture') {
                      documentType = 'facture';
                    } else if (emailType === 'devis') {
                      documentType = 'devis';
                    } else if (mimeType.includes('pdf') && filename.toLowerCase().includes('contrat')) {
                      documentType = 'contrat';
                    }

                    // Create document record
                    const documentData: InsertDocument = {
                      emailId: createdEmail.id,
                      filename: filename,
                      originalFilename: filename,
                      mimeType: mimeType,
                      size: buffer.length,
                      storageProvider: 'google_drive',
                      storagePath: response.data.id!,
                      driveFileId: response.data.id!,
                      driveUrl: response.data.webViewLink!,
                      documentType: documentType,
                    };

                    await this.storage.createDocument(documentData);
                    console.log(`[IMAP] Created Google Drive document record for: ${filename}`);

                  } catch (attachError) {
                    console.error(`[IMAP] Error processing attachment:`, attachError);
                  }
                }
              } else if (documentStorageProvider === 'onedrive' && actualAttachments.length > 0) {
                // OneDrive upload with user credentials
                const mainFolderPath = 'PME-Assistant-Documents';
                const categoryFolderPath = `${mainFolderPath}/${emailType}`;
                
                // Create folders if they don't exist
                await getOrCreateOneDriveFolder(account.userId, mainFolderPath);
                await getOrCreateOneDriveFolder(account.userId, emailType, mainFolderPath);
                
                console.log(`[IMAP] Using OneDrive category folder: ${emailType}`);
                
                // Upload each actual attachment (inline images already filtered out)
                for (const attachment of actualAttachments) {
                  try {
                    const filename = attachment.filename || `attachment-${Date.now()}`;
                    const mimeType = attachment.contentType || 'application/octet-stream';
                    const buffer = attachment.content;

                    console.log(`[IMAP] Uploading attachment: ${filename} to OneDrive /${categoryFolderPath}/`);
                    
                    const uploadResult = await uploadFileToOneDrive(
                      account.userId,
                      filename,
                      buffer,
                      categoryFolderPath
                    );

                    // Detect document type
                    let documentType: 'facture' | 'devis' | 'contrat' | 'autre' = 'autre';
                    if (emailType === 'facture') {
                      documentType = 'facture';
                    } else if (emailType === 'devis') {
                      documentType = 'devis';
                    } else if (mimeType.includes('pdf') && filename.toLowerCase().includes('contrat')) {
                      documentType = 'contrat';
                    }

                    // Create document record
                    const documentData: InsertDocument = {
                      emailId: createdEmail.id,
                      filename: filename,
                      originalFilename: filename,
                      mimeType: mimeType,
                      size: buffer.length,
                      storageProvider: 'onedrive',
                      storagePath: uploadResult.fileId,
                      driveFileId: uploadResult.fileId,
                      driveUrl: uploadResult.webUrl,
                      documentType: documentType,
                    };

                    await this.storage.createDocument(documentData);
                    console.log(`[IMAP] Created OneDrive document record for: ${filename}`);

                  } catch (attachError) {
                    console.error(`[IMAP] Error processing attachment:`, attachError);
                  }
                }
              }
            } catch (storageError) {
              console.error(`[IMAP] Error with cloud storage (${documentStorageProvider}):`, storageError);
            }
          }

          // Auto-create appointment if email type is 'rdv' and appointmentDate is available
          if (emailType === 'rdv' && analysis.extractedData?.appointmentDate) {
            try {
              console.log(`[IMAP] Creating appointment from email: ${createdEmail.id}`);
              
              const appointmentDate = new Date(analysis.extractedData.appointmentDate);
              const endTime = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

              // Extract attendees from email
              const attendees: string[] = [
                ...getEmailAddresses(mail.from),
                ...getEmailAddresses(mail.to),
              ];

              // Generate AI suggestions for the appointment
              const aiSuggestions = await generateAppointmentSuggestions({
                title: mail.subject || 'Rendez-vous',
                description: analysis.summary,
                attendees,
              });

              const appointmentData: InsertAppointment = {
                companyId: account.companyId, // Multi-tenant isolation
                emailId: createdEmail.id,
                title: mail.subject || 'Rendez-vous',
                description: analysis.summary,
                startTime: appointmentDate,
                endTime: endTime,
                location: analysis.extractedData.location || null,
                attendees: attendees.length > 0 ? attendees : null,
                aiSuggestions: aiSuggestions,
                createdById: account.userId,
              };

              await this.storage.createAppointment(appointmentData);
              console.log(`[IMAP] Created appointment: ${appointmentData.title}`);
            } catch (aptError) {
              console.error(`[IMAP] Error creating appointment:`, aptError);
            }
          }

        } catch (error) {
          result.errors++;
          console.error(`[IMAP] Error processing message:`, error);
        }
      }

      // Update connection status on success BEFORE closing connection
      try {
        await this.storage.updateEmailAccount(account.id, {
          lastSyncStatus: 'success',
          lastSuccessAt: new Date(),
          lastErrorMessage: null,
        });
        console.log(`[IMAP] Connection status updated: success`);
      } catch (updateError) {
        console.error(`[IMAP] Failed to update connection status:`, updateError);
      }

      connection.end();
      console.log(`[IMAP] Scan complete for ${account.email}: ${result.created} new emails created`);

    } catch (error) {
      result.errors++;
      console.error(`[IMAP] Error scanning account ${account.email}:`, error);
      
      // Update connection status on error with detailed message
      try {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
          // Capture IMAP-specific error details
          if ('textCode' in error) {
            errorMessage += ` (Code: ${(error as any).textCode})`;
          }
          if ('source' in error) {
            errorMessage += ` [${(error as any).source}]`;
          }
        } else if (error && typeof error === 'object') {
          errorMessage = JSON.stringify(error);
        }
        
        await this.storage.updateEmailAccount(account.id, {
          lastSyncStatus: 'error',
          lastErrorMessage: errorMessage,
        });
        console.log(`[IMAP] Connection status updated: error - ${errorMessage}`);
      } catch (updateError) {
        console.error(`[IMAP] Failed to update connection status:`, updateError);
      }
    }

    return result;
  }

  async scanAllAccounts(): Promise<{ [key: string]: ScanResult }> {
    const accounts = await this.storage.getAllEmailAccounts();
    const activeAccounts = accounts.filter(acc => acc.isActive);

    console.log(`[IMAP] Starting scan for ${activeAccounts.length} active accounts`);

    const results: { [key: string]: ScanResult } = {};

    for (const account of activeAccounts) {
      results[account.email] = await this.scanAccount(account);
    }

    return results;
  }
}
