-- Quick check: Does OTP email template exist?

-- Step 1: Check if template exists
SELECT 
  code, 
  name,
  event, 
  channel, 
  isActive,
  createdAt
FROM notification_templates 
WHERE event = 'auth.password_change_otp';

-- Expected result: 1 row
-- code: password-change-otp
-- event: auth.password_change_otp
-- isActive: 1

-- If NO RESULTS: You need to run: npm run prisma:seed


-- Step 2: Check recent OTP notification attempts
SELECT 
  id,
  event,
  status,
  recipientRef as email,
  subject,
  errorMessage,
  attempts,
  createdAt
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 10;

-- Status meanings:
-- SENT = Success ✅
-- PENDING = In queue ⏳
-- FAILED = Error (check errorMessage) ❌


-- Step 3: Check if ANY emails are working
SELECT 
  event,
  status,
  COUNT(*) as count
FROM notification_logs
GROUP BY event, status
ORDER BY createdAt DESC;

-- This shows which email types are working
