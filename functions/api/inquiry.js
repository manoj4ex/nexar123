export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request method' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { org, contact, email, phone, subject, message, type } = payload || {};
  if (!org || !contact || !email || !subject || !message) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
  const MAIL_FROM = env.MAIL_FROM;
  const MAIL_TO = env.MAIL_TO;

  if (!SENDGRID_API_KEY || !MAIL_FROM || !MAIL_TO) {
    return new Response(JSON.stringify({ success: false, error: 'Email service configuration missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const typeLabelMap = {
    general: 'General Inquiry',
    support: 'Technical Support',
    quote: 'Quote Request'
  };
  const typeLabel = typeLabelMap[type] || 'Inquiry';
  const inquiryTag = `[${typeLabel.toUpperCase()}]`;

  const plainText = `Organization: ${org}\nContact: ${contact}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nType: ${typeLabel}\nSubject: ${subject}\n\nMessage:\n${message}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 24px; color: #111;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 22px 70px rgba(15, 23, 42, 0.08);">
        <div style="background: #0e6fd8; color: #fff; padding: 24px 28px;">
          <h1 style="margin: 0; font-size: 24px;">Nexar Point — New Inquiry</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.92;">A new inquiry has been submitted through the website contact form.</p>
        </div>
        <div style="padding: 28px; color: #111; line-height: 1.7;">
          <p style="margin: 0 0 20px;"><strong>Inquiry Type:</strong> ${typeLabel}</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 10px 0; width: 140px; font-weight: 700;">Organization</td><td style="padding: 10px 0;">${org}</td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Contact</td><td style="padding: 10px 0;">${contact}</td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Email</td><td style="padding: 10px 0;"><a href=\"mailto:${email}\" style=\"color:#0e6fd8; text-decoration:none;\">${email}</a></td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Phone</td><td style="padding: 10px 0;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding: 10px 0; font-weight: 700;">Subject</td><td style="padding: 10px 0;">${subject}</td></tr>
          </table>
          <div style="background: #f4f7fb; border-radius: 12px; padding: 18px;">
            <p style="margin:0 0 12px; font-weight:700;">Message</p>
            <p style="margin:0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      </div>
    </div>`;

  const body = {
    personalizations: [
      {
        to: [{ email: MAIL_TO }],
        subject: `${inquiryTag} ${subject} — ${org}`
      }
    ],
    from: { email: MAIL_FROM },
    reply_to: { email },
    content: [
      { type: 'text/plain', value: plainText },
      { type: 'text/html', value: htmlBody }
    ]
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read SendGrid response');
      return new Response(JSON.stringify({ success: false, error: `SendGrid error ${response.status}: ${errorText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Inquiry sent successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unexpected server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
