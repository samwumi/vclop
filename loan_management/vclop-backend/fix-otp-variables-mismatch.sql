-- FIX OTP VARIABLE MISMATCH
-- The template might have the wrong variable format

-- Step 1: Check current variables format
SELECT 
  code,
  event,
  variables,
  JSON_EXTRACT(variables, '$.otp') as otp_definition
FROM notification_templates
WHERE event = 'auth.password_change_otp';


-- Step 2: Update template with correct variables format
UPDATE notification_templates
SET 
  variables = JSON_OBJECT(
    'firstName', 'User first name',
    'otp', '6-digit OTP code',
    'expiresIn', 'Expiry duration',
    'year', 'Current year'
  ),
  updatedAt = NOW()
WHERE event = 'auth.password_change_otp';


-- Step 3: Verify the update
SELECT 
  code,
  variables,
  JSON_EXTRACT(variables, '$.otp') as has_otp,
  JSON_EXTRACT(variables, '$.firstName') as has_firstName
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Should show:
-- has_otp: "6-digit OTP code"
-- has_firstName: "User first name"


-- Step 4: Test by checking if bodyHtml contains {{otp}}
SELECT 
  CASE 
    WHEN bodyHtml LIKE '%{{otp}}%' THEN 'YES - Template has {{otp}} placeholder'
    ELSE 'NO - Template missing {{otp}}'
  END as has_otp_placeholder,
  CASE
    WHEN bodyHtml LIKE '%{{firstName}}%' THEN 'YES'
    ELSE 'NO'
  END as has_firstName_placeholder,
  CASE
    WHEN bodyHtml LIKE '%{{expiresIn}}%' THEN 'YES'
    ELSE 'NO'
  END as has_expiresIn_placeholder,
  CASE
    WHEN bodyHtml LIKE '%{{year}}%' THEN 'YES'
    ELSE 'NO'
  END as has_year_placeholder
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- All should say YES


-- If template is corrupted, recreate it completely:
/*
DELETE FROM notification_templates WHERE event = 'auth.password_change_otp';

INSERT INTO notification_templates (
  id, code, name, event, channel, subject, isActive, createdAt, updatedAt, bodyHtml, bodyText, variables
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
  '<!DOCTYPE html><html><body style="font-family:Arial;"><div style="max-width:600px;margin:0 auto;background:#fff;"><div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;"><h1 style="color:#fff;margin:0;">VCLOP</h1></div><div style="padding:40px;"><h2 style="color:#1a1a1a;">Password Change OTP</h2><p>Hi {{firstName}},</p><p>Use this OTP to change your password:</p><div style="text-align:center;padding:30px;"><div style="display:inline-block;padding:30px 50px;background:#f8f9fa;border:3px dashed #667eea;border-radius:12px;"><p style="margin:0;font-size:48px;font-weight:700;color:#667eea;letter-spacing:8px;">{{otp}}</p></div></div><div style="padding:15px;background:#fff3cd;border-left:4px solid #ffc107;margin-top:20px;"><p style="margin:0;color:#856404;"><strong>Important:</strong> Valid for {{expiresIn}} only.</p></div></div><div style="background:#f8f9fa;padding:20px;text-align:center;"><p style="margin:0;color:#6b6b6b;">© {{year}} Vertical Capital</p></div></div></body></html>',
  'Hi {{firstName}},\n\nYour OTP: {{otp}}\n\nValid for {{expiresIn}}.\n\n© {{year}} Vertical Capital',
  JSON_OBJECT('firstName', 'User first name', 'otp', '6-digit OTP code', 'expiresIn', 'Expiry duration', 'year', 'Current year')
);

SELECT 'Template recreated' as status;
*/
