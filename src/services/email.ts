const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    // Dev mode: log to console instead of sending
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Body preview: ${html.slice(0, 200)}...`);
    return { success: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fold <noreply@foldapp.com>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`[EMAIL] Failed to send to ${to}:`, error);
    return { success: false, error };
  }

  return { success: true };
}

export async function sendMagicLinkEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-magic-link?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Sign in to Fold",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: bold;">Sign in to Fold</h2>
        <p style="color: #666; font-size: 14px;">Click the button below to sign in. This link expires in 15 minutes.</p>
        <a href="${url}" style="display: inline-block; background: #171717; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
          Sign in to Fold
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not request this link, you can safely ignore this email.</p>
      </div>
    `,
  });
}
