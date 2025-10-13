import type { IStorage } from './storage';
import type { InsertAlert } from '../shared/schema';

export class AlertService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async generateAlerts(): Promise<{ created: number; errors: number }> {
    const result = { created: 0, errors: 0 };

    console.log('[Alerts] Starting alert generation...');

    try {
      // 1. Check for quotes without response (48h)
      await this.checkQuotesWithoutResponse(result);

      // 2. Check for unpaid invoices (15 days)
      await this.checkUnpaidInvoices(result);

      // 3. Check for unprocessed emails
      await this.checkUnprocessedEmails(result);

      console.log(`[Alerts] Alert generation complete - Created: ${result.created}, Errors: ${result.errors}`);
    } catch (error) {
      console.error('[Alerts] Error during alert generation:', error);
      result.errors++;
    }

    return result;
  }

  private async checkQuotesWithoutResponse(result: { created: number; errors: number }): Promise<void> {
    try {
      const emails = await this.storage.getEmails({ type: 'devis' });
      const now = new Date();
      
      // Fetch all existing unresolved alerts once
      const existingAlerts = await this.storage.getAlerts();
      const unresolvedAlerts = existingAlerts.filter(a => !a.isResolved);

      for (const email of emails) {
        // Skip if already processed (status is 'traite' or 'archive')
        if (email.status === 'traite' || email.status === 'archive') continue;

        // Check if 48 hours have passed since responseDeadline
        if (email.responseDeadline && email.responseDeadline < now) {
          // Check if unresolved alert already exists for this email
          const hasUnresolvedAlert = unresolvedAlerts.some(
            alert => 
              alert.relatedEntityType === 'email' &&
              alert.relatedEntityId === email.id && 
              alert.type === 'devis_sans_reponse'
          );

          if (!hasUnresolvedAlert) {
            const alertData: InsertAlert = {
              type: 'devis_sans_reponse',
              severity: 'critical',
              title: `Devis sans réponse: ${email.subject}`,
              message: `Le devis de ${email.from} n'a pas reçu de réponse depuis plus de 48h`,
              relatedEntityType: 'email',
              relatedEntityId: email.id,
            };

            await this.storage.createAlert(alertData);
            result.created++;
            console.log(`[Alerts] Created quote alert for email: ${email.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[Alerts] Error checking quotes:', error);
      result.errors++;
    }
  }

  private async checkUnpaidInvoices(result: { created: number; errors: number }): Promise<void> {
    try {
      const emails = await this.storage.getEmails({ type: 'facture' });
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      
      // Fetch all existing unresolved alerts once
      const existingAlerts = await this.storage.getAlerts();
      const unresolvedAlerts = existingAlerts.filter(a => !a.isResolved);

      for (const email of emails) {
        // Skip if already processed (status is 'traite' or 'archive')
        if (email.status === 'traite' || email.status === 'archive') continue;

        // Check if email is older than 15 days
        if (email.receivedAt < fifteenDaysAgo) {
          // Check if unresolved alert already exists for this email
          const hasUnresolvedAlert = unresolvedAlerts.some(
            alert => 
              alert.relatedEntityType === 'email' &&
              alert.relatedEntityId === email.id && 
              alert.type === 'facture_impayee'
          );

          if (!hasUnresolvedAlert) {
            const alertData: InsertAlert = {
              type: 'facture_impayee',
              severity: 'warning',
              title: `Facture impayée: ${email.subject}`,
              message: `La facture de ${email.from} n'a pas été traitée depuis plus de 15 jours`,
              relatedEntityType: 'email',
              relatedEntityId: email.id,
            };

            await this.storage.createAlert(alertData);
            result.created++;
            console.log(`[Alerts] Created invoice alert for email: ${email.id}`);
          }
        }
      }
    } catch (error) {
      console.error('[Alerts] Error checking invoices:', error);
      result.errors++;
    }
  }

  private async checkUnprocessedEmails(result: { created: number; errors: number }): Promise<void> {
    try {
      // Get all emails - we'll filter in memory for proper logic
      const allEmails = await this.storage.getEmails();
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Filter for unprocessed urgent emails older than 24h (status is not 'traite' or 'archive')
      const urgentUnprocessedEmails = allEmails.filter(
        email => 
          email.status !== 'traite' && 
          email.status !== 'archive' && 
          email.priority === 'urgent' &&
          email.receivedAt < twentyFourHoursAgo
      );
      
      // Fetch all existing unresolved alerts once
      const existingAlerts = await this.storage.getAlerts();
      const unresolvedAlerts = existingAlerts.filter(a => !a.isResolved);

      for (const email of urgentUnprocessedEmails) {
        // Check if unresolved alert already exists for this email
        const hasUnresolvedAlert = unresolvedAlerts.some(
          alert => 
            alert.relatedEntityType === 'email' &&
            alert.relatedEntityId === email.id && 
            alert.type === 'email_non_traite'
        );

        if (!hasUnresolvedAlert) {
          const alertData: InsertAlert = {
            type: 'email_non_traite',
            severity: 'warning',
            title: `Email urgent non traité: ${email.subject}`,
            message: `L'email urgent de ${email.from} n'a pas été traité depuis plus de 24h`,
            relatedEntityType: 'email',
            relatedEntityId: email.id,
          };

          await this.storage.createAlert(alertData);
          result.created++;
          console.log(`[Alerts] Created unprocessed email alert for: ${email.id}`);
        }
      }
    } catch (error) {
      console.error('[Alerts] Error checking unprocessed emails:', error);
      result.errors++;
    }
  }
}
