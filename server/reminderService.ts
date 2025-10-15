import { storage } from './storage';
import { generateReminderEmail } from './openai';
import type { InsertReminder } from '@shared/schema';

export class ReminderService {
  private storage = storage;

  async generateAndSendReminders(): Promise<{ created: number; sent: number; errors: number }> {
    const result = { created: 0, sent: 0, errors: 0 };

    console.log('[Reminders] Starting reminder generation...');

    // Check for quotes without response (after 48h)
    await this.checkQuotesReminders(result);

    // Check for unpaid invoices (after 15 days)
    await this.checkInvoiceReminders(result);

    console.log(`[Reminders] Reminder generation complete - Created: ${result.created}, Sent: ${result.sent}, Errors: ${result.errors}`);
    
    return result;
  }

  private async checkQuotesReminders(result: { created: number; sent: number; errors: number }): Promise<void> {
    try {
      const emails = await this.storage.getAllEmails({ type: 'devis' });
      const now = new Date();

      for (const email of emails) {
        // Skip if already processed
        if (email.status === 'traite' || email.status === 'archive') continue;

        // Get existing reminders for this email (ALL reminders, not just sent)
        const existingReminders = await this.storage.getReminders(email.id);
        
        // Check if there's already a pending (unsent) reminder - skip to avoid duplicates
        const hasPendingReminder = existingReminders.some(r => !r.isSent);
        if (hasPendingReminder) {
          console.log(`[Reminders] Pending reminder exists for quote email: ${email.id}, skipping...`);
          continue;
        }

        // Count total reminders (sent or pending) to enforce max 3 reminders
        const totalReminders = existingReminders.length;
        
        // Only send up to 3 reminders
        if (totalReminders >= 3) {
          console.log(`[Reminders] Max reminders (3) reached for quote email: ${email.id}`);
          continue;
        }

        // Determine next reminder number
        const reminderNumber = totalReminders + 1;

        // For first reminder: Check if 48 hours have passed since responseDeadline
        if (reminderNumber === 1) {
          if (!email.responseDeadline) {
            continue; // No deadline set, skip
          }
          
          const hoursSinceDeadline = (now.getTime() - email.responseDeadline.getTime()) / (1000 * 60 * 60);
          if (hoursSinceDeadline < 48) {
            console.log(`[Reminders] Waiting 48h after deadline for first reminder: ${email.id}`);
            continue;
          }
        }
        
        // For subsequent reminders: Check if 48 hours have passed since last sent reminder
        if (reminderNumber > 1) {
          const sentReminders = existingReminders.filter(r => r.isSent).sort((a, b) => 
            (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0)
          );
          
          if (sentReminders.length === 0) {
            console.log(`[Reminders] No sent reminders found for follow-up: ${email.id}`);
            continue;
          }
          
          const lastSentReminder = sentReminders[0];
          const hoursSinceLastSent = (now.getTime() - (lastSentReminder.sentAt?.getTime() || 0)) / (1000 * 60 * 60);
          if (hoursSinceLastSent < 48) {
            console.log(`[Reminders] Waiting 48h since last sent reminder for: ${email.id}`);
            continue;
          }
        }

          // Generate reminder content using GPT
          const reminderContent = await generateReminderEmail({
            emailSubject: email.subject || 'Demande de devis',
            emailBody: email.body || '',
            recipientEmail: email.from,
            reminderType: 'devis_sans_reponse',
            reminderNumber: reminderNumber,
          });

          // Create reminder record
          const reminderData: InsertReminder = {
            emailId: email.id,
            reminderType: 'devis_sans_reponse',
            reminderNumber: reminderNumber,
            subject: reminderContent.subject,
            body: reminderContent.body,
            sentToEmail: email.from,
            isSent: false, // Will be set to true when actually sent via SMTP
          };

          const reminder = await this.storage.createReminder(reminderData);
          result.created++;
          
          // TODO: Implement actual SMTP sending
          // For now, just mark as sent for testing
          // await this.sendReminderEmail(reminder);
          
          console.log(`[Reminders] Created quote reminder #${reminderNumber} for email: ${email.id}`);
      }
    } catch (error) {
      console.error('[Reminders] Error checking quote reminders:', error);
      result.errors++;
    }
  }

