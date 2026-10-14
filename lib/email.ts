// Email service using Resend API
let resendInstance: any = null;

function getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      resendInstance = new Resend(process.env.RESEND_API_KEY);
    } catch (error) {
      console.error('Failed to initialize Resend:', error);
    }
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@eurasiaforumsw.org';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Eurasia Forum for Social Workers';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const resend = getResend();
  if (!resend) {
    console.error('Resend client not initialized');
    return { success: false, error: 'Email service unavailable' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Failed to send email:', err);
    return { success: false, error: err.message };
  }
}

// Generate email template with layout
export function generateEmailTemplate(bodyHtml: string, preheader?: string, coverImage?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${preheader ? `<meta name="description" content="${preheader}">` : ''}
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #eee;
          }
          .cover-image {
            width: 100%;
            height: auto;
            display: block;
          }
          .content {
            padding: 30px 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #0066cc;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; color: #0066cc;">Eurasia Forum for Social Workers</h2>
          </div>
          ${coverImage ? `<img src="${coverImage}" alt="Cover" class="cover-image">` : ''}
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Eurasia Forum for Social Workers. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Send campaign emails in batches
export async function sendCampaignEmails(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  html: string,
  text?: string
): Promise<{ results: Array<{ email: string; emailId?: string; error?: string }> }> {
  const results: Array<{ email: string; emailId?: string; error?: string }> = [];
  const resend = getResend();

  if (!resend) {
    return {
      results: recipients.map(r => ({ email: r.email, error: 'Email service not initialized' }))
    };
  }

  // Send in batches of 100 (Resend's batch limit)
  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100);

    for (const recipient of batch) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: recipient.email,
          subject,
          html,
          text,
        });

        if (error) {
          results.push({ email: recipient.email, error: error.message });
        } else {
          results.push({ email: recipient.email, emailId: data?.id });
        }
      } catch (err: any) {
        results.push({ email: recipient.email, error: err.message });
      }
    }
  }

  return { results };
}

// Email templates
export const emailTemplates = {
  verification: (verificationUrl: string, memberName: string) => ({
    subject: 'Verify your email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to Eurasia Forum for Social Workers</h2>
            <p>Hi ${memberName},</p>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy this link to your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Eurasia Forum for Social Workers\n\nHi ${memberName},\n\nThank you for registering. Please verify your email address by visiting:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, you can safely ignore this email.`
  }),

  passwordReset: (resetUrl: string, memberName: string) => ({
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>Hi ${memberName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy this link to your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Reset Your Password\n\nHi ${memberName},\n\nWe received a request to reset your password. Visit the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`
  }),

  welcomeEmail: (memberName: string, loginUrl: string) => ({
    subject: 'Welcome to Eurasia Forum for Social Workers',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Your Email is Verified!</h2>
            <p>Hi ${memberName},</p>
            <p>Your email has been successfully verified. You can now access all member features.</p>
            <a href="${loginUrl}" class="button">Sign In Now</a>
            <p>We're excited to have you as part of our community.</p>
            <div class="footer">
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your Email is Verified!\n\nHi ${memberName},\n\nYour email has been successfully verified. You can now access all member features.\n\nSign in at: ${loginUrl}\n\nWe're excited to have you as part of our community.`
  })
};
