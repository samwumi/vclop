-- CHECK OTP VARIABLES IN SENT EMAILS
-- This will show us what's actually being sent

-- Step 1: Check the template variables definition
SELECT 
  code,
  event,
  variables,
  SUBSTRING(bodyHtml, LOCATE('{{otp}}', bodyHtml) - 20, 50) as otp_context
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected: variables should contain "otp" key
-- otp_context should show: ...{{otp}}...


-- Step 2: Check what was actually sent in notification logs
SELECT 
  id,
  event,
  status,
  recipientRef as email,
  body as plain_text_sent,
  createdAt
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 3;

-- Check if "body" column contains the actual OTP number or just {{otp}}


-- Step 3: Check if OTP is being generated in tokens table
SELECT 
  id,
  userId,
  type,
  token as otp_code,
  expiresAt,
  usedAt,
  createdAt
FROM tokens
WHERE type = 'PASSWORD_CHANGE_OTP'
ORDER BY createdAt DESC
LIMIT 5;

-- This shows if OTP codes are being generated at all


-- DIAGNOSIS:
-- If body contains "{{otp}}" (not replaced) → Template variables not matching
-- If body is empty → bodyText not being used
-- If tokens table is empty → OTP generation failed
