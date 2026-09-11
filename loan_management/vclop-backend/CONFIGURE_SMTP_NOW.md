# ✅ Email Templates Installed Successfully!

Your database now has the email templates. Next step: Configure SMTP.

---

## 📧 Option 1: Mailtrap (Recommended - Takes 2 minutes)

**Best for testing - all emails are caught safely**

### Steps:

1. **Sign up for free:** https://mailtrap.io/register/signup
2. **Login and go to:** Email Testing → Inboxes → My Inbox
3. **Click "SMTP Settings"** and copy your credentials
4. **Update your `.env` file** with these values:

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your_username_here
MAIL_PASSWORD=your_password_here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@vclop.local
```

---

## 📧 Option 2: Gmail (Quick but has limits)

**Only for testing - 500 emails/day limit**

### Steps:

1. **Enable 2FA** on your Gmail account: https://myaccount.google.com/security
2. **Generate App Password:** https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (remove spaces)
3. **Update your `.env` file:**

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=your-email@gmail.com
```

---

## 🚀 After Configuring SMTP

Start the backend server:

```bash
npm run start:dev
```

---

## 🧪 Test Email Sending

### 1. Login as admin
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@vclop.local",
  "password": "Admin@12345!"
}
```

Copy the `accessToken` from the response.

### 2. Get Branch and Department IDs

Run this command:
```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "USE vclop; SELECT id, code, name FROM branches LIMIT 1; SELECT id, code, name FROM departments LIMIT 1;"
```

### 3. Create a test user (triggers verification email)

```bash
POST http://localhost:3000/api/v1/users
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "employeeId": "TEST001",
  "email": "test@example.com",
  "username": "testuser",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Test@12345",
  "branchId": "paste_branch_id_here",
  "departmentId": "paste_department_id_here",
  "sendVerificationEmail": true
}
```

### 4. Check your email!

- **Mailtrap:** Login to Mailtrap → Check your inbox
- **Gmail:** Check your Gmail inbox

You should see a beautiful verification email! 🎨

### 5. Test password reset

```bash
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

Check your inbox for the password reset email!

---

## 📊 Check Email Logs

To see if emails were sent successfully:

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "USE vclop; SELECT recipientRef AS email, event, status, sentAt, failureReason FROM notification_logs WHERE channel = 'EMAIL' ORDER BY createdAt DESC LIMIT 5;"
```

---

## ✨ What You Have Now

✅ **Database with email templates installed**
- Email verification template (modern HTML design)
- Password reset template (modern HTML design)

✅ **Admin user created**
- Email: admin@vclop.local
- Password: Admin@12345!

✅ **Complete authentication system**
- User registration with email verification
- Password reset flow
- Secure token handling
- Audit logging

---

## 🎯 Next Step

**Just configure SMTP in `.env` file and start the server!**

Choose Mailtrap (Option 1) if you want the easiest setup for testing.
