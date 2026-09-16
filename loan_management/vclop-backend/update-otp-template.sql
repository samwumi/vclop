-- UPDATE OTP TEMPLATE WITH PROPER BODY
-- Run this in phpMyAdmin to fix the empty OTP email

-- First, check if template exists
SELECT id, code, event, bodyHtml IS NULL as missing_html 
FROM notification_templates 
WHERE event = 'auth.password_change_otp';

-- If you see a row, UPDATE it (don't INSERT again)
-- Replace the UUID below with the actual id from above query

UPDATE notification_templates
SET 
  bodyHtml = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Change OTP</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;">VCLOP</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:24px;">Password Change OTP</h2>
              <p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;">
                Hi {{firstName}},
              </p>
              <p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;">
                You requested to change your password. Use this One-Time Password (OTP):
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <div style="padding:30px 60px;background:#f8f9fa;border-radius:12px;border:3px dashed #667eea;">
                      <p style="margin:0;font-size:48px;font-weight:700;color:#667eea;letter-spacing:12px;font-family:Courier;">{{otp}}</p>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:32px;padding:20px;background-color:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;">
                <p style="margin:0;color:#856404;font-size:14px;">
                  <strong>Important:</strong> This OTP is valid for {{expiresIn}} only.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8f9fa;padding:32px;text-align:center;">
              <p style="margin:0;color:#6b6b6b;font-size:13px;">
                © {{year}} Vertical Capital. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  bodyText = 'Hi {{firstName}},

You requested to change your password. Use this One-Time Password (OTP):

OTP: {{otp}}

Important: This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.

Best regards,
The VCLOP Team

© {{year}} Vertical Capital.',
  variables = '{"firstName": "User first name", "otp": "6-digit OTP code", "expiresIn": "OTP expiry duration", "year": "Current year"}',
  updatedAt = NOW()
WHERE event = 'auth.password_change_otp';


-- Verify the update
SELECT 
  code, 
  event,
  subject,
  LENGTH(bodyHtml) as html_length,
  LENGTH(bodyText) as text_length,
  isActive
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected: html_length should be > 1000, text_length > 200
