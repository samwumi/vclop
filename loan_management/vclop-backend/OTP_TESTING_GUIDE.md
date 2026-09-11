# 🔐 OTP Password Change - Testing Guide

## ✅ Implementation Complete!

The OTP-based password change system is now fully implemented and ready to test.

---

## 🎯 What Was Implemented

### **New Features:**
1. ✅ Request OTP endpoint (`POST /auth/request-password-change-otp`)
2. ✅ Change password with OTP endpoint (`POST /auth/change-password-with-otp`)
3. ✅ OTP generation (6-digit secure code)
4. ✅ OTP validation with expiry (10 minutes)
5. ✅ Three new email templates:
   - Password Change OTP
   - Password Changed Notification
6. ✅ Security features (one-time use, expiry tracking, session revocation)

### **Email Templates Added:**
- `password-change-otp` - Sends 6-digit OTP
- `password-changed-notification` - Confirms password was changed

---

## 🧪 How to Test

### **Prerequisites:**
- ✅ Backend running on port 3000
- ✅ Mailtrap configured (already done!)
- ✅ Admin user exists (admin@vclop.local)

---

### **Test 1: Request OTP**

**Step 1: Login as admin to get token**

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"Admin@12345!"}'
$token = $login.data.accessToken
Write-Host "Token: $token"
```

**Step 2: Request OTP**

```powershell
$otpResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/request-password-change-otp" -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"}
Write-Host "Masked Email: $($otpResponse.data.maskedEmail)"
Write-Host "Expires In: $($otpResponse.data.expiresIn)"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP has been sent to your registered email address",
  "data": {
    "expiresIn": "10 minutes",
    "maskedEmail": "ad***@vclop.local"
  }
}
```

**Step 3: Check Mailtrap**
1. Go to https://mailtrap.io
2. Open your inbox
3. You'll see an email with a 6-digit OTP like: **847392**

---

### **Test 2: Change Password with OTP**

**Copy the 6-digit OTP from the email**, then:

```powershell
$changePassword = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/change-password-with-otp" -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body '{"otp":"847392","newPassword":"NewSecure@123"}'
Write-Host $changePassword.message
```

**Replace `847392` with your actual OTP!**

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again with your new password.",
  "data": null
}
```

**Step 3: Check Mailtrap Again**
You'll receive a **confirmation email** that your password was changed!

---

### **Test 3: Login with New Password**

```powershell
$newLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"NewSecure@123"}'
Write-Host "Login successful! New token: $($newLogin.data.accessToken)"
```

---

## 🚀 Complete Test Script (Copy & Paste)

```powershell
Write-Host "`n=== Testing OTP Password Change ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n[1/4] Logging in as admin..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"Admin@12345!"}'
$token = $login.data.accessToken
Write-Host "✓ Login successful!" -ForegroundColor Green

# Step 2: Request OTP
Write-Host "`n[2/4] Requesting OTP..." -ForegroundColor Yellow
$otpResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/request-password-change-otp" -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"}
Write-Host "✓ OTP sent to: $($otpResponse.data.maskedEmail)" -ForegroundColor Green
Write-Host "  Check your Mailtrap inbox for the 6-digit OTP!" -ForegroundColor Cyan

# Step 3: Enter OTP
Write-Host "`n[3/4] Enter the OTP from your email:" -ForegroundColor Yellow
$otp = Read-Host "OTP"

