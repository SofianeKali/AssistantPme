import { sendEmailResponse } from './emailSender';
import type { EmailAccount } from '@shared/schema';

interface SendWelcomeEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  adminEmailAccount: EmailAccount;
}

/**
 * Send a welcome email to a newly created user with their temporary password
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void> {
  try {
    const { adminEmailAccount } = params;
    
    console.log(`[EmailService] Preparing to send welcome email to ${params.to} from ${adminEmailAccount.email} (SMTP)`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1a2744 0%, #00d9ff 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .password-box {
              background: white;
              border: 2px solid #00d9ff;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .password {
              font-size: 24px;
              font-weight: bold;
              color: #1a2744;
              letter-spacing: 2px;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              background: #1a2744;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Bienvenue sur IzyInbox !</h1>
            <p>Votre compte a été créé avec succès</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${params.firstName} ${params.lastName},</p>
            
            <p>Votre compte utilisateur pour <strong>IzyInbox</strong> (Smart Automation for Busy Managers) a été créé par votre administrateur.</p>
            
            <p>Voici vos identifiants de connexion :</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; color: #1a2744; font-size: 15px;"><strong>📧 Email :</strong></p>
              <p style="margin: 0; color: #1a2744; font-weight: 600;">${params.to}</p>
            </div>
            
            <div class="password-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">🔑 Mot de passe temporaire</p>
              <div class="password">${params.temporaryPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Conservez ce mot de passe en lieu sûr. Vous pouvez le changer plus tard depuis votre profil.
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}" class="button">
                🚀 Se connecter maintenant
              </a>
            </p>
            
            <h3>📋 Pour vous connecter :</h3>
            <ol>
              <li>Cliquez sur le bouton "Se connecter" ci-dessus</li>
              <li>Entrez votre adresse email : <strong>${params.to}</strong></li>
              <li>Entrez le mot de passe temporaire ci-dessus</li>
              <li>Vous serez redirigé vers votre tableau de bord</li>
            </ol>
            
            <h3>🎯 Prochaines étapes :</h3>
            <ul>
              <li>Configurez votre compte email (Gmail, Outlook ou Yahoo)</li>
              <li>Explorez le tableau de bord et les fonctionnalités d'IA</li>
              <li>Commencez à automatiser votre gestion administrative !</li>
            </ul>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter votre administrateur.</p>
            
            <div class="footer">
              <p><strong>IzyInbox</strong> - Smart Automation for Busy Managers</p>
              <p style="font-size: 12px; color: #9ca3af;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const sendResult = await sendEmailResponse(adminEmailAccount, {
      to: params.to,
      subject: '🎉 Bienvenue sur IzyInbox - Vos identifiants de connexion',
      body: htmlContent,
    });

    if (!sendResult.success) {
      console.error('[EmailService] SMTP error sending welcome email:', sendResult.error);
      throw new Error(`SMTP error: ${sendResult.error}`);
    }

    console.log(`[EmailService] Welcome email sent successfully to ${params.to}`);
    console.log(`[EmailService] SMTP Message ID: ${sendResult.messageId}`);
  } catch (error) {
    console.error('[EmailService] Error sending welcome email:', error);
    console.error('[EmailService] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Generate a secure random temporary password
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
