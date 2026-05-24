**
 * NEXAR POINT — BACKEND EMAIL SERVER (DARK THEME)
 * Node.js + Express + Nodemailer
 *
 * Setup:
 *   npm install express nodemailer cors dotenv
 *   node server.js
 *
 * .env file:
 *   MAIL_HOST=smtp.gmail.com
 *   MAIL_PORT=587
 *   MAIL_USER=sah.manoj2022@gmail.com
 *   MAIL_PASS=your_gmail_app_password
 *   MAIL_TO=info@nexar.com.np
 *   PORT=3000
 */

require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MAIL_TO = process.env.MAIL_TO || process.env.MAIL_USER || 'info@nexar.com.np';

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// ---------------- EMAIL TRANSPORTER ----------------
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// ---------------- INQUIRY ENDPOINT ----------------
app.post('/api/inquiry', async (req, res) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS || process.env.MAIL_PASS === 'YOUR_PASSWORD' || process.env.MAIL_PASS === 'YOUR_GMAIL_APP_PASSWORD') {
    return res.status(500).json({
      error: 'Email is not configured. Set MAIL_USER and a real Gmail app password in MAIL_PASS, then restart the server.'
    });
  }

  const {
    org,
    contact,
    email,
    phone,
    subject,
    message,
    type,
    tag
  } = req.body;

  // ---------------- VALIDATION ----------------
  if (!org || !contact || !email || !subject || !message) {
    return res.status(400).json({
      error: 'Missing required fields.'
    });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRe.test(email)) {
    return res.status(400).json({
      error: 'Invalid email address.'
    });
  }

  const typeLabel = {
    general: 'General Inquiry',
    support: 'Technical Support',
    quote: 'Quote Request'
  };

  const typeText = typeLabel[type] || 'Inquiry';
  const inquiryTag = tag || '[INQUIRY]';

  // =========================================================
  // INTERNAL EMAIL TO NEXAR TEAM
  // =========================================================

  const internalMail = {
    from: `"Nexar Point Website" <${process.env.MAIL_USER}>`,
    to: MAIL_TO,
    replyTo: email,
    subject: `${inquiryTag} ${subject} — ${org}`,

    html: `
   
    <div style="
      font-family: Arial, sans-serif;
      background: #000000;
      padding: 40px 20px;
      color: #ffffff;
    ">

      <div style="
        max-width: 650px;
        margin: 0 auto;
        background: #0b0b0b;
        border: 1px solid #1f2937;
        border-radius: 12px;
        overflow: hidden;
      ">

        <!-- HEADER -->
        <div style="
          background: #050505;
          padding: 28px 32px;
          border-bottom: 1px solid #1f2937;
        ">
          <h1 style="
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          ">
            <span style="color:#0E6FD8;">NEXAR</span>
            <span style="font-weight:300;">POINT</span>
          </h1>

          <p style="
            margin-top: 10px;
            color: #9CA3AF;
            font-size: 14px;
          ">
            New ${typeText} Received
          </p>
        </div>

        <!-- BODY -->
        <div style="
          padding: 32px;
          background: #000000;
        ">

          <table style="
            width: 100%;
            border-collapse: collapse;
          ">

            <tr>
              <td style="
                padding: 14px 0;
                color:rgb(18, 19, 21);
                width: 180px;
                border-bottom: 1px solid #1f2937;
                font-weight: 600;
              ">
                Organization
              </td>

              <td style="
                padding: 14px 0;
                color:rgba(1, 0, 0, 0.2);
                border-bottom: 1px solid #1f2937;
              ">
                <strong>${org}</strong>
              </td>
            </tr>

            <tr>
              <td style="
                padding: 14px 0;
                color: #9CA3AF;
                border-bottom: 1px solid #1f2937;
                font-weight: 600;
              ">
                Contact Person
              </td>

              <td style="
                padding: 14px 0;
                color: #ffffff;
                border-bottom: 1px solid #1f2937;
              ">
                ${contact}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 14px 0;
                color:rgb(0, 0, 0);
                border-bottom: 1px solid #1f2937;
                font-weight: 600;
              ">
                Email
              </td>

              <td style="
                padding: 14px 0;
                border-bottom: 1px solid #1f2937;
              ">
                <a href="mailto:${email}" style="
                  color: #0E6FD8;
                  text-decoration: none;
                ">
                  ${email}
                </a>
              </td>
            </tr>

            <tr>
              <td style="
                padding: 14px 0;
                color: #9CA3AF;
                border-bottom: 1px solid #1f2937;
                font-weight: 600;
              ">
                Phone
              </td>

              <td style="
                padding: 14px 0;
                color: #ffffff;
                border-bottom: 1px solid #1f2937;
              ">
                ${phone || 'Not provided'}
              </td>
            </tr>

            <tr>
              <td style="
                padding: 14px 0;
                color: #9CA3AF;
                border-bottom: 1px solid #1f2937;
                font-weight: 600;
              ">
                Inquiry Type
              </td>

              <td style="
                padding: 14px 0;
                border-bottom: 1px solid #1f2937;
              ">
                <span style="
                  background: #0E6FD8;
                  color: #ffffff;
                  padding: 5px 12px;
                  border-radius: 5px;
                  font-size: 12px;
                  font-weight: 700;
                ">
                  ${inquiryTag}
                </span>
              </td>
            </tr>

            <tr>
              <td style="
                padding: 14px 0;
                color: #9CA3AF;
                border-bottom: 1px solid #1f2937;
                font-weight: 600;
              ">
                Subject
              </td>

              <td style="
                padding: 14px 0;
                color: #ffffff;
                border-bottom: 1px solid #1f2937;
              ">
                ${subject}
              </td>
            </tr>

          </table>

          <!-- MESSAGE -->
          <div style="margin-top: 28px;">

            <p style="
              color: #9CA3AF;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
              font-weight: 700;
            ">
              Message
            </p>

            <div style="
              background: #111827;
              border: 1px solid #374151;
              border-radius: 8px;
              padding: 18px 20px;
              color: #ffffff;
              font-size: 14px;
              line-height: 1.8;
              white-space: pre-wrap;
            ">
              ${message}
            </div>

          </div>

          <!-- REPLY NOTICE -->
          <div style="
            margin-top: 28px;
            background: #071425;
            border-left: 4px solid #0E6FD8;
            padding: 18px 20px;
            border-radius: 8px;
          ">
            <p style="
              margin: 0;
              color: #d1d5db;
              font-size: 14px;
              line-height: 1.7;
            ">
              Reply directly to this email to respond to
              <strong>${contact}</strong> from
              <strong>${org}</strong>.
            </p>
          </div>

        </div>

        <!-- FOOTER -->
        <div style="
          background: #050505;
          border-top: 1px solid #1f2937;
          padding: 18px 32px;
        ">
          <p style="
            margin: 0;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          ">
            Submitted via nexarpoint.com.np
          </p>
        </div>

      </div>

    </div>
    `
  };

  // =========================================================
  // AUTO REPLY EMAIL
  // =========================================================

  const autoReply = {
    from: `"Nexar Point Pvt. Ltd." <${process.env.MAIL_USER}>`,
    to: email,
    subject: `We received your inquiry — Nexar Point`,

    html: `

    <div style="
      font-family: Arial, sans-serif;
      background: #000000;
      padding: 40px 20px;
      color: #ffffff;
    ">

      <div style="
        max-width: 650px;
        margin: 0 auto;
        background: #0b0b0b;
        border: 1px solid #1f2937;
        border-radius: 12px;
        overflow: hidden;
      ">

        <!-- HEADER -->
        <div style="
          background: #050505;
          padding: 30px 32px;
          border-bottom: 1px solid #1f2937;
        ">

          <h1 style="
            color: #ffffff;
            margin: 0;
            font-size: 24px;
          ">
            <span style="color:#0E6FD8;">NEXAR</span>
            <span style="font-weight:300;">POINT</span>
          </h1>

        </div>

        <!-- BODY -->
        <div style="
          padding: 32px;
          background: #000000;
        ">

          <p style="
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 18px;
          ">
            Dear <strong>${contact}</strong>,
          </p>

          <p style="
            color: #d1d5db;
            line-height: 1.8;
            margin-bottom: 18px;
            font-size: 15px;
          ">
            Thank you for contacting Nexar Point.
            We have successfully received your inquiry regarding
            <strong style="color:#ffffff;">${subject}</strong>
            from
            <strong style="color:#ffffff;">${org}</strong>.
          </p>

          <p style="
            color: #d1d5db;
            line-height: 1.8;
            margin-bottom: 28px;
            font-size: 15px;
          ">
            Our team will review your message and respond within
            <strong style="color:#ffffff;">1 business day</strong>.
            For urgent matters, please contact us directly at
            <a href="mailto:info@nexar.com.np" style="
              color:#0E6FD8;
              text-decoration:none;
            ">
              info@nexar.com.np
            </a>
          </p>

          <!-- SUMMARY BOX -->
          <div style="
            background: #111827;
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 20px;
          ">

            <p style="
              margin-top: 0;
              margin-bottom: 12px;
              color: #9CA3AF;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 700;
            ">
              Inquiry Summary
            </p>

            <p style="
              color: #ffffff;
              margin: 0 0 10px;
              font-size: 14px;
            ">
              <strong>Subject:</strong> ${subject}
            </p>

            <p style="
              color: #ffffff;
              margin: 0;
              font-size: 14px;
            ">
              <strong>Type:</strong> ${typeText}
            </p>

          </div>

          <!-- SIGNATURE -->
          <div style="margin-top: 32px;">

            <p style="
              color: #9CA3AF;
              font-size: 14px;
              line-height: 1.8;
              margin: 0;
            ">
              Warm regards,
            </p>

            <p style="
              color: #ffffff;
              font-size: 15px;
              margin-top: 8px;
              line-height: 1.8;
            ">
              <strong>Nexar Point Team</strong><br>
              Lalitpur, Nepal<br>
              info@nexar.com.np
            </p>

          </div>

        </div>

        <!-- FOOTER -->
        <div style="
          background: #050505;
          border-top: 1px solid #1f2937;
          padding: 18px 32px;
        ">

          <p style="
            margin: 0;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          ">
            © 2025 Nexar Point Pvt. Ltd. All rights reserved.
          </p>

        </div>

      </div>

    </div>
    `
  };

  // =========================================================
  // SEND EMAILS
  // =========================================================

  try {

    await transporter.sendMail(internalMail);

    await transporter.sendMail(autoReply);

    res.json({
      success: true,
      message: 'Inquiry sent successfully.'
    });

  } catch (error) {

    console.error('Email error:', error.message);

    res.status(500).json({
      error: `Failed to send email: ${error.message}`
    });

  }

});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Nexar Point server running on http://localhost:${PORT}`);
});
