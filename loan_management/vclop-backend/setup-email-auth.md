# Quick Setup Guide: Email Authentication

## Prerequisites Checklist
- [ ] Node.js and npm installed
- [ ] MySQL/MariaDB database server
- [ ] Database created (name: `vclop`)
- [ ] `.env` file configured

## Step-by-Step Setup

### 1. Verify Database Connection

**Check if MySQL is running:**
```bash
# Windows (XAMPP):
# Open XAMPP Control Panel → Start MySQL

# Windows (Standalone MySQL):
net start MySQL80

# Or check status:
sc query MySQL80
```

**Test database connection:**
```bash
mysql -u root -p
# Enter your MySQL password when prompted

# Once connected:
SHOW DATABASES;
# Should list 'vclop' database

# If 'vclop' doesn't exist, create it:
CREATE DATABASE vclop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

EXIT;
```

### 2. Run Prisma Migrations

```bash
cd loan_management/vclop-backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Or if that doesn't work:
npx prisma migrate deploy
```

### 3. Seed the Database

```bash
# This will add email templates and other seed data
npm run prisma:seed
```

**Expected output:**
```
🌱 Starting VCLOP seed...
✔  Branch: Head Office
✔  Department: Information Technology
   Seeding 92 permissions...
✔  Permissions seeded
✔  Role: System Administrator (92 permissions)
✔  Role: Manager
✔  Role: Staff
✔  Admin user: admin@vclop.local  (must change password on first login)
   Seeding 10 settings...
✔  Settings seeded
✔  Widgets seeded
✔  Default Customer form template seeded
✔  Document checklist seeded
✔  Loan products seeded
   Seeding 2 email templates...
✔  Email templates seeded

✅ VCLOP seed complete.

   Admin login:
   Email    : admin@vclop.local
   Password : Admin@12345!
   ⚠  Change this password immediately after first login.
```

### 4. Verify Email Templates in Database

```bash
# Connect to database
mysql -u root -p vclop

# Check if templates were created
SELECT code, name, event, channel, isActive 
FROM notification_templates 
WHERE channel = 'EMAIL';
```

**Expected result:**
```
+---------------------+--------------------+--------------------------+---------+----------+
| code                | name               | event                    | channel | isActive |
+---------------------+--------------------+--------------------------+---------+----------+
| email-verification  | Email Verification | auth.email_verification  | EMAIL   |        1 |
| password-reset      | Password Reset     | auth.password_reset      | EMAIL   |        1 |
+---------------------+--------------------+--------------------------+---------+----------+
2 rows in set
```

### 5. Configure SMTP (Choose One Option)

#### Option A: Mailtrap (Recommended for Testing)

1. Sign up at https://mailtrap.io (free tier available)
2. Create a new inbox
3. Get SMTP credentials from "SMTP Settings"
4. Update `.env`:

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your_mailtrap_username_here
MAIL_PASSWORD=your_mailtrap_password_here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@vclop.local
```

#### Option B: Gmail (For Testing Only)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=your-email@gmail.com
```

**⚠️ Note:** Gmail has daily sending limits (500 emails/day for free accounts)

#### Option C: Production SMTP Services

**SendGrid:**
```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@yourdomain.com
```

**AWS SES:**
```env
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_aws_smtp_username
MAIL_PASSWORD=your_aws_smtp_password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@yourdomain.com
```

### 6. Start the Backend Server

```bash
# Development mode with hot reload
npm run start:dev

# Or production mode
npm run build
npm run start:prod
```

**Expected output:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] AuthController {/api/v1/auth}
[Nest] INFO [RouterExplorer] Mapped {/api/v1/auth/login, POST} route
[Nest] INFO [RouterExplorer] Mapped {/api/v1/auth/forgot-password, POST} route
[Nest] INFO [RouterExplorer] Mapped {/api/v1/auth/reset-password, POST} route
[Nest] INFO [RouterExplorer] Mapped {/api/v1/auth/verify-email, POST} route
[Nest] INFO Application is running on: http://localhost:3000
```

### 7. Test Email Authentication

#### Test 1: Login as Admin
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@vclop.local",
  "password": "Admin@12345!"
}
```

**Save the `accessToken` from response for next steps**

#### Test 2: Create Test User (Triggers Verification Email)
```bash
POST http://localhost:3000/api/v1/users
Content-Type: application/json
Authorization: Bearer <your_access_token>

{
  "employeeId": "EMP-TEST-001",
  "email": "testuser@example.com",
  "username": "testuser",
  "firstName": "Test",
  "lastName": "User",
  "password": "Test@12345",
  "branchId": "<get_from_database>",
  "departmentId": "<get_from_database>",
  "sendVerificationEmail": true
}
```

**To get branchId and departmentId:**
```sql
SELECT id, name FROM branches WHERE isActive = 1 LIMIT 1;
SELECT id, name FROM departments WHERE isActive = 1 LIMIT 1;
```

