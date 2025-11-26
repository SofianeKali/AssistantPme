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
            <h1>Bienvenue sur IzyInbox !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${params.firstName} ${params.lastName}</strong>,</p>
            <p>Votre compte utilisateur pour IzyInbox a été créé par votre administrateur.</p>
            <h3>Vos identifiants de connexion :</h3>
            <div class="password-box">
              <p><strong>Email :</strong><br>${params.to}</p>
              <p><strong>Mot de passe temporaire :</strong><br><span class="password">${params.temporaryPassword}</span></p>
            </div>
            <div class="warning">
              <strong>⚠️ IMPORTANT :</strong> Conservez ce mot de passe en lieu sûr. Vous pouvez le changer plus tard depuis votre profil.
            </div>
            <h3>Pour vous connecter :</h3>
            <ol>
              <li>Rendez-vous sur <a href="${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}">${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}</a></li>
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
              <p>IzyInbox</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const sendResult = await sendEmailResponse(
      adminEmailAccount,
      {
        to: params.to,
        subject: "Bienvenue sur IzyInbox - Vos identifiants",
        body: htmlContent,
        textBody: textContent,
      }
    );

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

interface SendCancellationEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  planName: string;
  adminEmailAccount: EmailAccount;
  accessEndDate?: Date;
  dataDeleteDate?: Date;
}

/**
 * Send a cancellation email when a subscription is cancelled
 */
