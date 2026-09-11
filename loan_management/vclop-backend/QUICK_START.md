# ⚡ Quick Start: Email Authentication in 3 Steps

## 🎯 Goal
Get email authentication working in under 5 minutes!

---

## ✅ Step 1: Setup Database & Email Templates

Open PowerShell in this directory and run:

```powershell
.\setup-database.ps1
```

**What this does:**
- ✓ Checks if database is running
- ✓ Creates the 'vclop' database
- ✓ Runs all migrations (creates tables)
- ✓ Seeds the database with:
  - Email verification template
  - Password reset template
  - Admin user
  - Permissions and roles
  - Sample data

**Expected output:**
```
✓ Database service is running
✓ MySQL client found
✓ Database 'vclop' is ready
✓ Prisma Client generated
✓ Migrations completed successfully
✓ Database seeded successfully!

EMAIL TEMPLATES INSTALLED! ✓
```

---

## 📧 Step 2: Configure Email Service

```powershell
.\configure-smtp.ps1
```

**Choose option 1 (Mailtrap)** - it's the easiest for testing:

1. Go to https://mailtrap.io and sign up (free)
2. Copy your SMTP credentials
3. Paste them when prompted

**What this does:**
- ✓ Updates your `.env` file with SMTP settings
- ✓ Configures nodemailer to send emails

**Alternative:** You can manually edit `.env` file:
```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@vclop.local
```

---

## 🚀 Step 3: Start the Backend

```bash
npm run start:dev
```

**Expected output:**
```
[Nest] INFO Application is running on: http://localhost:3000
```

---

## 🧪 Test It!

### Option A: Use the Test Script (Easiest)

```powershell
.\test-email-auth.ps1
```

This will automatically test the complete flow.

### Option B: Manual Testing

**1. Login as admin:**
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@vclop.local",
  "password": "Admin@12345!"
}
```

Copy the `accessToken` from response.

**2. Create a test user (triggers email):**
```bash
POST http://localhost:3000/api/v1/users
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "employeeId": "TEST001",
  "email": "test@example.com",
  "username": "testuser",
  "firstName": "Test",
  "lastName": "User",
  "password": "Test@12345",
  "sendVerificationEmail": true
}
```

**3. Check your Mailtrap inbox** - you should see the verification email!

**4. Test password reset:**
```bash
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

Check Mailtrap for the password reset email.

---

## 🎨 Preview Email Templates

Open these files in your browser to see how emails look:
- `email-preview-verification.html`
- `email-preview-password-reset.html`

---

## ❌ Troubleshooting

### "Database connection failed"
```powershell
# Start MariaDB service
Start-Service MariaDB

# Or start XAMPP Control Panel and click "Start" for MySQL
```

### "Seed failed"
```powershell
# Reset and try again
npx prisma migrate reset --force
npm run prisma:seed
```

### "Emails not sending"
1. Check your SMTP credentials in `.env`
2. Check backend console for errors
3. Verify Mailtrap inbox is correct

### Need the branch/department IDs for testing?
```sql
-- Connect to database
mysql -u root vclop

-- Get IDs
SELECT id, code, name FROM branches LIMIT 1;
SELECT id, code, name FROM departments LIMIT 1;
```

Or check the seed output - it shows the created IDs.

---

## 📚 More Documentation

- `EMAIL_AUTHENTICATION_SETUP.md` - Complete implementation details
- `EMAIL_TEMPLATES_REFERENCE.md` - Template customization guide
- `setup-email-auth.md` - Comprehensive setup and testing guide

---

## ✨ What You Get

✅ **Email Verification**
- Modern, responsive HTML emails
- 24-hour expiring tokens
- Secure one-time use
- Auto-activates user accounts

✅ **Password Reset**
- Security-focused design
- 60-minute expiring tokens
- Session revocation after reset
- Clear security warnings

✅ **Production Ready**
- SHA-256 token hashing
- Audit trail logging
- Rate limiting support
- Best practices followed

---

## 🎯 Summary

```powershell
# Run these 3 commands:
.\setup-database.ps1      # Setup database & templates
.\configure-smtp.ps1      # Configure email service
npm run start:dev         # Start backend

# Then test by creating a user - email will be sent automatically!
```

**That's it!** 🎉

Your email authentication is now fully functional.
