/**
 * Resend Email Service Wrapper
 *
 * Handles email sending via Resend API
 * API Key: stored in RESEND_API_KEY environment variable
 * Docs: https://resend.com/docs
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@efsw.org';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

export interface BatchEmailOptions {
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
  }>;
  from?: string;
}

export interface BatchEmailResponse {
  success: boolean;
  results: Array<{
    email: string;
    emailId?: string;
    error?: string;
  }>;
  totalSent: number;
  totalFailed: number;
}

/**
 * Send a single email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        tags: options.tags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Resend API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      emailId: data.id,
    };
  } catch (error) {
    console.error('[sendEmail] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send batch emails via Resend (up to 100 per batch)
 * Automatically chunks large batches
 */
export async function sendBatchEmails(options: BatchEmailOptions): Promise<BatchEmailResponse> {
  const BATCH_SIZE = 100; // Resend's max batch size
  const results: BatchEmailResponse['results'] = [];
  let totalSent = 0;
  let totalFailed = 0;

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    // Split into chunks of 100
    const chunks = [];
    for (let i = 0; i < options.emails.length; i += BATCH_SIZE) {
      chunks.push(options.emails.slice(i, i + BATCH_SIZE));
    }

    // Send each chunk
    for (const chunk of chunks) {
      const batchPayload = chunk.map((email) => ({
        from: options.from || FROM_EMAIL,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }));

      const response = await fetch(`${RESEND_API_URL}/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Mark all emails in this chunk as failed
        chunk.forEach((email) => {
          results.push({
            email: email.to,
            error: errorData.message || `Batch send failed: ${response.status}`,
          });
          totalFailed++;
        });
        continue;
      }

      const data = await response.json();

      // Resend returns array of results
      if (Array.isArray(data.data)) {
        data.data.forEach((item: any, index: number) => {
          const email = chunk[index];
          if (item.id) {
            results.push({
              email: email.to,
              emailId: item.id,
            });
            totalSent++;
          } else {
            results.push({
              email: email.to,
              error: item.error || 'Unknown error',
            });
            totalFailed++;
          }
        });
      }
    }

    return {
      success: totalFailed === 0,
      results,
      totalSent,
      totalFailed,
    };
  } catch (error) {
    console.error('[sendBatchEmails] Error:', error);

    // Mark all remaining emails as failed
    options.emails.forEach((email) => {
      if (!results.find((r) => r.email === email.to)) {
        results.push({
          email: email.to,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        totalFailed++;
      }
    });

    return {
      success: false,
      results,
      totalSent,
      totalFailed,
    };
  }
}

/**
 * Send campaign to multiple recipients
 * Handles batching and progress tracking
 */
export async function sendCampaignEmails(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  html: string,
  text?: string,
  onProgress?: (sent: number, total: number) => void
): Promise<BatchEmailResponse> {
  const emails = recipients.map((recipient) => ({
    to: recipient.email,
    subject,
    html: html.replace('{{name}}', recipient.name || 'Member'),
    text: text?.replace('{{name}}', recipient.name || 'Member'),
  }));

  const BATCH_SIZE = 100;
  const results: BatchEmailResponse['results'] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    const batchResult = await sendBatchEmails({
      emails: chunk,
    });

    results.push(...batchResult.results);
    totalSent += batchResult.totalSent;
    totalFailed += batchResult.totalFailed;

    // Report progress
    if (onProgress) {
      onProgress(totalSent + totalFailed, emails.length);
    }

    // Rate limiting: wait 1 second between batches
    if (i + BATCH_SIZE < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    success: totalFailed === 0,
    results,
    totalSent,
    totalFailed,
  };
}

/**
 * Verify Resend API key is valid
 */
export async function verifyResendApiKey(): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      return false;
    }

    const response = await fetch('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[verifyResendApiKey] Error:', error);
    return false;
  }
}

/**
 * Generate HTML email template
 */
export function generateEmailTemplate(
  body: string,
  preheader?: string,
  headerImageUrl?: string
): string {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
  const safePreheader = preheader ? escapeHtml(preheader) : '';
  const safeImageUrl = headerImageUrl && /^https?:\/\//i.test(headerImageUrl)
    ? escapeHtml(headerImageUrl) : '';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${safePreheader ? `<meta name="description" content="${safePreheader}">` : ''}
  <title>Eurasia Forum for Social Work</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #1a1a2e;
      padding: 30px 20px;
      text-align: center;
    }
    .header img {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    a {
      color: #0066cc;
    }
    h1, h2, h3 {
      color: #1a1a2e;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  ${safePreheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${safePreheader}</div>` : ''}

  <div class="container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">Eurasia Forum for Social Work</h1>
    </div>

    ${safeImageUrl ? `<img src="${safeImageUrl}" alt="Header" style="width: 100%; height: auto;">` : ''}

    <div class="content">
      ${body}
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Eurasia Forum for Social Work. All rights reserved.</p>
      <p>
        <a href="https://efsw.org">Visit our website</a> |
        <a href="mailto:info@efsw.org">Contact us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
