-- INSERT EMAIL TEMPLATES DIRECTLY INTO PRODUCTION DATABASE
-- Run this in phpMyAdmin (Hostinger Panel → Databases → phpMyAdmin)

-- Check if templates already exist
SELECT COUNT(*) as existing_templates 
FROM notification_templates 
WHERE event IN ('auth.password_reset', 'auth.password_change_otp', 'auth.email_verification');

-- If result is 0, proceed with inserts below
-- If result is 3, templates already exist (no need to run this)


-- ===========================================================================
-- 1. PASSWORD RESET EMAIL TEMPLATE
-- ===========================================================================

INSERT INTO notification_templates (
  id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt
) VALUES (
  UUID(),
  'password-reset',
  'Password Reset',
  'auth.password_reset',
  'EMAIL',
  'Reset Your VCLOP Password',
  -- HTML Body
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">VCLOP</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 32px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{resetLink}}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="{{resetLink}}" style="color: #667eea; word-break: break-all;">{{resetLink}}</a>
              </p>
              <div style="margin-top: 32px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⏱ Important:</strong> This password reset link will expire in {{expiresIn}}.
                </p>
              </div>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  <strong>Didn''t request a password reset?</strong>
                </p>
                <p style="margin: 8px 0 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  If you didn''t request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 32px; text-align: center;">
              <p style="margin: 0; color: #6b6b6b; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- Plain Text Body
  'Hi {{firstName}},

We received a request to reset your password. Click the link below to create a new password:

{{resetLink}}

⏱ This password reset link will expire in {{expiresIn}}.

DIDN''T REQUEST A PASSWORD RESET?
If you didn''t request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.',
  '{"firstName": "User first name", "resetLink": "Password reset URL", "expiresIn": "Link expiry duration", "year": "Current year"}',
  1,
  NOW(),
  NOW()
);


-- ===========================================================================
-- 2. PASSWORD CHANGE OTP EMAIL TEMPLATE
-- ===========================================================================

INSERT INTO notification_templates (
  id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt
) VALUES (
  UUID(),
  'password-change-otp',
  'Password Change OTP',
  'auth.password_change_otp',
  'EMAIL',
  'Your VCLOP Password Change OTP',
  -- HTML Body
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Change OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">VCLOP</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Password Change OTP</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                You requested to change your password. Use this One-Time Password (OTP) to complete the process:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="display: inline-block; padding: 30px 60px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border: 3px dashed #667eea;">
                      <p style="margin: 0; font-size: 48px; font-weight: 700; color: #667eea; letter-spacing: 12px; font-family: ''Courier New'', monospace;">{{otp}}</p>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 32px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⏱ Important:</strong> This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.
                </p>
              </div>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  <strong>Didn''t request a password change?</strong>
                </p>
                <p style="margin: 8px 0 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  If you didn''t request this, please contact our support team immediately.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 32px; text-align: center;">
              <p style="margin: 0; color: #6b6b6b; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- Plain Text Body
  'Hi {{firstName}},

You requested to change your password. Use this One-Time Password (OTP) to complete the process:

OTP: {{otp}}

⏱ This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.

DIDN''T REQUEST A PASSWORD CHANGE?
If you didn''t request this, please contact our support team immediately.

Best regards,
The VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.',
  '{"firstName": "User first name", "otp": "6-digit OTP code", "expiresIn": "OTP expiry duration", "year": "Current year"}',
  1,
  NOW(),
  NOW()
);


-- ===========================================================================
-- 3. EMAIL VERIFICATION TEMPLATE
-- ===========================================================================

INSERT INTO notification_templates (
  id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt
) VALUES (
  UUID(),
  'email-verification',
  'Email Verification',
  'auth.email_verification',
  'EMAIL',
  'Verify Your VCLOP Email Address',
  -- HTML Body
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to VCLOP</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 32px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Welcome to VCLOP! Please verify your email address by clicking the button below:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{verifyLink}}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="{{verifyLink}}" style="color: #667eea; word-break: break-all;">{{verifyLink}}</a>
              </p>
              <div style="margin-top: 32px; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Security Notice:</strong> This verification link will expire in 24 hours for security purposes.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 32px; text-align: center;">
              <p style="margin: 0; color: #6b6b6b; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- Plain Text Body
  'Hi {{firstName}},

Welcome to VCLOP! Please verify your email address by clicking the link below:

{{verifyLink}}

🔒 Security Notice: This verification link will expire in 24 hours for security purposes.

Best regards,
The VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.',
  '{"firstName": "User first name", "verifyLink": "Email verification URL", "year": "Current year"}',
  1,
  NOW(),
  NOW()
);


-- ===========================================================================
-- VERIFY TEMPLATES WERE INSERTED
-- ===========================================================================

SELECT 
  code,
  name,
  event,
  channel,
  isActive,
  createdAt
FROM notification_templates
WHERE event IN ('auth.password_reset', 'auth.password_change_otp', 'auth.email_verification')
ORDER BY createdAt DESC;

-- Expected: 3 rows showing all three templates
