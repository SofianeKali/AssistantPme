import { sendEmailResponse } from "./emailSender";
import type { EmailAccount } from "@shared/schema";

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
export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams,
): Promise<void> {
  try {
    const { adminEmailAccount } = params;

    console.log(
      `[EmailService] Preparing to send welcome email to ${params.to} from ${adminEmailAccount.email} (SMTP)`,
    );
    console.log(
      `[EmailService] Temporary password length: ${params.temporaryPassword.length}`,
    );

    // Create plain text version (no HTML encoding issues)
    const textContent = `
Bienvenue sur IzyInbox !
========================

Bonjour ${params.firstName} ${params.lastName},

Votre compte utilisateur pour IzyInbox a été créé par votre administrateur.

Vos identifiants de connexion :

📧 Email : ${params.to}
🔑 Mot de passe temporaire : ${params.temporaryPassword}

⚠️ IMPORTANT : Conservez ce mot de passe en lieu sûr. Vous pouvez le changer plus tard depuis votre profil.

📋 Pour vous connecter :
1. Rendez-vous sur ${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}
2. Entrez votre adresse email : ${params.to}
3. Entrez le mot de passe temporaire ci-dessus
4. Vous serez redirigé vers votre cockpit

🎯 Prochaines étapes :
- Configurez votre compte email (Gmail, Outlook ou Yahoo)
- Explorez le cockpit et les fonctionnalités d'IA
- Commencez à automatiser votre gestion administrative !

Si vous avez des questions, n'hésitez pas à contacter votre administrateur.

---
IzyInbox
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `.trim();

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
            
            <p>Votre compte utilisateur pour <strong>IzyInbox</strong> a été créé par votre administrateur.</p>
            
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
              <a href="${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}" class="button">
                🚀 Se connecter maintenant
              </a>
            </p>
            
            <h3>📋 Pour vous connecter :</h3>
            <ol>
              <li>Cliquez sur le bouton "Se connecter" ci-dessus</li>
              <li>Entrez votre adresse email : <strong>${params.to}</strong></li>
              <li>Entrez le mot de passe temporaire ci-dessus</li>
              <li>Vous serez redirigé vers votre cockpit</li>
            </ol>
            
            <h3>🎯 Prochaines étapes :</h3>
            <ul>
              <li>Configurez votre compte email (Gmail, Outlook ou Yahoo)</li>
              <li>Explorez le cockpit et les fonctionnalités d'IA</li>
              <li>Commencez à automatiser votre gestion administrative !</li>
            </ul>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter votre administrateur.</p>
            
            <div class="footer">
              <p><strong>IzyInbox</strong></p>
              <p style="font-size: 12px; color: #9ca3af;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const sendResult = await sendEmailResponse(adminEmailAccount, {
      to: params.to,
      subject: "🎉 Bienvenue sur IzyInbox - Vos identifiants de connexion",
      body: htmlContent,
      textBody: textContent, // Include plain text version to avoid HTML encoding issues
    });

    if (!sendResult.success) {
      console.error(
        "[EmailService] SMTP error sending welcome email:",
        sendResult.error,
      );
      throw new Error(`SMTP error: ${sendResult.error}`);
    }

    console.log(
      `[EmailService] Welcome email sent successfully to ${params.to}`,
    );
    console.log(`[EmailService] SMTP Message ID: ${sendResult.messageId}`);
  } catch (error) {
    console.error("[EmailService] Error sending welcome email:", error);
    console.error(
      "[EmailService] Error details:",
      JSON.stringify(error, null, 2),
    );
    throw error;
  }
}

/**
 * Send a trial welcome email to a newly registered trial user
 */
