-- DIAGNOSE OTP EMAIL ISSUE
-- Run this to see what's in the database

-- Step 1: Check if template exists and has content
SELECT 
  id,
  code,
  event,
  subject,
  SUBSTRING(bodyHtml, 1, 100) as html_preview,
  SUBSTRING(bodyText, 1, 100) as text_preview,
  LENGTH(bodyHtml) as html_length,
  LENGTH(bodyText) as text_length,
  variables,
  isActive,
  updatedAt
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected:
-- html_length should be > 1000
-- text_length should be > 100
-- html_preview should start with "<!DOCTYPE html>"


-- Step 2: Check recent notification attempts
SELECT 
  id,
  event,
  status,
  recipientRef,
  SUBSTRING(body, 1, 200) as body_preview,
  errorMessage,
  attempts,
  sentAt,
  createdAt
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 5;

-- Check what variables were used in the actual sent email


-- Step 3: If template is still empty, let's fix it now
-- Uncomment and run this:

/*
DELETE FROM notification_templates WHERE event = 'auth.password_change_otp';

INSERT INTO notification_templates (
  id, code, name, event, channel, subject, isActive, createdAt, updatedAt,
  bodyHtml, bodyText, variables
) VALUES (
  UUID(),
  'password-change-otp',
  'Password Change OTP',
  'auth.password_change_otp',
  'EMAIL',
  'Your VCLOP Password Change OTP',
  1,
  NOW(),
  NOW(),
  CONCAT(
    '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial;">',
    '<div style="max-width:600px;margin:0 auto;background:#fff;">',
    '<div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;">',
    '<h1 style="color:#fff;margin:0;">VCLOP</h1></div>',
    '<div style="padding:40px;">',
    '<h2 style="color:#1a1a1a;">Password Change OTP</h2>',
    '<p style="color:#4a4a4a;">Hi {{firstName}},</p>',
    '<p style="color:#4a4a4a;">Use this OTP to change your password:</p>',
    '<div style="text-align:center;padding:20px;">',
    '<div style="display:inline-block;padding:30px 60px;background:#f8f9fa;border:3px dashed #667eea;border-radius:12px;">',
    '<p style="margin:0;font-size:48px;font-weight:700;color:#667eea;letter-spacing:10px;">{{otp}}</p>',
    '</div></div>',
    '<div style="margin-top:20px;padding:15px;background:#fff3cd;border-left:4px solid #ffc107;">',
    '<p style="margin:0;color:#856404;"><strong>Important:</strong> Valid for {{expiresIn}} only.</p>',
    '</div></div>',
    '<div style="background:#f8f9fa;padding:20px;text-align:center;">',
    '<p style="margin:0;color:#6b6b6b;font-size:13px;">© {{year}} Vertical Capital</p>',
    '</div></div></body></html>'
  ),
  'Hi {{firstName}},\n\nYour OTP: {{otp}}\n\nValid for {{expiresIn}}.\n\n© {{year}} Vertical Capital',
  '{"firstName":"string","otp":"string","expiresIn":"string","year":"number"}'
);
*/

-- Step 4: Verify the insert worked
SELECT 
  code, 
  LENGTH(bodyHtml) as html_len,
  SUBSTRING(bodyHtml, 1, 50) as starts_with
FROM notification_templates 
WHERE event = 'auth.password_change_otp';

-- Should show: html_len > 1000, starts_with = "<!DOCTYPE html>"
