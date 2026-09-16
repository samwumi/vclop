# OTP Email Not Sending - Troubleshooting Guide

## Problem
You see "OTP sent" message but don't receive the email.

## Root Causes & Solutions

---

## ✅ **Solution 1: Check SMTP Configuration**

### **Verify .env has SMTP settings:**

**On Production Server:**
1. SSH or File Manager → open `.env`
2. Check these lines exist:

```env
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=noreply@yourdomain.com
MAIL_PASSWORD=your_password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@yourdomain.com
```

### **If missing or wrong:**
- Update `.env` with correct settings
- Restart backend:
  ```bash
  pm2 restart vclop-backend
  ```

---

## ✅ **Solution 2: Check Database Has OTP Template**

### **Query Database:**

**Using phpMyAdmin (Hostinger Panel):**
1. Go to Databases → phpMyAdmin
2. Select your database
3. Run this query:

```sql
SELECT 
  code, 
  event, 
  channel, 
  isActive 
FROM notification_templates 
WHERE event = 'auth.password_change_otp';
```

### **Expected Result:**
```
code: password-change-otp
event: auth.password_change_otp
channel: EMAIL
isActive: 1
```

### **If Empty (Template Missing):**

**You need to run the seed script:**

```bash
# SSH into production
ssh your-user@your-domain.com

# Navigate to backend
cd /path/to/vclop/loan_management/vclop-backend

# Run seed
npm run prisma:seed
```

**⚠️ Warning:** This will add all system data. If you've already seeded before, it might fail on duplicate entries (that's okay - templates will still be added).

---

## ✅ **Solution 3: Check Notification Logs**

### **See if email was attempted:**

```sql
SELECT 
  id,
  event,
  status,
  recipientRef,
  errorMessage,
  attempts,
  createdAt
FROM notification_logs
WHERE event = 'auth.password_change_otp'
ORDER BY createdAt DESC
LIMIT 5;
```

### **Check Status:**

**Status = SENT ✅**
- Email was sent successfully
- Check spam folder in your email

**Status = PENDING ⏳**
- Email is in queue
- Wait a few seconds and check again

**Status = FAILED ❌**
- Check `errorMessage` column for details
- Common errors:
  - "Authentication failed" → Wrong SMTP credentials
  - "ECONNREFUSED" → Wrong host or port
  - "ETIMEDOUT" → Firewall blocking SMTP

---

## ✅ **Solution 4: Test SMTP Connection Directly**

### **Create test script:**

Create file: `test-smtp.js` in backend folder

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log('Testing SMTP connection...');
    console.log('Host:', process.env.MAIL_HOST);
    console.log('Port:', process.env.MAIL_PORT);
    console.log('User:', process.env.MAIL_USER);
    
    const info = await transporter.sendMail({
      from: `"VCLOP Test" <${process.env.MAIL_FROM_EMAIL}>`,
      to: 'your-personal-email@gmail.com',
      subject: 'SMTP Test Email',
      text: 'If you receive this, SMTP is working!',
      html: '<p>If you receive this, SMTP is working!</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
```

### **Run test:**
```bash
node test-smtp.js
```

---

## ✅ **Solution 5: Verify Backend is Running Latest Code**

### **Check git status:**
```bash
cd /path/to/vclop/loan_management/vclop-backend
git log --oneline -5
```

### **If behind, pull latest:**
```bash
git pull origin main
npm install
pm2 restart vclop-backend
```

---

## 🔍 **Quick Diagnosis Steps**

Run these in order:

### **Step 1: Check if template exists**
```sql
SELECT COUNT(*) as count 
FROM notification_templates 
WHERE event = 'auth.password_change_otp' AND isActive = 1;
```
**Expected:** count = 1  
**If 0:** Run `npm run prisma:seed`

### **Step 2: Check if email was logged**
```sql
SELECT * 
FROM notification_logs 
WHERE event = 'auth.password_change_otp' 
ORDER BY createdAt DESC 
LIMIT 1;
```
**If empty:** Email wasn't even attempted (template missing or event not fired)  
**If exists:** Check status column

### **Step 3: Check SMTP config**
```bash
# SSH into server
cd /path/to/backend
grep MAIL_ .env
```
**Should show all MAIL_* variables**

### **Step 4: Check backend logs**
```bash
pm2 logs vclop-backend --lines 100 | grep -i "mail\|smtp\|notification"
```
**Look for errors**

---

## 🚨 **Common Issues & Fixes**

### **Issue: "Template not found"**
**Fix:** 
```bash
npm run prisma:seed
pm2 restart vclop-backend
```

### **Issue: "Authentication failed"**
**Fix:** 
- Verify SMTP password in `.env`
- No spaces in password
- Try resetting email password in Hostinger

### **Issue: "ECONNREFUSED"**
**Fix:**
```env
# Try different port
MAIL_PORT=465
MAIL_SECURE=true
```

### **Issue: Email in spam**
**Fix:**
- Check spam folder
- For production: Configure SPF/DKIM in Hostinger DNS

### **Issue: Backend not restarted**
**Fix:**
```bash
pm2 restart vclop-backend
pm2 logs vclop-backend --lines 20
```

---

## 📋 **Complete Checklist**

- [ ] `.env` file has all MAIL_* variables
- [ ] SMTP credentials are correct (no typos)
- [ ] Database has `password-change-otp` template
- [ ] Template is active (`isActive = 1`)
- [ ] Backend restarted after .env changes
- [ ] No errors in backend logs
- [ ] Test email script works
- [ ] Checked spam folder

---

## 🎯 **Most Likely Issue**

Based on your situation, it's probably **one of these**:

1. **SMTP just configured, backend not restarted**
   ```bash
   pm2 restart vclop-backend
   ```

2. **Database missing OTP template**
   ```bash
   npm run prisma:seed
   ```

3. **Wrong SMTP credentials in .env**
   - Double-check email password
   - Try port 465 instead of 587

---

## 💡 **Quick Test**

Try this simple test:

```bash
# Request OTP again
curl -X POST https://yourdomain.com/api/v1/auth/request-password-change-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Immediately check logs
pm2 logs vclop-backend --lines 50
```

**Look for:**
- ✅ "Notification sent" or "Email sent"
- ❌ Any error messages

---

## 📞 **Still Not Working?**

Run this diagnostic and share results:

```bash
# Check everything
echo "=== SMTP Config ==="
grep MAIL_ .env

echo ""
echo "=== Template Check ==="
mysql -u dbuser -p -D dbname -e "SELECT code, event, isActive FROM notification_templates WHERE event = 'auth.password_change_otp';"

echo ""
echo "=== Recent Logs ==="
mysql -u dbuser -p -D dbname -e "SELECT status, errorMessage FROM notification_logs WHERE event = 'auth.password_change_otp' ORDER BY createdAt DESC LIMIT 3;"

echo ""
echo "=== Backend Logs ==="
pm2 logs vclop-backend --lines 20 --nostream
```

Share the output and I'll help debug! 😊
