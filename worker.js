/**
 * NEXAR POINT — Cloudflare Worker
 * Form → Cloudflare Worker → Resend API → Email
 *
 * ENVIRONMENT VARIABLES (set in Worker → Settings → Variables and Secrets):
 *   RESEND_API_KEY  = re_xxxxxxxxxxxxxxxx   ← from resend.com/api-keys
 *   MAIL_TO         = info@nexar.com.np     ← where inquiries are delivered
 *   MAIL_FROM       = noreply@nexarpoint.com.np  ← verified Resend domain
 *                     OR use onboarding@resend.dev for testing before domain verified
 */

export default {
  async fetch(request, env) {

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const { org, contact, email, phone, subject, message, type, tag } = body;

    // ── Validate ────────────────────────────────────────────────────────────
    if (!org || !contact || !email || !subject || !message) {
      return json({ error: 'Missing required fields.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address.' }, 400);
    }

    // ── Config from environment ─────────────────────────────────────────────
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const MAIL_TO        = env.MAIL_TO   || 'info@nexar.com.np';
    const MAIL_FROM      = env.MAIL_FROM || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
      return json({ error: 'Server misconfiguration: RESEND_API_KEY not set.' }, 500);
    }

    const typeLabel  = { general: 'General Inquiry', support: 'Technical Support', quote: 'Quote Request' };
    const typeText   = typeLabel[type] || 'Inquiry';
    const inquiryTag = tag || '[INQUIRY]';

    // ══════════════════════════════════════════════════════════════════════
    // INTERNAL EMAIL HTML
    // ══════════════════════════════════════════════════════════════════════
    const internalHTML = `
<div style="font-family:Arial,sans-serif;background:#000;padding:40px 20px;color:#fff;">
  <div style="max-width:650px;margin:0 auto;background:#0b0b0b;border:1px solid #1f2937;border-radius:12px;overflow:hidden;">
    <div style="background:#050505;padding:28px 32px;border-bottom:1px solid #1f2937;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">
        <span style="color:#0E6FD8;">NEXAR</span><span style="font-weight:300;">POINT</span>
      </h1>
      <p style="margin-top:10px;color:#9CA3AF;font-size:14px;">New ${typeText} Received</p>
    </div>
    <div style="padding:32px;background:#000;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:14px 0;color:#9CA3AF;width:180px;border-bottom:1px solid #1f2937;font-weight:600;">Organization</td>
          <td style="padding:14px 0;color:#fff;border-bottom:1px solid #1f2937;"><strong>${org}</strong></td>
        </tr>
        <tr>
          <td style="padding:14px 0;color:#9CA3AF;border-bottom:1px solid #1f2937;font-weight:600;">Contact Person</td>
          <td style="padding:14px 0;color:#fff;border-bottom:1px solid #1f2937;">${contact}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;color:#9CA3AF;border-bottom:1px solid #1f2937;font-weight:600;">Email</td>
          <td style="padding:14px 0;border-bottom:1px solid #1f2937;">
            <a href="mailto:${email}" style="color:#0E6FD8;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0;color:#9CA3AF;border-bottom:1px solid #1f2937;font-weight:600;">Phone</td>
          <td style="padding:14px 0;color:#fff;border-bottom:1px solid #1f2937;">${phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;color:#9CA3AF;border-bottom:1px solid #1f2937;font-weight:600;">Inquiry Type</td>
          <td style="padding:14px 0;border-bottom:1px solid #1f2937;">
            <span style="background:#0E6FD8;color:#fff;padding:5px 12px;border-radius:5px;font-size:12px;font-weight:700;">${inquiryTag}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0;color:#9CA3AF;border-bottom:1px solid #1f2937;font-weight:600;">Subject</td>
          <td style="padding:14px 0;color:#fff;border-bottom:1px solid #1f2937;">${subject}</td>
        </tr>
      </table>
      <div style="margin-top:28px;">
        <p style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:700;">Message</p>
        <div style="background:#111827;border:1px solid #374151;border-radius:8px;padding:18px 20px;color:#fff;font-size:14px;line-height:1.8;white-space:pre-wrap;">${message}</div>
      </div>
      <div style="margin-top:28px;background:#071425;border-left:4px solid #0E6FD8;padding:18px 20px;border-radius:8px;">
        <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.7;">
          Reply directly to this email to respond to <strong>${contact}</strong> from <strong>${org}</strong>.
        </p>
      </div>
    </div>
    <div style="background:#050505;border-top:1px solid #1f2937;padding:18px 32px;">
      <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">Submitted via nexarpoint.com.np</p>
    </div>
  </div>
</div>`;

    // ══════════════════════════════════════════════════════════════════════
    // AUTO-REPLY EMAIL HTML
    // ══════════════════════════════════════════════════════════════════════
    const autoReplyHTML = `
<div style="font-family:Arial,sans-serif;background:#000;padding:40px 20px;color:#fff;">
  <div style="max-width:650px;margin:0 auto;background:#0b0b0b;border:1px solid #1f2937;border-radius:12px;overflow:hidden;">
    <div style="background:#050505;padding:30px 32px;border-bottom:1px solid #1f2937;">
      <h1 style="color:#fff;margin:0;font-size:24px;">
        <span style="color:#0E6FD8;">NEXAR</span><span style="font-weight:300;">POINT</span>
      </h1>
    </div>
    <div style="padding:32px;background:#000;">
      <p style="color:#fff;font-size:16px;margin-bottom:18px;">Dear <strong>${contact}</strong>,</p>
      <p style="color:#d1d5db;line-height:1.8;margin-bottom:18px;font-size:15px;">
        Thank you for contacting Nexar Point. We have successfully received your inquiry regarding
        <strong style="color:#fff;">${subject}</strong> from <strong style="color:#fff;">${org}</strong>.
      </p>
      <p style="color:#d1d5db;line-height:1.8;margin-bottom:28px;font-size:15px;">
        Our team will review your message and respond within <strong style="color:#fff;">1 business day</strong>.
        For urgent matters, please contact us directly at
        <a href="mailto:info@nexar.com.np" style="color:#0E6FD8;text-decoration:none;">info@nexar.com.np</a>
      </p>
      <div style="background:#111827;border:1px solid #374151;border-radius:8px;padding:20px;">
        <p style="margin-top:0;margin-bottom:12px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Inquiry Summary</p>
        <p style="color:#fff;margin:0 0 10px;font-size:14px;"><strong>Subject:</strong> ${subject}</p>
        <p style="color:#fff;margin:0;font-size:14px;"><strong>Type:</strong> ${typeText}</p>
      </div>
      <div style="margin-top:32px;">
        <p style="color:#9CA3AF;font-size:14px;line-height:1.8;margin:0;">Warm regards,</p>
        <p style="color:#fff;font-size:15px;margin-top:8px;line-height:1.8;">
          <strong>Nexar Point Team</strong><br>
          Lalitpur, Nepal<br>
          info@nexar.com.np
        </p>
      </div>
    </div>
    <div style="background:#050505;border-top:1px solid #1f2937;padding:18px 32px;">
      <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">© 2025 Nexar Point Pvt. Ltd. All rights reserved.</p>
    </div>
  </div>
</div>`;

    // ══════════════════════════════════════════════════════════════════════
    // SEND BOTH EMAILS VIA RESEND
    // ══════════════════════════════════════════════════════════════════════
    try {
      // 1. Internal email → Nexar team
      await sendViaResend({
        apiKey:  RESEND_API_KEY,
        from:    `Nexar Point Website <${MAIL_FROM}>`,
        to:      [MAIL_TO],
        replyTo: email,
        subject: `${inquiryTag} ${subject} — ${org}`,
        html:    internalHTML
      });

      // 2. Auto-reply → submitter
      await sendViaResend({
        apiKey:  RESEND_API_KEY,
        from:    `Nexar Point Pvt. Ltd. <${MAIL_FROM}>`,
        to:      [email],
        subject: `We received your inquiry — Nexar Point`,
        html:    autoReplyHTML
      });

      return json({ success: true, message: 'Inquiry sent successfully.' });

    } catch (err) {
      console.error('Resend error:', err.message);
      return json({ error: `Failed to send email: ${err.message}` }, 500);
    }
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function sendViaResend({ apiKey, from, to, replyTo, subject, html }) {
  const payload = { from, to, subject, html };
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return res.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