  private async checkInvoiceReminders(result: { created: number; sent: number; errors: number }): Promise<void> {
    try {
      const emails = await this.storage.getAllEmails({ type: 'facture' });
      const now = new Date();

      for (const email of emails) {
        // Skip if already processed
        if (email.status === 'traite' || email.status === 'archive') continue;

        // Get existing reminders for this email (ALL reminders, not just sent)
        const existingReminders = await this.storage.getReminders(email.id);
        
        // Check if there's already a pending (unsent) reminder - skip to avoid duplicates
        const hasPendingReminder = existingReminders.some(r => !r.isSent);
        if (hasPendingReminder) {
          console.log(`[Reminders] Pending reminder exists for invoice email: ${email.id}, skipping...`);
          continue;
        }

        // Count total reminders (sent or pending) to enforce max 3 reminders
        const totalReminders = existingReminders.length;
        
        // Only send up to 3 reminders
        if (totalReminders >= 3) {
          console.log(`[Reminders] Max reminders (3) reached for invoice email: ${email.id}`);
          continue;
        }

        // Determine next reminder number
        const reminderNumber = totalReminders + 1;

        // For first reminder: Check if 15 days have passed since receivedAt
        if (reminderNumber === 1) {
          const daysSinceReceived = (now.getTime() - email.receivedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceReceived < 15) {
            console.log(`[Reminders] Waiting 15 days before first invoice reminder: ${email.id}`);
            continue;
          }
        }
        
        // For subsequent reminders: Check if 7 days have passed since last sent reminder
        if (reminderNumber > 1) {
          const sentReminders = existingReminders.filter(r => r.isSent).sort((a, b) => 
            (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0)
          );
          
          if (sentReminders.length === 0) {
            console.log(`[Reminders] No sent reminders found for follow-up: ${email.id}`);
            continue;
          }
          
          const lastSentReminder = sentReminders[0];
          const daysSinceLastSent = (now.getTime() - (lastSentReminder.sentAt?.getTime() || 0)) / (1000 * 60 * 60 * 24);
          if (daysSinceLastSent < 7) {
            console.log(`[Reminders] Waiting 7 days since last sent invoice reminder for: ${email.id}`);
            continue;
          }
        }

          // Generate reminder content using GPT
          const reminderContent = await generateReminderEmail({
            emailSubject: email.subject || 'Facture impayée',
            emailBody: email.body || '',
            recipientEmail: email.from,
            reminderType: 'facture_impayee',
            reminderNumber: reminderNumber,
          });

          // Create reminder record
          const reminderData: InsertReminder = {
            emailId: email.id,
            reminderType: 'facture_impayee',
            reminderNumber: reminderNumber,
            subject: reminderContent.subject,
            body: reminderContent.body,
            sentToEmail: email.from,
            isSent: false, // Will be set to true when actually sent via SMTP
          };

          const reminder = await this.storage.createReminder(reminderData);
          result.created++;
          
          // TODO: Implement actual SMTP sending
          // await this.sendReminderEmail(reminder);
          
          console.log(`[Reminders] Created invoice reminder #${reminderNumber} for email: ${email.id}`);
      }
    } catch (error) {
      console.error('[Reminders] Error checking invoice reminders:', error);
      result.errors++;
    }
  }

  // TODO: Implement SMTP email sending
  // private async sendReminderEmail(reminder: Reminder): Promise<void> {
  //   // Use nodemailer or similar to send email via SMTP
  //   // Update reminder.isSent = true and reminder.sentAt
  // }
}

export const reminderService = new ReminderService();
