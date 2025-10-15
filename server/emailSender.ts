import nodemailer from 'nodemailer';
import type { EmailAccount } from '@shared/schema';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string; // Original message ID for threading
  references?: string; // For email threading
}

export async function sendEmailResponse(
  emailAccount: EmailAccount,
  params: SendEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Create nodemailer transporter with SMTP configuration
    const transportConfig: any = {
      host: emailAccount.smtpHost,
      port: emailAccount.smtpPort,
      secure: emailAccount.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: emailAccount.username,
        pass: emailAccount.password,
      },
    };

    // Only disable TLS verification in development environment (Replit)
    // SECURITY: This should NEVER be used in production
    if (process.env.NODE_ENV === 'development' && process.env.REPL_ID) {
      console.warn('[SMTP] WARNING: TLS certificate verification is disabled for Replit development environment');
      transportConfig.tls = {
        rejectUnauthorized: false
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify SMTP connection
    await transporter.verify();
    console.log('[SMTP] Connection verified successfully');

    // Prepare email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: {
        name: emailAccount.email.split('@')[0], // Use email username as display name
        address: emailAccount.email,
      },
      to: params.to,
      subject: params.subject.startsWith('Re:') ? params.subject : `Re: ${params.subject}`,
      text: params.body,
      html: params.body.replace(/\n/g, '<br>'), // Simple HTML conversion
    };

    // Add email threading headers if provided
    if (params.inReplyTo) {
      mailOptions.inReplyTo = params.inReplyTo;
    }
    if (params.references) {
      mailOptions.references = params.references;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP] Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[SMTP] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
