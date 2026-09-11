# 🧪 How to Test Email Authentication

## Method 1: PowerShell (Easiest - Copy & Paste)

### Test 1: Password Reset Email ✉️

**Copy and paste this into PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email": "admin@vclop.local"}'
```

**Expected response:**
```
success    : True
message    : If an account with that email exists, a reset link has been sent
```

**Then check Mailtrap:**
1. Go to https://mailtrap.io
2. Login → Email Testing → Inboxes → My Inbox
3. You'll see the password reset email! 📧

---

### Test 2: Create User & Get Verification Email 👤

**Step 1: Login as admin**

```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin@vclop.local","password":"Admin@12345!"}'
$token = $loginResponse.data.accessToken
Write-Host "Token: $token"
```

**Step 2: Get branch and department IDs**

```powershell
$branchId = (Invoke-RestMethod -Uri "http://localhost:3000/api/v1/branches" -Headers @{"Authorization"="Bearer $token"}).data.items[0].id
$deptId = (Invoke-RestMethod -Uri "http://localhost:3000/api/v1/departments" -Headers @{"Authorization"="Bearer $token"}).data.items[0].id
Write-Host "Branch ID: $branchId"
Write-Host "Department ID: $deptId"
```

**Step 3: Create a test user (triggers verification email)**

```powershell
$userBody = @{
    employeeId = "TEST-$(Get-Random -Maximum 9999)"
    email = "testuser$(Get-Random -Maximum 9999)@example.com"
    username = "testuser$(Get-Random -Maximum 9999)"
    firstName = "Test"
    lastName = "User"
    password = "Test@12345"
    branchId = $branchId
    departmentId = $deptId
    sendVerificationEmail = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/users" -Method POST -Headers @{"Content-Type"="application/json";"Authorization"="Bearer $token"} -Body $userBody
```

**Check Mailtrap for the verification email!** 📧

---

## Method 2: REST Client (VS Code Extension)

If you have the **REST Client** extension installed in VS Code:

**Create a file: `test-email.http`**

```http
### Test 1: Password Reset
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@vclop.local"
}

### Test 2: Login as Admin
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@vclop.local",
  "password": "Admin@12345!"
}

### Test 3: Get Branches (replace YOUR_TOKEN)
GET http://localhost:3000/api/v1/branches
Authorization: Bearer YOUR_TOKEN

### Test 4: Get Departments (replace YOUR_TOKEN)
GET http://localhost:3000/api/v1/departments
Authorization: Bearer YOUR_TOKEN

### Test 5: Create User with Email Verification (replace YOUR_TOKEN, branchId, departmentId)
POST http://localhost:3000/api/v1/users
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "employeeId": "TEST-001",
  "email": "testuser@example.com",
  "username": "testuser001",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Test@12345",
  "branchId": "PASTE_BRANCH_ID_HERE",
  "departmentId": "PASTE_DEPT_ID_HERE",
  "sendVerificationEmail": true
}
```

Click the **"Send Request"** link above each request.

---

## Method 3: Postman (If you have it installed)

### Test 1: Password Reset

1. Open Postman
2. Create new request:
   - Method: **POST**
   - URL: `http://localhost:3000/api/v1/auth/forgot-password`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "email": "admin@vclop.local"
   }
   ```
3. Click **Send**
4. Check Mailtrap inbox

### Test 2: Create User with Email Verification

1. **First, login to get token:**
   - Method: **POST**
   - URL: `http://localhost:3000/api/v1/auth/login`
   - Body:
   ```json
   {
     "username": "admin@vclop.local",
     "password": "Admin@12345!"
   }
   ```
   - Copy the `accessToken` from response

2. **Get branch ID:**
   - Method: **GET**
   - URL: `http://localhost:3000/api/v1/branches`
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Copy an `id` from response

3. **Get department ID:**
   - Method: **GET**
   - URL: `http://localhost:3000/api/v1/departments`
   - Headers: `Authorization: Bearer YOUR_TOKEN`
   - Copy an `id` from response