#### Test 3: Check Email Received
- **Mailtrap:** Login to Mailtrap → Open your inbox → View email
- **Gmail:** Check your Gmail inbox
- **Check database logs:**
```sql
SELECT * FROM notification_logs 
WHERE channel = 'EMAIL' 
ORDER BY createdAt DESC 
LIMIT 5;
```

#### Test 4: Verify Email
Copy the token from the email link and:
```bash
POST http://localhost:3000/api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "paste_token_here"
}
```

**Expected response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

#### Test 5: Request Password Reset
```bash
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "testuser@example.com"
}
```

Check for password reset email in your inbox.

#### Test 6: Reset Password
```bash
POST http://localhost:3000/api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "paste_reset_token_here",
  "newPassword": "NewSecure@123"
}
```

#### Test 7: Login with New Password
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "NewSecure@123"
}
```

## Troubleshooting

### Problem: Database connection failed

**Solution:**
```bash
# Check if MySQL is running
sc query MySQL80

# Start MySQL if stopped
net start MySQL80

# Verify .env DATABASE_URL
# Should be: mysql://root:your_password@localhost:3306/vclop
```

### Problem: Seed failed with "PrismaClientKnownRequestError"

**Solution:**
```bash
# Reset database and try again
npx prisma migrate reset --force
npm run prisma:seed
```

### Problem: Email not sending

**Check 1: Verify SMTP credentials**
```bash
# Test SMTP connection manually (requires nodemailer installed globally)
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: { user: 'your_user', pass: 'your_pass' }
});
transporter.verify().then(console.log).catch(console.error);
"
```

**Check 2: Review notification logs**
```sql
SELECT 
  recipientRef AS email,
  status,
  failureReason,
  attempts,
  createdAt
FROM notification_logs
WHERE channel = 'EMAIL'
  AND status = 'FAILED'
ORDER BY createdAt DESC
LIMIT 10;
```

**Check 3: Backend logs**
Look for errors in the console output like:
- `EAUTH` - Wrong SMTP username/password
- `ECONNECTION` - Can't reach SMTP server
- `ESOCKET` - Network/firewall issue

### Problem: Email goes to spam

**Short-term fix:**
- Mark as "Not Spam" in your email client
- Add sender to contacts

**Long-term fix (Production):**
- Use a verified domain
- Configure SPF, DKIM, DMARC records
- Use reputable SMTP service (SendGrid, AWS SES)

### Problem: Token expired

**For verification tokens (24 hours):**
- User needs to request a new verification email
- Admins can resend via user management interface

**For reset tokens (60 minutes):**
- User needs to request a new password reset
- Click "Forgot Password" again

### Problem: Template not rendering correctly

**Check template exists:**
```sql
SELECT code, event, isActive 
FROM notification_templates 
WHERE event = 'auth.email_verification';
```

**Check variables match:**
```sql
SELECT variables 
FROM notification_templates 
WHERE code = 'email-verification';
```

**Verify event name in code matches database:**
- Code: `auth.email_verification`
- Database: Same exact string (case-sensitive)

## Preview Email Templates

Open these files in your browser to see how emails will look:
- `email-preview-verification.html` - Email verification template
- `email-preview-password-reset.html` - Password reset template

## API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/login` | POST | Public | User login |
| `/api/v1/auth/forgot-password` | POST | Public | Request password reset |
| `/api/v1/auth/reset-password` | POST | Public | Reset password with token |
| `/api/v1/auth/verify-email` | POST | Public | Verify email with token |
| `/api/v1/auth/change-password` | PATCH | JWT | Change password (authenticated) |
| `/api/v1/users` | POST | JWT | Create user (triggers verification email) |

## Environment Variables Reference

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/vclop"

# Authentication
JWT_SECRET=your-secret-key-change-in-production
SEED_ADMIN_PASSWORD=Admin@12345!

# Frontend
FRONTEND_URL=http://localhost:5173

# Email Service
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@vclop.local

# Optional: Email token expiry
EMAIL_VERIFICATION_EXPIRES_HOURS=24
PASSWORD_RESET_EXPIRES_MINUTES=60
```

## Success Indicators

✅ Database is running and accessible  
✅ All migrations applied successfully  
✅ Seed completed with email templates  
✅ Backend server starts without errors  
✅ SMTP credentials configured  
✅ Test user creation triggers email  
✅ Email received in inbox/Mailtrap  
✅ Email verification works  
✅ Password reset flow completes  
✅ Notification logs show "SENT" status  

## Next Steps

Once email authentication is working:
1. Customize email templates with your branding
2. Configure production SMTP service
3. Add SPF/DKIM/DMARC records for your domain
4. Set up email rate limiting
5. Create additional notification templates for loan workflows
6. Configure email preferences per user
7. Add email queue for reliability (optional: Bull/BullMQ)

## Support

For issues:
1. Check backend console logs
2. Review `notification_logs` table
3. Test SMTP connection separately
4. Verify environment variables
5. Check firewall/antivirus settings

Refer to:
- `EMAIL_AUTHENTICATION_SETUP.md` - Detailed implementation guide
- `EMAIL_TEMPLATES_REFERENCE.md` - Template customization guide
