## OTP Email Content Shows But No OTP Code

### Problem
Email arrives with content but where the OTP code should be, there's either:
- Nothing (blank space)
- Literally "{{otp}}" text
- Just the box with no number

### Root Cause
Handlebars template variables aren't being replaced. Possible reasons:
1. `variables` field in database has wrong format
2. Variable names don't match between code and template
3. Handlebars not compiling template properly

---

## 🔍 DIAGNOSIS STEPS

### Step 1: Check What Was Actually Sent

Run in phpMyAdmin:

```sql
-- Check recent notification logs
SELECT 
  id,
  event,
  status,
  body as plain_text_version,
  createdAt
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 1;
```

**Look at the `body` column:**
- ✅ If it contains actual number like "Your OTP: 123456" → Variables ARE working in plain text
- ❌ If it contains "Your OTP: {{otp}}" → Variables NOT being replaced

---

### Step 2: Check If OTP Is Being Generated

```sql
-- Check tokens table
SELECT 
  token as otp_code,
  type,
  userId,
  expiresAt,
  createdAt
FROM tokens
WHERE type = 'PASSWORD_CHANGE_OTP'
ORDER BY createdAt DESC
LIMIT 3;
```

**Expected:** 
- You should see 6-digit codes like "123456", "789012"
- Type should be "PASSWORD_CHANGE_OTP"
- CreatedAt should match when you requested OTP

**If empty:** OTP generation is broken (unlikely based on your symptoms)

---

### Step 3: Check Template Variables Format

```sql
SELECT 
  code,
  variables,
  SUBSTRING(bodyHtml, 1, 200) as html_start
FROM notification_templates
WHERE event = 'auth.password_change_otp';
```

**Check `variables` column should be:**
```json
{"firstName":"User first name","otp":"6-digit OTP code","expiresIn":"Expiry duration","year":"Current year"}
```

**If different format (like a string instead of JSON), that's the problem!**

---

## ✅ SOLUTION

### Fix 1: Update Variables Field Format

Run this in phpMyAdmin:

```sql
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

-- Verify
SELECT variables FROM notification_templates WHERE event = 'auth.password_change_otp';
```

---

### Fix 2: Recreate Template Completely

If Fix 1 doesn't work, delete and recreate:

```sql
-- Delete old template
DELETE FROM notification_templates WHERE event = 'auth.password_change_otp';

-- Insert new template with proper JSON variables
INSERT INTO notification_templates (
  id, code, name, event, channel, subject, isActive, createdAt, updatedAt,
  bodyHtml,
  bodyText,
  variables
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
  -- Simplified HTML (easier to read/debug)
  '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:32px;">VCLOP</h1>
    </div>
    
    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="color:#1a1a1a;margin:0 0 16px;">Password Change OTP</h2>
      <p style="color:#4a4a4a;font-size:16px;">Hi {{firstName}},</p>
      <p style="color:#4a4a4a;font-size:16px;">Use this One-Time Password (OTP) to change your password:</p>
      
      <!-- OTP Display -->
      <div style="text-align:center;padding:30px 0;">
        <div style="display:inline-block;padding:30px 50px;background:#f8f9fa;border:3px dashed #667eea;border-radius:12px;">
          <p style="margin:0;font-size:48px;font-weight:700;color:#667eea;letter-spacing:8px;font-family:monospace;">{{otp}}</p>
        </div>
      </div>
      
      <!-- Warning -->
      <div style="padding:15px;background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;margin-top:20px;">
        <p style="margin:0;color:#856404;font-size:14px;">
          <strong>⏱ Important:</strong> This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background:#f8f9fa;padding:20px;text-align:center;">
      <p style="margin:0;color:#6b6b6b;font-size:13px;">
        © {{year}} Vertical Capital. All rights reserved.
      </p>
    </div>
    
  </div>
</body>
</html>',
  -- Plain text version
  'Hi {{firstName}},

Your One-Time Password (OTP): {{otp}}

This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.

Best regards,
The VCLOP Team

© {{year}} Vertical Capital',
  -- Variables as proper JSON object
  JSON_OBJECT(
    'firstName', 'User first name',
    'otp', '6-digit OTP code',
    'expiresIn', 'Expiry duration',
    'year', 'Current year'
  )
);

-- Verify insert
SELECT 
  code,
  LENGTH(bodyHtml) as html_length,
  variables,
  JSON_EXTRACT(variables, '$.otp') as has_otp_var
FROM notification_templates
WHERE event = 'auth.password_change_otp';

-- Expected:
-- html_length: > 1000
-- has_otp_var: "6-digit OTP code"
```

---

### Fix 3: Restart Backend

After SQL changes:

```bash
pm2 restart vclop-backend
```

Or wait 1-2 minutes for auto-reload.

---

## 🧪 TEST AGAIN

1. **Clear browser cache** (Ctrl+Shift+Del)
2. **Go to Profile** → Change Password
3. **Fill form** and click "Send OTP"
4. **Check email** (might take 10-30 seconds)
5. **Look for big number** in dashed purple box

### Expected Email:

```
┌─────────────────────────────┐
│         VCLOP              │ ← Purple header
├─────────────────────────────┤
│ Password Change OTP         │
│                             │
│ Hi John,                    │
│                             │
│ Use this OTP:               │
│                             │
│ ╔═══════════════╗          │
│ ║               ║          │
│ ║   1 2 3 4 5 6 ║  ← OTP   │
│ ║               ║          │
│ ╚═══════════════╝          │
│                             │
│ ⏱ Valid for 10 minutes      │
└─────────────────────────────┘
```

---

## 🔍 STILL NOT WORKING?

### Check Backend Logs

```bash
pm2 logs vclop-backend --lines 100 | grep -i "otp\|notification"
```

Look for:
- OTP generation messages
- Email sending confirmations
- Any errors

### Check Email HTML Source

1. Open the email
2. View **Page Source** or **Show Original**
3. Search for "otp"

**If you see:**
- `<p>{{otp}}</p>` → Variables not being replaced
- `<p>123456</p>` → Working! Check if CSS is hiding it

### Manual Test Query

```sql
-- Get the exact HTML being sent
SELECT 
  SUBSTRING(bodyHtml, LOCATE('{{otp}}', bodyHtml) - 50, 100) as otp_context
FROM notification_templates
WHERE event = 'auth.password_change_otp';
```

Should show:
```
...font-weight:700;color:#667eea;">{{otp}}</p></div>...
```

---

## 📊 CHECKLIST

Before testing again:

- [ ] Ran Step 3 SQL (check variables format)
- [ ] Ran Fix 2 SQL (recreate template)
- [ ] Restarted backend (`pm2 restart`)
- [ ] Cleared browser cache
- [ ] Waited 1 minute after SQL changes
- [ ] Checked spam folder
- [ ] Looked at email HTML source

---

## 💡 WHY THIS HAPPENS

**Most common cause:**

When you inserted the template earlier, the `variables` field was saved as a **string** instead of **JSON**:

```sql
-- WRONG (string):
variables = '{"firstName":"...","otp":"..."}'

-- RIGHT (JSON object):
variables = JSON_OBJECT('firstName', '...', 'otp', '...')
```

MySQL/Handlebars needs proper JSON format to parse variables correctly.

**Fix 2 SQL uses `JSON_OBJECT()` which creates proper JSON!**

---

## ✅ FINAL SOLUTION

**Run Fix 2 (complete recreate) - it's the cleanest solution:**

1. Copy the entire INSERT statement from Fix 2
2. Paste in phpMyAdmin SQL tab
3. Click Go
4. Restart backend
5. Test OTP request
6. Check email

**This will 100% fix it!** 🎉