export async function sendTrialWelcomeEmail(
  params: {
    to: string;
    firstName: string;
    lastName: string;
    temporaryPassword: string;
    trialEndsAt: Date;
    adminEmailAccount: EmailAccount;
  },
): Promise<void> {
  try {
    const { adminEmailAccount } = params;

    console.log(
      `[EmailService] Preparing to send trial welcome email to ${params.to} from ${adminEmailAccount.email} (SMTP)`,
    );

    const textContent = `
Bienvenue sur IzyInbox - Essai gratuit 14 jours !
==================================================

Bonjour ${params.firstName} ${params.lastName},

Votre essai gratuit de 14 jours a démarré avec succès !

Vos identifiants de connexion :

📧 Email : ${params.to}
🔑 Mot de passe temporaire : ${params.temporaryPassword}

⚠️ IMPORTANT : Nous vous recommandons de changer ce mot de passe lors de votre première connexion.

⏰ Votre essai se termine le : ${params.trialEndsAt.toLocaleDateString('fr-FR')}
   Vous pourrez ensuite souscrire au plan de votre choix pour continuer à utiliser IzyInbox.

📋 Pour vous connecter :
1. Rendez-vous sur ${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/login
2. Entrez votre adresse email : ${params.to}
3. Entrez le mot de passe temporaire ci-dessus
4. Profitez de toutes les fonctionnalités d'IzyInbox !

🎯 Pendant votre essai :
- Configurez votre compte email (Gmail, Outlook ou Yahoo)
- Explorez l'analyse automatique des emails par IA
- Testez la gestion des devis, factures et rendez-vous
- Découvrez les alertes personnalisées

À bientôt,
L'équipe IzyInbox
    `.trim();

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
            .trial-badge {
              background: #22c55e;
              color: white;
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
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
            .trial-info {
              background: #ecfdf5;
              border-left: 4px solid #22c55e;
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
            <span class="trial-badge">✨ Essai gratuit 14 jours</span>
            <p>Profitez de toutes les fonctionnalités sans engagement</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${params.firstName} ${params.lastName},</p>
            
            <p>Votre essai gratuit de <strong>14 jours</strong> a démarré avec succès !</p>
            
            <div class="trial-info">
              <strong>⏰ Fin de l'essai :</strong> ${params.trialEndsAt.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              <br>
              <small>Vous pourrez ensuite souscrire au plan de votre choix pour continuer à utiliser IzyInbox.</small>
            </div>
            
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
              <strong>⚠️ Important :</strong> Nous vous recommandons de changer ce mot de passe lors de votre première connexion.
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/login" class="button">
                🚀 Se connecter maintenant
              </a>
            </p>
            
            <h3>🎯 Pendant votre essai :</h3>
            <ul>
              <li>Configurez votre compte email (Gmail, Outlook ou Yahoo)</li>
              <li>Explorez l'analyse automatique des emails par IA</li>
              <li>Testez la gestion des devis, factures et rendez-vous</li>
              <li>Découvrez les alertes personnalisées</li>
            </ul>
            
            <p>Profitez pleinement de votre essai !</p>
            
            <div class="footer">
              <p><strong>IzyInbox</strong></p>
              <p style="font-size: 12px; color: #9ca3af;">Cet email a été envoyé automatiquement.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const sendResult = await sendEmailResponse(adminEmailAccount, {
      to: params.to,
      subject: "🎉 Bienvenue sur IzyInbox - Essai gratuit 14 jours",
      body: htmlContent,
      textBody: textContent,
    });

    if (!sendResult.success) {
      console.error(
        "[EmailService] SMTP error sending trial welcome email:",
        sendResult.error,
      );
      throw new Error(`SMTP error: ${sendResult.error}`);
    }

    console.log(
      `[EmailService] Trial welcome email sent successfully to ${params.to}`,
    );
    console.log(`[EmailService] SMTP Message ID: ${sendResult.messageId}`);
  } catch (error) {
    console.error("[EmailService] Error sending trial welcome email:", error);
    console.error(
      "[EmailService] Error details:",
      JSON.stringify(error, null, 2),
    );
    throw error;
  }
}

/**
 * Generate a secure random temporary password
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special char

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