4. **Create user:**
   - Method: **POST**
   - URL: `http://localhost:3000/api/v1/users`
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer YOUR_TOKEN`
   - Body:
   ```json
   {
     "employeeId": "TEST-001",
     "email": "newuser@example.com",
     "username": "newuser",
     "firstName": "New",
     "lastName": "User",
     "password": "Test@12345",
     "branchId": "PASTE_BRANCH_ID",
     "departmentId": "PASTE_DEPT_ID",
     "sendVerificationEmail": true
   }
   ```
   - Click **Send**
   - Check Mailtrap inbox for verification email

---

## Method 4: Browser (Swagger UI)

The easiest visual way!

1. **Open Swagger UI:** http://localhost:3000/api/docs
2. **Test Password Reset:**
   - Find **"auth"** section
   - Click **POST /api/v1/auth/forgot-password**
   - Click **"Try it out"**
   - Enter JSON:
   ```json
   {
     "email": "admin@vclop.local"
   }
   ```
   - Click **Execute**
   - Check Mailtrap inbox

3. **Test Email Verification (Create User):**
   - First, login to get token:
     - Find **POST /api/v1/auth/login**
     - Click **"Try it out"**
     - Enter credentials
     - Click **Execute**
     - Copy the `accessToken`
   
   - Click the **"Authorize"** button at the top of Swagger
   - Paste token and click **Authorize**
   
   - Find **POST /api/v1/users**
   - Click **"Try it out"**
   - Fill in the form or paste JSON (get IDs from GET /api/v1/branches and GET /api/v1/departments first)
   - Make sure `sendVerificationEmail` is `true`
   - Click **Execute**
   - Check Mailtrap inbox

---

## 📧 Where to Check Emails

After running any test:

1. Go to: **https://mailtrap.io**
2. Login with your account
3. Click **Email Testing** (left sidebar)
4. Click **Inboxes**
5. Click **My Inbox**
6. You'll see your emails! 📬

---

## 🔍 Check Email Logs in Database

See if emails were sent successfully:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "USE vclop; SELECT recipientRef AS email, event, status, sentAt FROM notification_logs WHERE channel='EMAIL' ORDER BY createdAt DESC LIMIT 5;"
```

Expected output:
```
+-------------------+---------------------------+--------+---------------------+
| email             | event                     | status | sentAt              |
+-------------------+---------------------------+--------+---------------------+
| test@example.com  | auth.email_verification   | SENT   | 2026-09-09 12:30:00 |
| admin@vclop.local | auth.password_reset       | SENT   | 2026-09-09 12:29:00 |
+-------------------+---------------------------+--------+---------------------+
```

---

## 🎯 Quick Copy-Paste Test (Recommended!)

Just copy and paste this entire block into PowerShell:

```powershell
Write-Host "`n=== Testing Email Authentication ===" -ForegroundColor Cyan

# Test 1: Password Reset
Write-Host "`n[Test 1] Sending password reset email..." -ForegroundColor Yellow
$resetResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email": "admin@vclop.local"}'
if ($resetResponse.success) {
    Write-Host "✓ Password reset email sent!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to send email" -ForegroundColor Red
}

# Wait a moment
Start-Sleep -Seconds 2

# Check database
Write-Host "`n[Database Check] Recent emails:" -ForegroundColor Yellow
C:\xampp\mysql\bin\mysql.exe -u root -e "USE vclop; SELECT recipientRef AS email, event, status FROM notification_logs WHERE channel='EMAIL' ORDER BY createdAt DESC LIMIT 3;"

Write-Host "`n✓ Test complete!" -ForegroundColor Green
Write-Host "Check your Mailtrap inbox: https://mailtrap.io" -ForegroundColor Cyan
```

---

## ✅ Success Indicators

You'll know it's working when:

✅ API responds with `success: true`  
✅ Database shows `status: SENT`  
✅ Email appears in Mailtrap inbox  
✅ Email has beautiful purple/blue gradient design  
✅ No errors in backend console  

---

## 🐛 Troubleshooting

### "Connection refused" error
- Make sure backend is running: `npm run start:dev`
- Check http://localhost:3000/api/docs opens

### Email status is "FAILED"
- Check SMTP credentials in `.env`
- Restart backend after changing `.env`
- Check backend console for error messages

### No email in Mailtrap
- Make sure you're logged into the correct Mailtrap account
- Check "My Inbox" specifically
- Refresh the page
- Check spam/trash in Mailtrap

---

## 🎨 Preview Templates

Open these in your browser to see the designs:
- `email-preview-verification.html`
- `email-preview-password-reset.html`

---

**Recommendation:** Start with the **Quick Copy-Paste Test** above - it's the easiest way to verify everything works!
