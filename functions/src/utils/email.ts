// functions/src/utils/email.ts
// Email sending utility using Resend

import {Resend} from "resend";
import {defineSecret} from "firebase-functions/params";

// Define types locally (mirrors @trogern/domain types)
type NotificationCategory = "support" | "service" | "licence" | "income" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

// ============================================
// SECRET CONFIGURATION
// ============================================

/**
 * Resend API key - must be set via:
 * firebase functions:secrets:set RESEND_API_KEY
 */
export const resendApiKey = defineSecret("RESEND_API_KEY");

// ============================================
// TYPES
// ============================================

export interface SendEmailParams {
    to: string;
    toName: string;
    subject: string;
    body: string;
    actionUrl?: string;
    actionLabel?: string;
    priority: NotificationPriority;
    category: NotificationCategory;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

// From email address - customize for your domain
const FROM_EMAIL = "Fleet Manager <notifications@trogern.com>";

// App URL - should be set via environment variable
const APP_URL = process.env.APP_URL || "https://app.trogern.com";

// Priority styling configuration
const PRIORITY_CONFIG = {
  low: {
    color: "#6B7280",
    bgColor: "#F3F4F6",
    label: "",
    icon: "",
  },
  normal: {
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    label: "",
    icon: "",
  },
  high: {
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    label: "⚠️ ",
    icon: "⚠️",
  },
  urgent: {
    color: "#EF4444",
    bgColor: "#FEF2F2",
    label: "🚨 URGENT: ",
    icon: "🚨",
  },
};

// Category icons for email headers
const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  support: "💬",
  service: "🔧",
  licence: "📄",
  income: "💰",
  system: "⚙️",
};

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Generate HTML email template
 */
function generateEmailHtml(params: SendEmailParams): string {
  const style = PRIORITY_CONFIG[params.priority];
  const categoryIcon = CATEGORY_ICONS[params.category];

  // Build CTA button HTML
  const ctaHtml = params.actionUrl ?
    `<table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td style="background-color: ${style.color}; border-radius: 6px;">
            <a href="${APP_URL}${params.actionUrl}" 
               style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
              ${params.actionLabel || "View Details"} →
            </a>
          </td>
        </tr>
      </table>` :
    "";

  // Build urgent notice HTML
  const urgentHtml =
        params.priority === "urgent" ?
          `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
        <tr>
          <td style="background-color: ${style.bgColor}; border-left: 4px solid ${style.color}; padding: 16px; border-radius: 0 6px 6px 0;">
            <p style="margin: 0; font-size: 14px; color: ${style.color}; font-weight: 600;">
              ${style.icon} This requires your immediate attention.
            </p>
          </td>
        </tr>
      </table>` :
          "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color: ${style.color}; padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 14px; color: rgba(255,255,255,0.8);">${categoryIcon} ${params.category.toUpperCase()}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 8px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff;">
                      ${style.label}${params.subject}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi ${params.toName},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                ${params.body}
              </p>
              ${ctaHtml}
              ${urgentHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-align: center;">
                This is an automated notification from Trogern Fleet Manager
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="${APP_URL}/settings/notifications" style="color: #6b7280;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate plain text email (fallback)
 */
function generateEmailText(params: SendEmailParams): string {
  const style = PRIORITY_CONFIG[params.priority];

  let text = `${style.label}${params.subject}\n\n`;
  text += `Hi ${params.toName},\n\n`;
  text += `${params.body}\n\n`;

  if (params.actionUrl) {
    text += `${params.actionLabel || "View Details"}: ${APP_URL}${params.actionUrl}\n\n`;
  }

  if (params.priority === "urgent") {
    text += "⚠️ This requires your immediate attention.\n\n";
  }

  text += "---\nThis is an automated notification from Trogern Fleet Manager";

  return text;
}

// ============================================
// EMAIL SENDING
// ============================================

/**
 * Send a single email via Resend.
 * Must be called from within a Cloud Function that has resendApiKey in runWith secrets.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    // Get the API key from secrets
    const apiKey = resendApiKey.value();

    if (!apiKey) {
      console.error("RESEND_API_KEY secret not configured");
      return {success: false, error: "Email service not configured"};
    }

    const resend = new Resend(apiKey);

    const style = PRIORITY_CONFIG[params.priority];

    const {data, error} = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `${style.label}${params.subject}`,
      html: generateEmailHtml(params),
      text: generateEmailText(params),
      tags: [
        {name: "category", value: params.category},
        {name: "priority", value: params.priority},
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return {success: false, error: error.message};
    }

    return {success: true, messageId: data?.id};
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send failed:", errorMessage);
    return {success: false, error: errorMessage};
  }
}

/**
 * Send batch emails (for multiple recipients).
 * Resend supports up to 100 emails per batch request.
 */
export async function sendBatchEmails(
  emails: SendEmailParams[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const apiKey = resendApiKey.value();

  if (!apiKey) {
    console.error("RESEND_API_KEY secret not configured");
    return {success: 0, failed: emails.length, errors: ["Email service not configured"]};
  }

  const resend = new Resend(apiKey);
  const results = {success: 0, failed: 0, errors: [] as string[]};

  // Process in batches of 100 (Resend limit)
  const batchSize = 100;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const batchPayload = batch.map((params) => {
      const style = PRIORITY_CONFIG[params.priority];
      return {
        from: FROM_EMAIL,
        to: params.to,
        subject: `${style.label}${params.subject}`,
        html: generateEmailHtml(params),
        text: generateEmailText(params),
      };
    });

    try {
      const {data, error} = await resend.batch.send(batchPayload);

      if (error) {
        results.failed += batch.length;
        results.errors.push(error.message);
      } else {
        results.success += data?.data?.length || 0;
      }
    } catch (err) {
      results.failed += batch.length;
      results.errors.push(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return results;
}

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  try {
    return !!resendApiKey.value();
  } catch {
    return false;
  }
}
