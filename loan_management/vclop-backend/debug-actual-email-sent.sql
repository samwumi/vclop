-- DEBUG: Check what's actually being sent in emails

-- Step 1: Check the most recent OTP email sent
SELECT 
  id,
  event,
  status,
  recipientRef as email_to,
  subject,
  body as plain_text_version,
  LENGTH(body) as body_length,
  createdAt,
  sentAt,
  errorMessage
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 1;

-- Look at the 'body' column - does it contain the OTP number or just {{otp}}?


-- Step 2: Check the template in database
SELECT 
  code,
  event,
  variables,
  SUBSTRING(bodyHtml, LOCATE('{{otp}}', bodyHtml) - 30, 80) as otp_html_context,
  SUBSTRING(bodyText, LOCATE('{{otp}}', bodyText) - 20, 60) as otp_text_context,
  LENGTH(bodyHtml) as html_length,
  LENGTH(bodyText) as text_length
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected:
-- otp_html_context should show: ...monospace;">{{otp}}</p>...
-- otp_text_context should show: ...Your OTP: {{otp}}...


-- Step 3: Check if OTP is being generated
SELECT 
  token as otp_code,
  type,
  userId,
  expiresAt,
  usedAt,
  createdAt,
  TIMESTAMPDIFF(MINUTE, createdAt, NOW()) as minutes_ago
FROM tokens
WHERE type = 'PASSWORD_CHANGE_OTP'
ORDER BY createdAt DESC
LIMIT 3;

-- You should see 6-digit codes like "123456"
-- If empty, OTP generation is broken


-- Step 4: If template has {{otp}} but it's not being replaced, 
-- the issue is with Handlebars variable substitution

-- Check if variables field is proper JSON:
SELECT 
  code,
  JSON_VALID(variables) as is_valid_json,
  JSON_TYPE(variables) as json_type,
  JSON_EXTRACT(variables, '$.otp') as has_otp_key,
  variables
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected:
-- is_valid_json: 1
-- json_type: OBJECT
-- has_otp_key: "string" or "6-digit OTP code"
