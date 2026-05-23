/**
 * NEXAR POINT — BACKEND EMAIL SERVER
 * Node.js + Express + Nodemailer
 *
 * Setup:
 *   npm install express nodemailer cors dotenv
 *   node server.js
 *
 * .env file (create in same folder):
 *   MAIL_HOST=mail.nexar.com.np
 *   MAIL_PORT=587
 *   MAIL_USER=info@nexar.com.np
 *   MAIL_PASS=your_email_password
 *   PORT=3000
 */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('.')); // Serve the HTML/CSS/JS files

// Email transporter
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'mail.nexar.com.np',
  port:   parseInt(process.env.MAIL_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.MAIL_USER || 'info@nexar.com.np',
    pass: process.env.MAIL_PASS
  }
});

// ---- INQUIRY ENDPOINT ----
app.post('/api/inquiry', async (req, res) => {
  const { org, contact, email, phone, subject, message, type, tag } = req.body;

  // Basic server-side validation
  if (!org || !contact || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const typeLabel = { general: 'General Inquiry', support: 'Technical Support', quote: 'Quote Request' };
  const typeText  = typeLabel[type] || 'Inquiry';

  // Email to Nexar Point team
  const internalMail = {
    from:    `"Nexar Point Website" <${process.env.MAIL_USER}>`,
    to:      'info@nexar.com.np',
    replyTo: email,
    subject: `${tag} ${subject} — ${org}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1628; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">
            <span style="color: #0E6FD8;">NEXAR</span><span style="font-weight: 300;">POINT</span>
            &nbsp; New ${typeText}
          </h1>
        </div>
        <div style="background: #f8f9fc; padding: 32px; border: 1px solid #e2e6ef;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; color: #5A6378; font-weight: 600; width: 160px; border-bottom: 1px solid #e2e6ef;">Organization</td>
              <td style="padding: 10px 0; color: #2C3347; border-bottom: 1px solid #e2e6ef;"><strong>${org}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5A6378; font-weight: 600; border-bottom: 1px solid #e2e6ef;">Contact Person</td>
              <td style="padding: 10px 0; color: #2C3347; border-bottom: 1px solid #e2e6ef;">${contact}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5A6378; font-weight: 600; border-bottom: 1px solid #e2e6ef;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e6ef;"><a href="mailto:${email}" style="color: #0E6FD8;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5A6378; font-weight: 600; border-bottom: 1px solid #e2e6ef;">Phone</td>
              <td style="padding: 10px 0; color: #2C3347; border-bottom: 1px solid #e2e6ef;">${phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5A6378; font-weight: 600; border-bottom: 1px solid #e2e6ef;">Inquiry Type</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e6ef;">
                <span style="background: #0E6FD8; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 700;">${tag}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #5A6378; font-weight: 600; border-bottom: 1px solid #e2e6ef;">Subject</td>
              <td style="padding: 10px 0; color: #2C3347; border-bottom: 1px solid #e2e6ef;">${subject}</td>
            </tr>
          </table>
          <div style="margin-top: 24px;">
            <p style="font-size: 12px; color: #5A6378; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Message</p>
            <div style="background: #ffffff; border: 1px solid #e2e6ef; border-radius: 6px; padding: 16px 20px; color: #2C3347; font-size: 14px; line-height: 1.75; white-space: pre-wrap;">${message}</div>
          </div>
          <div style="margin-top: 24px; padding: 14px 20px; background: #E6F1FB; border-radius: 6px; border-left: 3px solid #0E6FD8;">
            <p style="font-size: 13px; color: #0C447C; margin: 0;">
              Reply directly to this email to respond to <strong>${contact}</strong> at ${org}.
            </p>
          </div>
        </div>
        <div style="background: #0A1628; padding: 16px 32px; border-radius: 0 0 8px 8px;">
          <p style="color: #5A6378; font-size: 12px; margin: 0;">
            Submitted via nexarpoint.com.np website &nbsp;|&nbsp; Routed to info@nexar.com.np
          </p>
        </div>
      </div>
    `
  };

  // Auto-reply to sender
  const autoReply = {
    from:    `"Nexar Point Pvt. Ltd." <${process.env.MAIL_USER}>`,
    to:      email,
    subject: `We received your inquiry — Nexar Point`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1628; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">
            <span style="color: #0E6FD8;">NEXAR</span><span style="font-weight: 300;">POINT</span> Pvt. Ltd.
          </h1>
        </div>
        <div style="padding: 32px; background: #ffffff; border: 1px solid #e2e6ef;">
          <p style="font-size: 16px; color: #2C3347; margin-bottom: 16px;">Dear <strong>${contact}</strong>,</p>
          <p style="color: #5A6378; line-height: 1.75; margin-bottom: 16px;">
            Thank you for reaching out to Nexar Point. We have received your inquiry regarding
            <strong style="color: #0A1628;">${subject}</strong> from <strong style="color: #0A1628;">${org}</strong>.
          </p>
          <p style="color: #5A6378; line-height: 1.75; margin-bottom: 24px;">
            Our team will review your message and respond within <strong style="color: #0A1628;">1 business day</strong>
            (Sunday–Friday, 9:00am–6:00pm NPT). For urgent matters, you can reach us directly at
            <a href="mailto:info@nexar.com.np" style="color: #0E6FD8;">info@nexar.com.np</a>.
          </p>
          <div style="background: #f8f9fc; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #9AA3B8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Your inquiry reference</p>
            <p style="color: #2C3347; font-size: 14px; margin: 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #2C3347; font-size: 14px; margin: 4px 0 0;"><strong>Type:</strong> ${typeText}</p>
          </div>
          <p style="color: #9AA3B8; font-size: 13px;">
            Warm regards,<br>
            <strong style="color: #2C3347;">Nexar Point Team</strong><br>
            Lalitpur, Nepal &nbsp;|&nbsp; info@nexar.com.np
          </p>
        </div>
        <div style="background: #0A1628; padding: 16px 32px; border-radius: 0 0 8px 8px;">
          <p style="color: #5A6378; font-size: 12px; margin: 0;">
            © 2025 Nexar Point Pvt. Ltd. All rights reserved. &nbsp;|&nbsp; Lalitpur, Nepal
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(internalMail);
    await transporter.sendMail(autoReply);
    res.json({ success: true, message: 'Inquiry sent successfully.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email. Please try again or contact us directly.' });
  }
});

app.listen(PORT, () => {
  console.log(`Nexar Point server running on http://localhost:${PORT}`);
});
