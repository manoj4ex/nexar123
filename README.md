# Nexar Point Pvt. Ltd. — Website

## Files
- `index.html`  — Full website (all sections)
- `style.css`   — Complete stylesheet
- `main.js`     — Frontend JS (nav, animations, form)
- `server.js`   — Node.js backend (email via Nodemailer)

## Quick Start

### 1. Install backend dependencies
```
npm install express nodemailer cors dotenv
```

### 2. Create `.env` file in this folder
```
MAIL_HOST=mail.nexar.com.np
MAIL_PORT=587
MAIL_USER=info@nexar.com.np
MAIL_PASS=your_smtp_password
PORT=3000
```

### 3. Run the server
```
node server.js
```
Open http://localhost:3000

## Deploying to cPanel (shared hosting)
1. Upload `index.html`, `style.css`, `main.js` to `public_html/`
2. Set up Node.js app via cPanel Node.js selector
3. Upload `server.js` and `package.json` to the app root
4. Set environment variables in cPanel
5. Start the Node.js app

## Deploying to Vercel (recommended)
1. Push all files to a GitHub repo
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Node.js

## PHP alternative (if no Node.js)
Replace the `/api/inquiry` endpoint with `inquiry.php`:
```php
<?php
$to = "info@nexar.com.np";
$org     = htmlspecialchars($_POST['org']);
$contact = htmlspecialchars($_POST['contact']);
$email   = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
$phone   = htmlspecialchars($_POST['phone']);
$subject = htmlspecialchars($_POST['subject']);
$message = htmlspecialchars($_POST['message']);
$type    = $_POST['type'];
$tags    = ['general'=>'[INQUIRY]','support'=>'[SUPPORT]','quote'=>'[QUOTE]'];
$tag     = $tags[$type] ?? '[INQUIRY]';
$headers = "From: website@nexar.com.np\r\nReply-To: $email\r\nContent-Type: text/html";
$body    = "<b>$tag — $org</b><br><b>Contact:</b> $contact<br>
            <b>Email:</b> $email<br><b>Phone:</b> $phone<br>
            <b>Subject:</b> $subject<br><br><b>Message:</b><br>$message";
mail($to, "$tag $subject — $org", $body, $headers);
header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>
```
Then change the fetch URL in `main.js` from `/api/inquiry` to `/inquiry.php`.

## Sections included
1. Sticky dark navbar with mobile hamburger
2. Hero — headline, stats row
3. Mission / Vision / Values
4. Consultation Services (4 cards)
5. ISO Training (4 cards)
6. ISO Certification (process timeline + 3 certs)
7. Data Center Products (UPS, PAC, DCIM)
8. Software Services (Captive WiFi, Monitoring App)
9. Cloud Services (AWS, Local, On-Premises + comparison table)
10. Inquiry & Support form → emails to info@nexar.com.np
11. Footer with certification badges

## Customization
- Replace placeholder phone number in footer
- Add your real logo image (replace text logo)
- Add real photos to product/service sections
- Update client count and stats when ready
- Add Google Analytics tracking ID

## Fonts used
- Sora (headings) — Google Fonts
- DM Sans (body) — Google Fonts
Both load from Google Fonts CDN in the HTML head.
