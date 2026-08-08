// lib/resend-email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export interface BatchEmailResult {
  batch: string[];
  data?: any;
  error?: any;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendBatchEmails({
  recipients,
  subject,
  html,
  onProgress,
}: {
  recipients: string[];
  subject: string;
  html: string;
  onProgress?: (sent: number, total: number) => void;
}): Promise<BatchEmailResult[]> {
  // Split into batches of 50 (Resend batch limit)
  const BATCH_SIZE = 50;
  const batches: string[][] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    batches.push(recipients.slice(i, i + BATCH_SIZE));
  }

  const results: BatchEmailResult[] = [];
  let sentCount = 0;

  for (const batch of batches) {
    try {
      const { data, error } = await resend.batch.send(
        batch.map(email => ({
          from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
          to: email,
          subject,
          html,
        }))
      );

      if (error) {
        results.push({ batch, error });
      } else {
        results.push({ batch, data });
        sentCount += batch.length;
      }
    } catch (error) {
      results.push({ batch, error });
    }

    if (onProgress) {
      onProgress(sentCount, recipients.length);
    }

    // Wait 1 second between batches to respect rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export function createMemberWelcomeEmail(memberName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EFSW! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear ${memberName},</p>
            <p>Thank you for joining the <strong>Eurasia Foundation for Social Work</strong>!</p>
            <p>Your membership application has been received and is currently under review. You will receive a notification once your account is approved.</p>
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our team will review your application within 1-2 business days</li>
              <li>You'll receive an email notification once approved</li>
              <li>After approval, you can access all member features</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/profile" class="button">View Your Profile</a>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br><strong>EFSW Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Eurasia Foundation for Social Work. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function createMemberApprovedEmail(memberName: string, memberType: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Membership Approved!</h1>
          </div>
          <div class="content">
            <p>Dear ${memberName},</p>
            <p>Great news! Your <span class="badge">${memberType.toUpperCase()}</span> membership has been approved.</p>
            <p><strong>You now have access to:</strong></p>
            <ul>
              <li>Member profile and digital membership card</li>
              <li>Academic documents and research papers</li>
              <li>Latest news and announcements</li>
              <li>Internal messaging system</li>
              <li>Training and event registration</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/login" class="button">Login to Your Account</a>
            <p>Welcome to the EFSW community! We're excited to have you with us.</p>
            <p>Best regards,<br><strong>EFSW Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Eurasia Foundation for Social Work. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function createBroadcastEmail(subject: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .footer a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EFSW Newsletter</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            ${body}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Eurasia Foundation for Social Work. All rights reserved.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/member/profile">Manage your preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function createPasswordResetEmail(memberName: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Dear ${memberName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
            </div>
            <p>For security reasons, please don't share this email with anyone.</p>
            <p>Best regards,<br><strong>EFSW Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Eurasia Foundation for Social Work. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
