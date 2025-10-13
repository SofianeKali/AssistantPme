import imaps from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import { analyzeEmail } from './openai';
import type { IStorage } from './storage';
import type { EmailAccount, InsertEmail } from '../shared/schema';

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
      const config = {
        imap: {
          user: account.username,
          password: account.password,
          host: account.imapHost,
          port: account.imapPort,
          tls: true,
          authTimeout: 10000,
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

          // Analyze email with GPT
          const analysis = await analyzeEmail({
            subject: mail.subject || 'Sans objet',
            body: mail.text || mail.html || '',
            from: mail.from?.text || 'Inconnu',
          });

          // Create email record
          const emailData: InsertEmail = {
            emailAccountId: account.id,
            messageId: mail.messageId || `${Date.now()}-${Math.random()}`,
            subject: mail.subject || 'Sans objet',
            from: mail.from?.text || 'Inconnu',
            to: mail.to?.text || '',
            cc: mail.cc?.text || '',
            body: mail.text || '',
            htmlBody: mail.html || '',
            receivedAt: mail.date || new Date(),
            emailType: analysis.emailType,
            priority: analysis.priority,
            sentiment: analysis.sentiment,
            aiAnalysis: {
              summary: analysis.summary,
              extractedData: analysis.extractedData,
              suggestedTags: analysis.suggestedTags,
            },
            hasAttachments: (mail.attachments?.length || 0) > 0,
            requiresResponse: analysis.emailType === 'devis' || analysis.priority === 'urgent',
            responseDeadline: analysis.emailType === 'devis' 
              ? new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h for quotes
              : undefined,
          };

          const createdEmail = await this.storage.createEmail(emailData);
          result.created++;

          console.log(`[IMAP] Created email: ${createdEmail.id} - ${mail.subject}`);

          // Store attachments info for later processing (task 2)
          if (mail.attachments && mail.attachments.length > 0) {
            console.log(`[IMAP] Email has ${mail.attachments.length} attachments (will be processed separately)`);
            // We'll handle attachments in task 2
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
