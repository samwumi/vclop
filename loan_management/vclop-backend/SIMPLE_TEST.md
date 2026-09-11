# ⚡ Simple Test - Copy & Paste

## ✅ Your Email System is Already Working!

I just sent 2 test emails successfully. Here's how YOU can test it:

---

## 🎯 EASIEST TEST (30 seconds)

### Step 1: Copy this and paste in PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email": "admin@vclop.local"}'
```

### Step 2: Check Mailtrap

1. Open: **https://mailtrap.io**
2. Login
3. Go to: **Email Testing** → **Inboxes** → **My Inbox**
4. You'll see the password reset email! 📧

---

## 📧 What You'll See in Mailtrap

**Subject:** "Reset your VCLOP password"

**Email Design:**
- Beautiful purple/blue gradient header with "VCLOP" logo
- Professional layout
- Big "Reset Password" button
- Warning message about 60-minute expiry
- Security notice
- Fully responsive (looks great on mobile too)

---

## 🎨 Preview the Email Design (Without Sending)

Just open this file in your browser:

```
loan_management/vclop-backend/email-preview-password-reset.html
```

Or in PowerShell:
```powershell
Start-Process "email-preview-password-reset.html"
```

---

## 🧪 More Tests (Optional)

### Check Database Logs

See all sent emails:
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "USE vclop; SELECT recipientRef AS email, event, status, sentAt FROM notification_logs WHERE channel='EMAIL' ORDER BY createdAt DESC LIMIT 5;"
```

### Send to a Different Email

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email": "admin@vclop.local"}'
```

Every email you send will appear in your Mailtrap inbox!

---

## ✨ What's Working

✅ Backend server running on port 3000  
✅ Database connected and storing email logs  
✅ SMTP configured with Mailtrap  
✅ Email templates installed (2 templates)  
✅ Password reset emails sending successfully  
✅ Email verification ready (triggers when creating users)  
✅ Beautiful HTML email designs  
✅ Security features (token hashing, expiry, one-time use)  

---

## 🎯 Test Email Verification Too

To test the user registration email:

### Quick Version (Copy all 3 lines):

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"Admin@12345!"}'; $token = $login.data.accessToken; $branchId = (Invoke-RestMethod -Uri "http://localhost:3000/api/v1/branches" -Headers @{"Authorization"="Bearer $token"}).data.items[0].id; $deptId = (Invoke-RestMethod -Uri "http://localhost:3000/api/v1/departments" -Headers @{"Authorization"="Bearer $token"}).data.items[0].id; Invoke-RestMethod -Uri "http://localhost:3000/api/v1/users" -Method POST -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $token"} -Body "{`"employeeId`":`"TEST001`",`"email`":`"testuser@example.com`",`"username`":`"testuser`",`"firstName`":`"John`",`"lastName`":`"Doe`",`"password`":`"Test@12345`",`"branchId`":`"$branchId`",`"departmentId`":`"$deptId`",`"sendVerificationEmail`":true}"
```

Check Mailtrap for the verification email!

---

## 📱 Use Swagger UI (Visual Interface)

**Easiest way to test without command line:**

1. Open: **http://localhost:3000/api/docs**
2. Find **"auth"** section
3. Click **POST /api/v1/auth/forgot-password**
4. Click **"Try it out"**
5. Enter:
   ```json
   {
     "email": "admin@vclop.local"
   }
   ```
6. Click **Execute**
7. Check Mailtrap inbox!

---

## 🎉 Summary

Your email authentication is **FULLY WORKING**! 

The simplest way to see it:
1. Copy the command at the top
2. Paste in PowerShell
3. Open Mailtrap.io
4. See your beautiful email! 📧

**That's it!** 🚀
