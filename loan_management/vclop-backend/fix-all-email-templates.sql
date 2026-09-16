-- FIX ALL EMAIL TEMPLATES
-- This will delete old empty templates and insert complete ones
-- Run this in phpMyAdmin

-- Step 1: Delete existing templates (if they're empty)
DELETE FROM notification_templates 
WHERE event IN ('auth.password_reset', 'auth.password_change_otp', 'auth.email_verification');

-- Step 2: Insert complete templates with all fields

-- PASSWORD RESET TEMPLATE
INSERT INTO notification_templates (
  id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt
) VALUES (
  UUID(),
  'password-reset',
  'Password Reset',
  'auth.password_reset',
  'EMAIL',
  'Reset Your VCLOP Password',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Password Reset</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:32px;">VCLOP</h1></td></tr><tr><td style="padding:40px;"><h2 style="margin:0 0 16px;color:#1a1a1a;font-size:24px;">Password Reset Request</h2><p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;">Hi {{firstName}},</p><p style="margin:0 0 32px;color:#4a4a4a;font-size:16px;">Click the button below to reset your password:</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="{{resetLink}}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset Password</a></td></tr></table><p style="margin:32px 0 0;color:#6b6b6b;font-size:14px;">Or copy this link:<br><a href="{{resetLink}}" style="color:#667eea;">{{resetLink}}</a></p><div style="margin-top:32px;padding:20px;background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;"><p style="margin:0;color:#856404;font-size:14px;"><strong>Important:</strong> Link expires in {{expiresIn}}.</p></div></td></tr><tr><td style="background:#f8f9fa;padding:32px;text-align:center;"><p style="margin:0;color:#6b6b6b;font-size:13px;">© {{year}} Vertical Capital</p></td></tr></table></td></tr></table></body></html>',
  'Hi {{firstName}},

Click this link to reset your password:
{{resetLink}}

This link expires in {{expiresIn}}.

© {{year}} Vertical Capital',
  '{"firstName":"string","resetLink":"string","expiresIn":"string","year":"number"}',
  1,
  NOW(),
  NOW()
);

-- PASSWORD CHANGE OTP TEMPLATE
INSERT INTO notification_templates (
  id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt
) VALUES (
  UUID(),
  'password-change-otp',
  'Password Change OTP',
  'auth.password_change_otp',
  'EMAIL',
  'Your VCLOP Password Change OTP',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Password OTP</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:32px;">VCLOP</h1></td></tr><tr><td style="padding:40px;"><h2 style="margin:0 0 16px;color:#1a1a1a;font-size:24px;">Password Change OTP</h2><p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;">Hi {{firstName}},</p><p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;">Use this One-Time Password (OTP) to change your password:</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;"><div style="padding:30px 60px;background:#f8f9fa;border-radius:12px;border:3px dashed #667eea;"><p style="margin:0;font-size:48px;font-weight:700;color:#667eea;letter-spacing:12px;font-family:Courier;">{{otp}}</p></div></td></tr></table><div style="margin-top:32px;padding:20px;background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;"><p style="margin:0;color:#856404;font-size:14px;"><strong>Important:</strong> OTP valid for {{expiresIn}} only. Do not share.</p></div></td></tr><tr><td style="background:#f8f9fa;padding:32px;text-align:center;"><p style="margin:0;color:#6b6b6b;font-size:13px;">© {{year}} Vertical Capital</p></td></tr></table></td></tr></table></body></html>',
  'Hi {{firstName}},

Use this OTP to change your password:

OTP: {{otp}}

Valid for {{expiresIn}} only. Do not share.

© {{year}} Vertical Capital',
  '{"firstName":"string","otp":"string","expiresIn":"string","year":"number"}',
  1,
  NOW(),
  NOW()
);

-- EMAIL VERIFICATION TEMPLATE
INSERT INTO notification_templates (
  id, code, name, event, channel, subject, bodyHtml, bodyText, variables, isActive, createdAt, updatedAt
) VALUES (
  UUID(),
  'email-verification',
  'Email Verification',
  'auth.email_verification',
  'EMAIL',
  'Verify Your VCLOP Email Address',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Email Verification</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:32px;">Welcome to VCLOP</h1></td></tr><tr><td style="padding:40px;"><h2 style="margin:0 0 16px;color:#1a1a1a;font-size:24px;">Verify Your Email</h2><p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;">Hi {{firstName}},</p><p style="margin:0 0 32px;color:#4a4a4a;font-size:16px;">Click the button below to verify your email:</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="{{verifyLink}}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Verify Email</a></td></tr></table><p style="margin:32px 0 0;color:#6b6b6b;font-size:14px;">Or copy this link:<br><a href="{{verifyLink}}" style="color:#667eea;">{{verifyLink}}</a></p><div style="margin-top:32px;padding:20px;background:#e3f2fd;border-left:4px solid #2196f3;border-radius:4px;"><p style="margin:0;color:#1565c0;font-size:14px;"><strong>Security:</strong> Link expires in 24 hours.</p></div></td></tr><tr><td style="background:#f8f9fa;padding:32px;text-align:center;"><p style="margin:0;color:#6b6b6b;font-size:13px;">© {{year}} Vertical Capital</p></td></tr></table></td></tr></table></body></html>',
  'Hi {{firstName}},

Welcome to VCLOP! Click this link to verify your email:
{{verifyLink}}

Link expires in 24 hours.

© {{year}} Vertical Capital',
  '{"firstName":"string","verifyLink":"string","year":"number"}',
  1,
  NOW(),
  NOW()
);

-- Verify all templates were inserted
SELECT 
  code,
  name,
  event,
  channel,
  LENGTH(bodyHtml) as html_size,
  LENGTH(bodyText) as text_size,
  isActive
FROM notification_templates
WHERE event IN ('auth.password_reset', 'auth.password_change_otp', 'auth.email_verification')
ORDER BY code;

-- Expected: 3 rows with html_size > 1000 each
