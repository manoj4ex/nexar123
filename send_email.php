<?php
header('Content-Type: application/json');

// Configuration - CHANGE THIS TO YOUR EMAIL
$to_email = "info@nexar.com.np"; // Your email address
$from_email = "noreply@nexar.com.np"; // Change to your domain email

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Function to sanitize input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to validate email
function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Check if form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Get and sanitize form data
    $org = isset($_POST['org']) ? sanitize_input($_POST['org']) : '';
    $contact = isset($_POST['contact']) ? sanitize_input($_POST['contact']) : '';
    $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
    $phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $subject = isset($_POST['subject']) ? sanitize_input($_POST['subject']) : '';
    $message = isset($_POST['message']) ? sanitize_input($_POST['message']) : '';
    $type = isset($_POST['type']) ? sanitize_input($_POST['type']) : '';

    // Validate required fields
    $errors = array();
    
    if (empty($org)) $errors[] = "Organization name is required";
    if (empty($contact)) $errors[] = "Contact person name is required";
    if (empty($email)) {
        $errors[] = "Email address is required";
    } elseif (!validate_email($email)) {
        $errors[] = "Invalid email address format";
    }
    if (empty($subject)) $errors[] = "Subject is required";
    if (empty($message)) $errors[] = "Message is required";
    
    // If there are errors, return them
    if (!empty($errors)) {
        echo json_encode(array(
            'success' => false,
            'error' => implode(", ", $errors)
        ));
        exit;
    }
    
    // Prepare email content based on type
    $type_labels = [
        'general' => 'General Inquiry',
        'support' => 'Technical Support',
        'quote' => 'Quote Request'
    ];
    $type_label = isset($type_labels[$type]) ? $type_labels[$type] : 'Inquiry';
    
    $email_subject = "[$type_label] " . $subject;
    
    // HTML Email Template - Professional format
    $email_body = "
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #005db9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: bold; color: #374151; margin-bottom: 5px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .field-value { background: white; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 15px; }
            .badge { display: inline-block; padding: 4px 12px; background: #005db9; color: white; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2 style='margin: 0;'>Nexar Point - New Inquiry</h2>
                <p style='margin: 10px 0 0; opacity: 0.9;'>Website Contact Form</p>
            </div>
            <div class='content'>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <span class='badge'>" . $type_label . "</span>
                </div>
                
                <div class='field'>
                    <div class='field-label'>🏢 Organization Name</div>
                    <div class='field-value'>" . nl2br($org) . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>👤 Contact Person</div>
                    <div class='field-value'>" . nl2br($contact) . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📧 Email Address</div>
                    <div class='field-value'><a href='mailto:" . $email . "'>" . $email . "</a></div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📞 Phone Number</div>
                    <div class='field-value'>" . (!empty($phone) ? nl2br($phone) : '<em>Not provided</em>') . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📋 Subject</div>
                    <div class='field-value'>" . nl2br($subject) . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>💬 Message</div>
                    <div class='field-value' style='background: #fef3c7; border-color: #fbbf24;'>" . nl2br($message) . "</div>
                </div>
                
                <hr>
                
                <div style='background: #e0f2fe; padding: 12px; border-radius: 6px; font-size: 13px;'>
                    <strong>📅 Submitted:</strong> " . date('F j, Y, g:i a') . "<br>
                    <strong>🌐 IP Address:</strong> " . $_SERVER['REMOTE_ADDR'] . "<br>
                    <strong>🔗 User Agent:</strong> " . substr($_SERVER['HTTP_USER_AGENT'], 0, 100) . "
                </div>
            </div>
            <div class='footer'>
                <p>This inquiry was submitted from the Nexar Point website contact form.</p>
                <p>© 2025 Nexar Point Pvt. Ltd. | Lalitpur, Nepal</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Plain text version for email clients that don't support HTML
    $text_body = "NEXAR POINT - NEW " . strtoupper($type_label) . "\n";
    $text_body .= "================================\n\n";
    $text_body .= "Organization: " . $org . "\n";
    $text_body .= "Contact Person: " . $contact . "\n";
    $text_body .= "Email: " . $email . "\n";
    $text_body .= "Phone: " . (!empty($phone) ? $phone : 'Not provided') . "\n";
    $text_body .= "Subject: " . $subject . "\n\n";
    $text_body .= "Message:\n" . $message . "\n\n";
    $text_body .= "--------------------------------\n";
    $text_body .= "Submitted: " . date('F j, Y, g:i a') . "\n";
    $text_body .= "IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
    $text_body .= "--------------------------------\n";
    $text_body .= "© 2025 Nexar Point Pvt. Ltd.\n";
    
    // Email headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . $from_email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    $headers .= "X-Priority: 1\r\n";
    $headers .= "Importance: High\r\n";
    
    // Send email
    $mail_sent = mail($to_email, $email_subject, $email_body, $headers);
    
    // Send auto-reply to user (optional but professional)
    if ($mail_sent) {
        $auto_subject = "Thank you for contacting Nexar Point";
        $auto_message = "
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}</style></head>
        <body style='padding:20px;max-width:500px;margin:0 auto;'>
            <div style='background:#005db9;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;'>
                <h2 style='margin:0;'>Thank You for Contacting Us</h2>
            </div>
            <div style='background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;'>
                <p>Dear <strong>" . $contact . "</strong>,</p>
                <p>Thank you for reaching out to <strong>Nexar Point Pvt. Ltd.</strong> We have received your " . strtolower($type_label) . " and our team will respond within <strong>1 business day</strong>.</p>
                <div style='background:#e0f2fe;padding:15px;border-radius:6px;margin:20px 0;'>
                    <p style='margin:0;'><strong>Your inquiry reference:</strong><br>
                    Subject: " . $subject . "<br>
                    Type: " . $type_label . "</p>
                </div>
                <p>For urgent matters, please call us directly at:<br>
                <strong>📞 +977-9816749049</strong></p>
                <hr style='border:none;border-top:1px solid #e5e7eb;margin:20px 0;'>
                <p style='font-size:12px;color:#6b7280;'>Best regards,<br>
                <strong>Nexar Point Team</strong><br>
                Lalitpur, Nepal | info@nexar.com.np</p>
            </div>
        </body>
        </html>
        ";
        
        $auto_headers = "MIME-Version: 1.0\r\n";
        $auto_headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $auto_headers .= "From: " . $from_email . "\r\n";
        $auto_headers .= "Reply-To: " . $to_email . "\r\n";
        
        mail($email, $auto_subject, $auto_message, $auto_headers);
        
        echo json_encode(array(
            'success' => true,
            'message' => 'Your inquiry has been sent successfully!'
        ));
    } else {
        echo json_encode(array(
            'success' => false,
            'error' => 'Failed to send email. Please try again later or contact us directly at info@nexar.com.np'
        ));
    }
    
} else {
    echo json_encode(array(
        'success' => false,
        'error' => 'Invalid request method.'
    ));
}
?>
