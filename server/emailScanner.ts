import imaps from 'imap-simple';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import { analyzeEmail, generateAppointmentSuggestions, generateEmailResponse, generateTaskFromEmail } from './openai';
import type { IStorage } from './storage';
import type { EmailAccount, InsertEmail, InsertDocument, InsertAppointment } from '../shared/schema';
import { uploadFileToDrive, getOrCreateFolder, getOrCreateSubfolder } from './googleDrive';
import { forwardAttachments } from './emailForwarder';
import type { EmailAttachment } from './emailSender';

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
      // Fetch global settings for document extraction
      const settings = await this.storage.getAllSettings();
      const documentExtractionEnabled = settings.documentExtractionEnabled === true;
      const documentStorageProvider = settings.documentStorageProvider || 'google_drive';
      const isDocumentStorageEnabled = documentStorageProvider !== 'disabled';

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

          // Forward attachments if category has redirectEmails configured
          const redirectEmails = redirectEmailsMap.get(emailType) || [];
          if (redirectEmails.length > 0 && mail.attachments && mail.attachments.length > 0) {
            console.log(`[IMAP] Category '${emailType}' has ${redirectEmails.length} redirect email(s) configured`);
            
            // Convert mailparser attachments to EmailAttachment format
            const emailAttachments: EmailAttachment[] = mail.attachments.map(att => ({
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

          // Process attachments (only if document extraction is enabled)
          if (mail.attachments && mail.attachments.length > 0 && documentExtractionEnabled && isDocumentStorageEnabled && documentStorageProvider === 'google_drive') {
            console.log(`[IMAP] Processing ${mail.attachments.length} attachments for Google Drive...`);
            
            try {
              // Get or create main Google Drive folder
              const mainFolderId = await getOrCreateFolder('PME-Assistant-Documents');
              
              // Get or create category-specific subfolder
              const categoryFolderId = await getOrCreateSubfolder(mainFolderId, emailType);
              console.log(`[IMAP] Using category folder: ${emailType}`);
              
              for (const attachment of mail.attachments) {
                try {
                  const filename = attachment.filename || `attachment-${Date.now()}`;
                  const mimeType = attachment.contentType || 'application/octet-stream';
                  const buffer = attachment.content;

                  console.log(`[IMAP] Uploading attachment: ${filename} to /${emailType}/`);
                  
                  // Upload to Google Drive in category-specific folder
                  const uploadResult = await uploadFileToDrive(
                    filename,
                    mimeType,
                    buffer,
                    categoryFolderId
                  );

                  // Detect document type based on mime type and normalized email type
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
                    originalFilename: filename, // Store original filename
                    mimeType: mimeType,
                    size: buffer.length,
                    storageProvider: 'google_drive',
                    storagePath: uploadResult.fileId, // Store Drive file ID as path
                    driveFileId: uploadResult.fileId,
                    driveUrl: uploadResult.webViewLink,
                    documentType: documentType,
                  };

                  await this.storage.createDocument(documentData);
                  console.log(`[IMAP] Created document record for: ${filename}`);

                } catch (attachError) {
                  console.error(`[IMAP] Error processing attachment:`, attachError);
                }
              }
            } catch (driveError) {
              console.error(`[IMAP] Error with Google Drive:`, driveError);
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

      connection.end();
      console.log(`[IMAP] Scan complete for ${account.email}: ${result.created} new emails created`);

    } catch (error) {
      result.errors++;
      console.error(`[IMAP] Error scanning account ${account.email}:`, error);
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