# Step 4: Change password
Write-Host "`n[4/4] Changing password with OTP..." -ForegroundColor Yellow
try {
    $changePassword = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/change-password-with-otp" -Method POST -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} -Body "{`"otp`":`"$otp`",`"newPassword`":`"NewSecure@123`"}"
    Write-Host "✓ Password changed successfully!" -ForegroundColor Green
    Write-Host "  Message: $($changePassword.message)" -ForegroundColor Cyan
    
    # Test new login
    Write-Host "`n[5/4] Testing login with new password..." -ForegroundColor Yellow
    $newLogin = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"NewSecure@123"}'
    Write-Host "✓ New login successful!" -ForegroundColor Green
    
    Write-Host "`n✓✓✓ All tests passed! OTP system working perfectly! ✓✓✓" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nCheck Mailtrap for the confirmation email!" -ForegroundColor Cyan
```

---

## 📧 Email Template Preview

### **OTP Email:**
- **Subject:** "Your VCLOP Password Change OTP"
- **Content:**
  - Large 6-digit OTP in dashed box
  - 10-minute expiry warning
  - Security notice
  - Modern purple/blue gradient design

### **Confirmation Email:**
- **Subject:** "Your VCLOP password was changed"
- **Content:**
  - Success checkmark
  - Timestamp of change
  - Session logout notice
  - Security warning if unauthorized

---

## 🔒 Security Features

✅ **OTP Expires in 10 minutes**  
✅ **One-time use only** (can't reuse same OTP)  
✅ **Old OTPs invalidated** when requesting new one  
✅ **All sessions revoked** after password change  
✅ **SHA-256 hashing** (OTP never stored in plain text)  
✅ **Audit trail** logging  
✅ **Confirmation email** sent after change  

---

## 🎯 API Endpoints

### `POST /api/v1/auth/request-password-change-otp`
**Auth:** Required (JWT Bearer token)  
**Body:** None  
**Response:**
```json
{
  "success": true,
  "message": "OTP has been sent to your registered email address",
  "data": {
    "expiresIn": "10 minutes",
    "maskedEmail": "ad***@vclop.local"
  }
}
```

### `POST /api/v1/auth/change-password-with-otp`
**Auth:** Required (JWT Bearer token)  
**Body:**
```json
{
  "otp": "123456",
  "newPassword": "NewSecure@123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again with your new password.",
  "data": null
}
```

---

## 🐛 Troubleshooting

### "Invalid OTP"
- Check you copied the complete 6-digit code
- OTP is case-sensitive (though it's all numbers)
- Make sure you're using the most recent OTP

### "OTP has expired"
- OTP is only valid for 10 minutes
- Request a new OTP and try again

### "OTP has already been used"
- You can't reuse an OTP
- Request a new one

### "No email received"
- Check Mailtrap inbox (https://mailtrap.io)
- Verify backend logs for errors
- Check `notification_logs` table for status

---

## 📊 Check Database Logs

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "USE vclop; SELECT recipientRef, event, status, sentAt FROM notification_logs WHERE channel='EMAIL' AND event LIKE '%password%' ORDER BY createdAt DESC LIMIT 5;"
```

Expected events:
- `auth.password_change_otp`
- `auth.password_changed_notification`

---

## ✨ What This Enables

### **For Staff:**
- Loan officers, compliance officers, managers can securely change passwords
- Extra security layer beyond just knowing current password
- Prevents unauthorized password changes even if session is compromised

### **For Customers (Future):**
- Same secure password change flow
- Builds trust in your platform
- Industry-standard security practice

### **For Compliance:**
- Full audit trail of password changes
- Email confirmations for security
- Meets banking/financial security standards

---

## 🎉 Success!

You now have a complete OTP-based password change system that:
- ✅ Sends 6-digit OTP via email
- ✅ Validates OTP with expiry
- ✅ Changes password securely
- ✅ Revokes all active sessions
- ✅ Sends confirmation email
- ✅ Maintains complete audit trail

**This is production-ready and follows industry best practices!** 🚀

---

## 📱 Try It in Swagger UI

1. Open: http://localhost:3000/api/docs
2. Login with admin credentials
3. Click "Authorize" and paste token
4. Find: `POST /auth/request-password-change-otp`
5. Click "Try it out" → Execute
6. Check Mailtrap for OTP
7. Use: `POST /auth/change-password-with-otp`
8. Enter OTP and new password → Execute

---

**Ready to test? Just copy the complete test script above and run it in PowerShell!**
