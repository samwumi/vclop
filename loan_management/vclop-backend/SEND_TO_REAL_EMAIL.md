# 📧 Send to Real Email Addresses (Gmail)

## Current Setup: Mailtrap (Testing Only)

Right now, you're using **Mailtrap** which is a **testing service**. All emails are caught by Mailtrap and never actually sent to real email addresses. This is perfect for development/testing!

To send to real Gmail addresses like `aladewadewumi91@gmail.com`, you need to switch to Gmail SMTP.

---

## Option 1: Use Gmail SMTP (Send to Real Emails)

### Step 1: Generate Gmail App Password

1. Go to: **https://myaccount.google.com/security**
2. Make sure **2-Step Verification** is turned ON
   - If not, enable it first
3. Go to: **https://myaccount.google.com/apppasswords**
4. Click **"Select app"** → Choose **"Mail"**
5. Click **"Select device"** → Choose **"Windows Computer"**
6. Click **"Generate"**
7. Copy the **16-character password** (no spaces)
   - Example: `abcd efgh ijkl mnop`
   - Remove spaces: `abcdefghijklmnop`

### Step 2: Update .env File

Replace your email settings in `.env` with:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=aladewadewumi91@gmail.com
MAIL_PASSWORD=your_16_char_app_password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=aladewadewumi91@gmail.com
```

**Important:** 
- Use YOUR App Password (the 16-character one)
- Remove all spaces from the password
- Use your actual Gmail address

### Step 3: Restart the Backend

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then start again:
npm run start:dev
```

### Step 4: Create a Test User to Send Verification Email

First, you need to create a user account for that email:

```powershell
# Login as admin
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"Admin@12345!"}'
$token = $login.data.accessToken

# Get branch and department IDs
$branchId = (Invoke-RestMethod -Uri "http://localhost:3000/api/v1/branches" -Headers @{"Authorization"="Bearer $token"}).data.items[0].id
$deptId = (Invoke-RestMethod -Uri "http://localhost:3000/api/v1/departments" -Headers @{"Authorization"="Bearer $token"}).data.items[0].id

# Create user with your Gmail
$userBody = @{
    employeeId = "ALAD-001"
    email = "aladewadewumi91@gmail.com"
    username = "aladeofficial"
    firstName = "Alade"
    lastName = "Adewumi"
    password = "SecurePass@123"
    branchId = $branchId
    departmentId = $deptId
    sendVerificationEmail = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/users" -Method POST -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $token"} -Body $userBody
```

**Check your Gmail inbox!** You should receive the verification email.

### Step 5: Send Password Reset to Your Gmail

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email": "aladewadewumi91@gmail.com"}'
```

**Check your Gmail inbox!**

---

## ⚠️ Important Notes About Gmail

### Daily Limits
- Gmail has a limit of **500 emails per day** for free accounts
- For production, use professional email services (SendGrid, AWS SES)

### Spam Warnings
- First few emails might go to spam
- Mark as "Not Spam" to train Gmail
- Add sender to contacts

### Security
- Never share your App Password
- If compromised, delete it and generate a new one
- Each app/device should have its own App Password

---

## Option 2: Keep Mailtrap for Testing (Recommended)

**Why Mailtrap is better for testing:**
- ✅ Catch all emails safely (no accidental sends to real users)
- ✅ Test email content without cluttering your inbox
- ✅ See all emails in one place
- ✅ No daily limits
- ✅ Can test with any email address
- ✅ Preview emails on different devices

**For now:** Use Mailtrap for development and testing.  
**For production:** Switch to professional SMTP (SendGrid, AWS SES, etc.)

---

## Option 3: Use Both (Best Practice)

Keep two `.env` files:

### `.env.development` (Mailtrap - for testing)
```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=b659f2bdd60979
MAIL_PASSWORD=717c4db6619b49
MAIL_FROM_EMAIL=noreply@vclop.local
```

### `.env.production` (Gmail or SendGrid - for real emails)
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=aladewadewumi91@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_EMAIL=aladewadewumi91@gmail.com
```

Switch between them as needed.

---

## 🎯 Quick Decision Guide

**Want to test functionality?**
→ Keep Mailtrap (current setup)

**Want to send to your real Gmail once?**
→ Switch to Gmail SMTP (follow Option 1)

**Building production app?**
→ Use professional SMTP service (SendGrid, AWS SES)

---

## Troubleshooting Gmail

### "Invalid credentials" error
- Make sure 2-Step Verification is enabled
- Use App Password, not regular Gmail password
- Remove spaces from App Password

### Emails going to spam
- Check Gmail's spam folder
- Mark as "Not Spam"
- Send a few test emails to train Gmail

### "Less secure app" error
- This shouldn't happen with App Passwords
- Make sure you're using App Password, not regular password

---

## Summary

**Current:** Emails caught by Mailtrap (safe testing)  
**To send to Gmail:** Switch SMTP settings and restart backend  
**Recommendation:** Keep Mailtrap for testing, use real SMTP only when needed

Need help setting up Gmail SMTP? Just let me know!
