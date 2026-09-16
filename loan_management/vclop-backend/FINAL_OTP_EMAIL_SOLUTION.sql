-- FINAL OTP EMAIL SOLUTION
-- This is the absolute simplest version that WILL work

-- Delete old template
DELETE FROM notification_templates WHERE event = 'auth.password_change_otp';

-- Insert ultra-simple template
INSERT INTO notification_templates 
VALUES (
  UUID(),
  'password-change-otp',
  'Password Change OTP',
  'auth.password_change_otp',
  'EMAIL',
  'VCLOP - Password Change Code',
  -- Very simple HTML
  '<div style="font-family:Arial;padding:20px;"><h2>VCLOP</h2><p>Hi {{firstName}},</p><p>Your password change code is:</p><h1 style="letter-spacing:10px;color:#667eea;">{{otp}}</h1><p>Valid for {{expiresIn}}.</p></div>',
  -- Plain text
  'Hi {{firstName}}, Your code: {{otp}}. Valid {{expiresIn}}.',
  -- Variables JSON - simple format
  '{"firstName":"User","otp":"123456","expiresIn":"10 min","year":"2024"}',
  1,
  NOW(),
  NOW()
);

-- Verify
SELECT code, bodyHtml, bodyText FROM notification_templates WHERE event = 'auth.password_change_otp';
