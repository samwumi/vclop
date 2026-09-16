# Deploy SMTP Configuration via Hostinger Panel

## 🚀 Quick Deployment Guide for Hostinger

Since you're using **Hostinger Panel**, here's how to configure SMTP for your **live production app**:

---

## Step 1: Access Your Files

### **Option A: File Manager (Easiest)**
1. Log in to **Hostinger hPanel**: https://hpanel.hostinger.com
2. Go to **Files** → **File Manager**
3. Navigate to your backend folder:
   ```
   /home/username/public_html/vclop/loan_management/vclop-backend
   ```
   (Path may vary - find where your backend is deployed)

### **Option B: SSH Access**
1. Enable SSH in Hostinger Panel (Advanced → SSH Access)
2. Use SSH client:
   ```bash
   ssh username@your-domain.com
   cd /path/to/vclop/loan_management/vclop-backend
   ```

---

## Step 2: Get Hostinger Email Settings

### **Find Your SMTP Credentials:**

1. In Hostinger Panel, go to **Emails** → **Email Accounts**
2. Click on your email account (e.g., `noreply@yourdomain.com`)
3. Look for **"Manual Setup"** or **"Mail Client Configuration"**

**You'll see something like:**
```
Incoming (IMAP):
  Server: imap.hostinger.com
  Port: 993
  
Outgoing (SMTP):
  Server: smtp.hostinger.com
  Port: 587 or 465
  Encryption: STARTTLS or SSL/TLS
```

**Common Hostinger SMTP Settings:**
```
Host: smtp.hostinger.com
Port: 587 (or 465)
Username: noreply@yourdomain.com
Password: [your email password]
```

---

## Step 3: Update .env File

### **Using File Manager:**

1. Navigate to backend folder
2. Find `.env` file
3. Click **Edit**
4. Add/Update these lines:

```env
# Email Configuration (Hostinger)
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=noreply@yourdomain.com
MAIL_PASSWORD=your_email_password_here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@yourdomain.com

# If port 587 doesn't work, try:
# MAIL_PORT=465
# MAIL_SECURE=true
```

5. Click **Save & Close**

### **Using SSH:**

```bash
# Edit .env file
nano .env

# Add the mail settings above
# Save: Ctrl+X, then Y, then Enter
```

---

## Step 4: Restart Your Backend

### **If using PM2 (most common):**

```bash
pm2 list
pm2 restart vclop-backend
pm2 logs vclop-backend --lines 50
```

### **If using Node directly:**

```bash
# Find the process
ps aux | grep node

# Kill it
kill -9 <process_id>

# Start again
npm run start:prod &
```

### **If using Docker:**

```bash
docker-compose restart backend
```

### **Using Hostinger Control Panel:**

Some Hostinger plans have a restart button:
1. Go to **Advanced** → **Application**
2. Find your Node.js application
3. Click **Restart**

---

## Step 5: Test Email Sending

### **Check Backend Logs:**

**Via File Manager:**
- Look for logs in `/logs` folder or check error logs in panel

**Via SSH:**
```bash
# If using PM2
pm2 logs vclop-backend --lines 100

# Check for mail-related errors
grep -i "mail\|smtp" /path/to/logs/error.log
```

### **Test Forgot Password API:**

Use the frontend forgot password form, or test directly:

```bash
curl -X POST https://yourdomain.com/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

**Check:**
1. Does the email arrive?
2. Check spam folder
3. Click the reset link - does it work?

---

## Step 6: Verify in Database

### **Check Notification Logs:**

**Option A: phpMyAdmin (Hostinger Panel)**
1. Go to **Databases** → **phpMyAdmin**
2. Select your database
3. Run query:

```sql
SELECT 
  id,
  event,
  status,
  recipientRef,
  subject,
  errorMessage,
  createdAt
FROM notification_logs
WHERE event = 'auth.password_reset'
ORDER BY createdAt DESC
LIMIT 10;
```

**Expected Results:**
```
status: SENT ✅
errorMessage: NULL
```

**If status is FAILED:**
- Check `errorMessage` column for details
- Common issues: wrong credentials, wrong port

---

## 🔧 Troubleshooting

### ❌ "ECONNREFUSED" or "Connection timeout"

**Try different port:**
```env
# Option 1: Port 465 with SSL
MAIL_PORT=465
MAIL_SECURE=true

# Option 2: Port 587 with STARTTLS
MAIL_PORT=587
MAIL_SECURE=false
```

### ❌ "Authentication failed"

**Check credentials:**
1. Make sure email password is correct
2. No spaces in password
3. Email account is active in Hostinger

**Reset email password:**
- Hostinger Panel → Emails → Click email → Change Password

### ❌ "Must issue a STARTTLS command first"

**Update settings:**
```env
MAIL_PORT=587
MAIL_SECURE=false
```

### ❌ Emails going to spam

**For production, configure DNS records in Hostinger:**
1. Go to **Domains** → **DNS/Name Servers**
2. Add SPF record:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.hostinger.com ~all
   ```
3. Add DKIM record (Hostinger provides this in Email section)

### ❌ Backend not restarting

**If you don't have SSH/PM2 access:**
1. Contact Hostinger support to restart your app
2. Or use the restart button in Hostinger Panel (if available)
3. Worst case: re-deploy the backend

---

## 📋 Production Checklist

Before going live:

- [ ] SMTP credentials added to production `.env`
- [ ] Correct email password (no typos)
- [ ] Backend restarted on production server
- [ ] Test email sent successfully
- [ ] Email received (check spam)
- [ ] Password reset link works
- [ ] Check notification_logs table (status = SENT)
- [ ] Email template looks professional
- [ ] SPF/DKIM records configured (for deliverability)

---

## 🎯 Common Hostinger SMTP Configurations

### **Configuration 1 (Most Common):**
```env
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=noreply@yourdomain.com
MAIL_PASSWORD=your_password
```

### **Configuration 2 (SSL):**
```env
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=noreply@yourdomain.com
MAIL_PASSWORD=your_password
```

### **Configuration 3 (Titan Email - some Hostinger plans):**
```env
MAIL_HOST=smtp.titan.email
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=noreply@yourdomain.com
MAIL_PASSWORD=your_password
```

**Try Configuration 1 first, then 2, then 3 if needed.**

---

## 🚨 Emergency Rollback

**If emails break the app:**

1. Comment out mail settings in `.env`:
```env
# MAIL_HOST=smtp.hostinger.com
# MAIL_PORT=587
# etc...
```

2. Restart backend

3. Emails won't send but app will still work

4. Fix the issue, uncomment, restart again

---

## 📞 Need Help?

**Hostinger Support:**
- Live Chat: Available in hPanel
- Email: support@hostinger.com
- Knowledge Base: https://support.hostinger.com

**What to ask:**
- "What are my SMTP settings for sending emails?"
- "How do I restart my Node.js application?"
- "Why are my emails going to spam?"

---

## ✅ Summary

**After deployment:**
1. ✅ Users can reset passwords via email
2. ✅ New users receive verification emails
3. ✅ All notification emails work
4. ✅ Professional emails from your domain

**The password change on first login is already implemented - no deployment needed for that feature!**
