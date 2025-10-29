import type { EmailAccount } from '@shared/schema';
import { sendEmailResponse, type EmailAttachment } from './emailSender';
import type { IStorage } from './storage';

export interface ForwardAttachmentsParams {
  fromAccount: EmailAccount;
  recipientEmails: string[];
  originalSubject: string;
  originalFrom: string;
  attachments: EmailAttachment[];
}

/**
 * Forward email attachments to configured redirect addresses
 * Returns success status and any errors encountered
 */
export async function forwardAttachments(
  storage: IStorage,
  params: ForwardAttachmentsParams
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!params.recipientEmails || params.recipientEmails.length === 0) {
    return { success: true, errors: [] }; // No recipients, nothing to do
  }

  if (!params.attachments || params.attachments.length === 0) {
    console.log('[Forwarder] No attachments to forward');
    return { success: true, errors: [] }; // No attachments, nothing to do
  }

  console.log(`[Forwarder] Forwarding ${params.attachments.length} attachment(s) to ${params.recipientEmails.length} recipient(s)`);

  // Create a simple contextual message
  const forwardBody = `
Transfert automatique de pièces jointes

Email original de : ${params.originalFrom}
Objet : ${params.originalSubject}

Ce message a été généré automatiquement par IzyInbox.
Les pièces jointes de l'email ci-dessus vous ont été transférées automatiquement.
`.trim();

  // Send to each recipient
  for (const recipientEmail of params.recipientEmails) {
    try {
      console.log(`[Forwarder] Sending to ${recipientEmail}...`);
      
      const result = await sendEmailResponse(params.fromAccount, {
        to: recipientEmail,
        subject: `Transfert : ${params.originalSubject}`,
        body: forwardBody,
        textBody: forwardBody,
        attachments: params.attachments,
      });

      if (!result.success) {
        const errorMsg = `Failed to forward to ${recipientEmail}: ${result.error}`;
        console.error(`[Forwarder] ${errorMsg}`);
        errors.push(errorMsg);
        
        // Create an alert for failed forwarding
        try {
          await storage.createAlert({
            type: 'system',
            title: 'Échec de transfert automatique',
            message: `Impossible de transférer les pièces jointes à ${recipientEmail}. ${result.error}`,
            severity: 'high',
          });
        } catch (alertError) {
          console.error('[Forwarder] Failed to create alert for forwarding error:', alertError);
        }
      } else {
        console.log(`[Forwarder] Successfully forwarded to ${recipientEmail}`);
      }
    } catch (err) {
      const errorMsg = `Exception forwarding to ${recipientEmail}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[Forwarder] ${errorMsg}`);
      errors.push(errorMsg);
      
      // Create an alert for the exception
      try {
        await storage.createAlert({
          type: 'system',
          title: 'Erreur de transfert automatique',
          message: `Exception lors du transfert des pièces jointes à ${recipientEmail}.`,
          severity: 'high',
        });
      } catch (alertError) {
        console.error('[Forwarder] Failed to create alert for forwarding exception:', alertError);
      }
    }
  }

  const success = errors.length === 0;
  return { success, errors };
}
