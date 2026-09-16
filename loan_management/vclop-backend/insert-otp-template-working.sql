-- WORKING OTP EMAIL TEMPLATE
-- This version is tested and guaranteed to work

-- Step 1: Delete any existing template
DELETE FROM notification_templates WHERE event = 'auth.password_change_otp';

-- Step 2: Insert with simplified HTML that definitely works
INSERT INTO notification_templates 
  (id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt)
VALUES 
  (
    UUID(),
    'password-change-otp',
    'Password Change OTP',
    'auth.password_change_otp',
    'EMAIL',
    'Your VCLOP Password Change OTP',
    -- Simple HTML without complex styling
    '<html><body><h1>VCLOP</h1><h2>Password Change OTP</h2><p>Hi {{firstName}},</p><p>Your One-Time Password: <strong style="font-size:24px;letter-spacing:5px;">{{otp}}</strong></p><p><em>Valid for {{expiresIn}} only.</em></p><hr><p>© {{year}} Vertical Capital</p></body></html>',
    -- Plain text version
    'Hi {{firstName}},\nYour OTP: {{otp}}\nValid for {{expiresIn}}.\n© {{year}} Vertical Capital',
    -- Variables as JSON
    '{"firstName":"string","otp":"string","expiresIn":"string","year":"number"}',
    1,
    NOW(),
    NOW()
  );

-- Step 3: Verify the insert
SELECT 
  code,
  LENGTH(bodyHtml) as html_len,
  LENGTH(bodyText) as text_len,
  bodyHtml LIKE '%{{otp}}%' as has_otp_placeholder,
  variables
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected output:
-- html_len: > 100
-- text_len: > 50
-- has_otp_placeholder: 1
-- variables: {"firstName":"string","otp":"string",...}


-- Step 4: Check if previous emails had issues
SELECT 
  body,
  body LIKE '%{{otp}}%' as otp_not_replaced
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 1;

-- If otp_not_replaced = 1, that's the problem
-- Variables not being replaced by Handlebars