export async function sendCancellationEmail(
  params: SendCancellationEmailParams,
): Promise<void> {
  try {
    const { adminEmailAccount } = params;

    console.log(
      `[EmailService] Preparing to send cancellation email to ${params.to}`,
    );

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const accessEndDateStr = params.accessEndDate ? formatDate(params.accessEndDate) : "fin de période";
    const dataDeleteDateStr = params.dataDeleteDate ? formatDate(params.dataDeleteDate) : "suite";

    const textContent = `
Résiliation de votre abonnement IzyInbox
========================================

Bonjour ${params.firstName} ${params.lastName},

Nous vous confirmons la résiliation de votre abonnement au plan ${params.planName}.

Informations importantes :

📅 CALENDRIER DE RÉSILIATION :
- Date de résiliation : aujourd'hui
- Accès maintenu jusqu'au : ${accessEndDateStr} (fin de votre période d'échéance)
- Suppression des données : ${dataDeleteDateStr} (le jour suivant la fin d'accès)

💳 FACTURATION :
- Aucun paiement supplémentaire ne sera facturé après la résiliation
- Vous aurez accès à IzyInbox jusqu'à la fin de votre période d'échéance

📊 VOS DONNÉES :
- Vos données restent accessibles pendant toute la durée de votre accès
- Elles seront supprimées définitivement le ${dataDeleteDateStr}
- Nous vous recommandons d'exporter vos données importantes avant cette date

Si vous changez d'avis, vous pouvez vous réabonner à tout moment via notre plateforme.

Pour toute question concernant cette résiliation, veuillez nous contacter.

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
            .info-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
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
            <h1>Résiliation de votre abonnement</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${params.firstName} ${params.lastName}</strong>,</p>
            <p>Nous vous confirmons la résiliation de votre abonnement au plan <strong>${params.planName}</strong>.</p>
            <div class="info-box">
              <h3>📅 Calendrier de résiliation :</h3>
              <ul>
                <li>Date de résiliation : aujourd'hui</li>
                <li>Accès maintenu jusqu'au : <strong>${params.accessEndDate ? formatDate(params.accessEndDate) : "fin de période"}</strong></li>
                <li>Suppression des données : <strong>${params.dataDeleteDate ? formatDate(params.dataDeleteDate) : "suite"}</strong></li>
              </ul>
            </div>
            <div class="info-box" style="background: #e0f2fe; border-left-color: #0284c7;">
              <h3>💳 Facturation :</h3>
              <ul>
                <li><strong>✓ Aucun paiement supplémentaire</strong> ne sera facturé après la résiliation</li>
                <li><strong>✓ Votre accès</strong> à IzyInbox reste actif jusqu'au <strong>${params.accessEndDate ? formatDate(params.accessEndDate) : "fin de période"}</strong></li>
              </ul>
            </div>
            <div class="info-box" style="background: #fce7f3; border-left-color: #ec4899;">
              <h3>📊 Vos données :</h3>
              <ul>
                <li><strong>✓ Vos données</strong> restent accessibles pendant toute la durée de votre accès</li>
                <li><strong>✓ Suppression</strong> le ${params.dataDeleteDate ? formatDate(params.dataDeleteDate) : "suite"}</li>
                <li style="color: #9d174d;">⚠️ Nous vous recommandons d'exporter vos données importantes avant cette date</li>
              </ul>
            </div>
            <p>Si vous changez d'avis, vous pouvez vous réabonner à tout moment via notre plateforme.</p>
            <p>Pour toute question concernant cette résiliation, veuillez nous contacter.</p>
            <div class="footer">
              <p>IzyInbox</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const sendResult = await sendEmailResponse(
      adminEmailAccount,
      {
        to: params.to,
        subject: "Résiliation de votre abonnement IzyInbox",
        body: htmlContent,
        textBody: textContent,
      }
    );

    if (!sendResult.success) {
      console.error(
        "[EmailService] SMTP error sending cancellation email:",
        sendResult.error,
      );
      throw new Error(`SMTP error: ${sendResult.error}`);
    }

    console.log(
      `[EmailService] Cancellation email sent successfully to ${params.to}`,
    );
  } catch (error) {
    console.error("[EmailService] Error sending cancellation email:", error);
    throw error;
  }
}

interface SendTrialWelcomeEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  adminEmailAccount: EmailAccount;
}

/**
 * Send a welcome email for trial users
 */
export async function sendTrialWelcomeEmail(
  params: SendTrialWelcomeEmailParams,
): Promise<void> {
  try {
    const { adminEmailAccount } = params;

    console.log(
      `[EmailService] Preparing to send trial welcome email to ${params.to}`,
    );

    const textContent = `
Bienvenue sur IzyInbox - Essai Gratuit 14 Jours !
=================================================

Bonjour ${params.firstName} ${params.lastName},

Merci de vous être inscrit à IzyInbox ! Vous disposez d'un accès gratuit pendant 14 jours.

Essai gratuit :
- Accès complet à toutes les fonctionnalités
- Aucune carte bancaire requise pour l'essai
- Premier paiement prévu le jour 15

Commencez votre exploration :
1. Connectez-vous à ${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}
2. Utilisez votre email : ${params.to}
3. Explorez les fonctionnalités d'automatisation

Pour toute question, n'hésitez pas à nous contacter.

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
            .trial-box {
              background: #dbeafe;
              border: 2px solid #0084ff;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .trial-days {
              font-size: 36px;
              font-weight: bold;
              color: #0084ff;
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
            <h1>Bienvenue sur IzyInbox !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${params.firstName} ${params.lastName}</strong>,</p>
            <p>Merci de vous être inscrit à IzyInbox ! Vous disposez d'un accès gratuit pendant 14 jours.</p>
            <div class="trial-box">
              <p><span class="trial-days">14</span> jours gratuits</p>
              <p>Accès complet à toutes les fonctionnalités</p>
            </div>
            <h3>Essai gratuit :</h3>
            <ul>
              <li>✓ Accès complet à toutes les fonctionnalités</li>
              <li>✓ Aucune carte bancaire requise pour l'essai</li>
              <li>✓ Premier paiement prévu le jour 15</li>
            </ul>
            <h3>Commencez votre exploration :</h3>
            <ol>
              <li>Connectez-vous à <a href="${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}">${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}</a></li>
              <li>Utilisez votre email : <strong>${params.to}</strong></li>
              <li>Explorez les fonctionnalités d'automatisation</li>
            </ol>
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            <div class="footer">
              <p>IzyInbox</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const sendResult = await sendEmailResponse(
      adminEmailAccount,
      {
        to: params.to,
        subject: "Bienvenue sur IzyInbox - Essai Gratuit 14 Jours",
        body: htmlContent,
        textBody: textContent,
      }
    );

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
