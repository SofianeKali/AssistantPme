import { getUncachableResendClient } from './resendClient';

interface SendWelcomeEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
}

/**
 * Send a welcome email to a newly created user with their temporary password
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
              border: 2px solid #667eea;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .password {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
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
              background: #667eea;
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
            <h1>🎉 Bienvenue !</h1>
            <p>Votre compte a été créé avec succès</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${params.firstName} ${params.lastName},</p>
            
            <p>Votre compte utilisateur pour l'Assistant Administratif Intelligent a été créé par votre administrateur.</p>
            
            <p>Voici vos identifiants de connexion :</p>
            
            <div class="password-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Mot de passe temporaire</p>
              <div class="password">${params.temporaryPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Ce mot de passe est temporaire. Pour des raisons de sécurité, vous devrez le changer lors de votre première connexion.
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}" class="button">
                Se connecter maintenant
              </a>
            </p>
            
            <h3>Premiers pas :</h3>
            <ol>
              <li>Connectez-vous avec l'adresse email : <strong>${params.to}</strong></li>
              <li>Utilisez le mot de passe temporaire ci-dessus</li>
              <li>Configurez votre compte email (Gmail, Outlook ou Yahoo)</li>
              <li>Commencez à gérer vos emails intelligemment !</li>
            </ol>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter votre administrateur.</p>
            
            <div class="footer">
              <p>Assistant Administratif Intelligent pour PME</p>
              <p style="font-size: 12px; color: #9ca3af;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject: '🎉 Bienvenue - Votre compte a été créé',
      html: htmlContent,
    });

    console.log(`[EmailService] Welcome email sent to ${params.to}`);
  } catch (error) {
    console.error('[EmailService] Error sending welcome email:', error);
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
