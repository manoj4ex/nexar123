<?php
header('Content-Type: application/json');

// Configuration
$to_email = "info@nexar.com.np";
$from_email = "noreply@nexar.com.np"; // Change to your domain

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't show errors to user

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
    
    if (empty($org)) {
        $errors[] = "Organization name is required";
    }
    
    if (empty($contact)) {
        $errors[] = "Contact person name is required";
    }
    
    if (empty($email)) {
        $errors[] = "Email address is required";
    } elseif (!validate_email($email)) {
        $errors[] = "Invalid email address format";
    }
    
    if (empty($subject)) {
        $errors[] = "Subject is required";
    }
    
    if (empty($message)) {
        $errors[] = "Message is required";
    }
    
    // If there are errors, return them
    if (!empty($errors)) {
        echo json_encode(array(
            'success' => false,
            'message' => implode(", ", $errors)
        ));
        exit;
    }
    
    // Prepare email content
    $email_subject = "New " . ucfirst($type) . " Inquiry: " . $subject;
    
    // HTML Email Template
    $email_body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a56db; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .field-value { background: white; padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            .badge { display: inline-block; padding: 3px 8px; background: #e5e7eb; border-radius: 4px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>New Website Inquiry</h2>
                <p>Type: <strong>" . ucfirst($type) . "</strong></p>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='field-label'>Organization Name:</div>
                    <div class='field-value'>" . nl2br($org) . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>Contact Person:</div>
                    <div class='field-value'>" . nl2br($contact) . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>Email Address:</div>
                    <div class='field-value'><a href='mailto:" . $email . "'>" . $email . "</a></div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>Phone Number:</div>
                    <div class='field-value'>" . (!empty($phone) ? nl2br($phone) : 'Not provided') . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>Subject:</div>
                    <div class='field-value'>" . nl2br($subject) . "</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>Message:</div>
                    <div class='field-value'>" . nl2br($message) . "</div>
                </div>
            </div>
            <div class='footer'>
                <p>This inquiry was submitted from your website contact form.</p>
                <p>Sent on: " . date('F j, Y, g:i a') . "</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Plain text version for email clients that don't support HTML
    $text_body = "New " . ucfirst($type) . " Inquiry\n";
    $text_body .= "========================\n\n";
    $text_body .= "Organization: " . $org . "\n";
    $text_body .= "Contact Person: " . $contact . "\n";
    $text_body .= "Email: " . $email . "\n";
    $text_body .= "Phone: " . (!empty($phone) ? $phone : 'Not provided') . "\n";
    $text_body .= "Subject: " . $subject . "\n";
    $text_body .= "Inquiry Type: " . $type . "\n\n";
    $text_body .= "Message:\n" . $message . "\n\n";
    $text_body .= "Submitted on: " . date('F j, Y, g:i a');
    
    // Email headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . $from_email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email
    $mail_sent = mail($to_email, $email_subject, $email_body, $headers);
    
    // Send auto-reply to user (optional)
    if ($mail_sent) {
        $auto_subject = "Thank you for contacting us - Nexar";
        $auto_message = "
        <html>
        <body>
            <h3>Dear " . $contact . ",</h3>
            <p>Thank you for contacting Nexar. We have received your inquiry and our team will respond within 1 business day.</p>
            <p><strong>Your inquiry details:</strong><br>
            Subject: " . $subject . "<br>
            Type: " . ucfirst($type) . "</p>
            <p>For urgent matters, please call us at +977-9816749049.</p>
            <p>Best regards,<br>Nexar Team</p>
        </body>
        </html>
        ";
        
        $auto_headers = "MIME-Version: 1.0\r\n";
        $auto_headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $auto_headers .= "From: " . $from_email . "\r\n";
        
        mail($email, $auto_subject, $auto_message, $auto_headers);
        
        echo json_encode(array(
            'success' => true,
            'message' => 'Your inquiry has been sent successfully!'
        ));
    } else {
        echo json_encode(array(
            'success' => false,
            'message' => 'Failed to send email. Please try again later or contact us directly.'
        ));
    }
    
} else {
    // Not a POST request
    echo json_encode(array(
        'success' => false,
        'message' => 'Invalid request method.'
    ));
}
?>
