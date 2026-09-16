# How to Configure SMTP for Email Sending

## Quick Start - Choose Your Email Provider

### Option 1: Mailtrap (EASIEST - Recommended for Testing)
**Best for:** Testing emails safely without sending to real addresses

1. **Sign up for free:** https://mailtrap.io
2. **Get your credentials:**
   - Go to Email Testing → Inboxes
   - Click on your inbox
   - Copy the SMTP credentials shown

3. **Update your `.env` file:**
```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your_mailtrap_username_here
MAIL_PASSWORD=your_mailtrap_password_here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@vclop.local
```

4. **Restart your backend:**
```bash
npm run start:dev
```

✅ **Done!** All emails will appear in your Mailtrap inbox (not sent to real users)

---

### Option 2: Gmail (Good for Testing with Real Emails)
**Best for:** Testing with real email addresses

1. **Enable 2-Factor Authentication on your Gmail:**
   - Go to https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Create an App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Windows Computer"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update your `.env` file:**
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The app password from step 2
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=your-email@gmail.com
```

4. **Restart your backend:**
```bash
npm run start:dev
```

✅ **Done!** Emails will be sent to real email addresses

---

### Option 3: SendGrid (Best for Production)
**Best for:** Production deployment with high volume

1. **Sign up:** https://sendgrid.com (free tier: 100 emails/day)

2. **Create API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "VCLOP Production"
   - Permissions: "Mail Send" (Full Access)
   - Copy the API key (starts with `SG.`)

3. **Update your `.env` file:**
```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=apikey
MAIL_PASSWORD=SG.your_api_key_here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@yourdomain.com
```

4. **Verify sender email:**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter `noreply@yourdomain.com`
   - Check your email and click verification link

5. **Restart your backend:**
```bash
npm run start:dev
```

✅ **Done!** Production-ready email sending

---

### Option 4: Hostinger Email (If you have hosting)
**Best for:** Using your own domain email

1. **Find your SMTP settings in Hostinger:**
   - Log in to Hostinger control panel
   - Go to Emails → Email Accounts
   - Click on your email account
   - Look for "Mail Client Configuration" or "SMTP Settings"

2. **Common Hostinger SMTP settings:**
```env
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=noreply@yourdomain.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@yourdomain.com
```

3. **Restart your backend:**
```bash
npm run start:dev
```

---

## Where is the .env File?

The `.env` file is located at:
```
vclop/loan_management/vclop-backend/.env
```

**If the file doesn't exist:**
1. Copy `.env.example` to `.env`
2. Add the SMTP settings above

---

## How to Test After Configuration

### Test 1: Forgot Password Email

**Using Postman or cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected:**
- If using Mailtrap: Check your Mailtrap inbox
- If using Gmail/SendGrid: Check the actual email inbox
- You should see a password reset email with a link

### Test 2: Check Notification Logs

Check if emails are being sent:
```sql
SELECT * FROM notification_logs 
WHERE event = 'auth.password_reset' 
ORDER BY createdAt DESC 
LIMIT 5;
```

**Status meanings:**
- `PENDING` - About to be sent
- `SENT` - Successfully sent
- `FAILED` - Something went wrong (check error message)

---

## Troubleshooting

### ❌ Error: "Invalid login: 535 Authentication failed"
**Solution:** Check your username and password are correct

### ❌ Error: "ECONNREFUSED"
**Solution:** 
- Check `MAIL_HOST` is correct
- Check your firewall isn't blocking port 587/2525
- Try changing port (587 → 465 or 2525)

### ❌ Gmail: "Less secure app access"
**Solution:** Don't use your Gmail password directly. Use an App Password (see Option 2 above)

### ❌ Emails going to spam
**Solution:** 
- For testing: Check spam folder
- For production: Configure SPF, DKIM records (SendGrid helps with this)

### ❌ No `.env` file exists
**Solution:**
```bash
cd vclop/loan_management/vclop-backend
copy .env.example .env
# Then edit .env with your SMTP settings
```

---

## Quick Comparison

| Provider | Difficulty | Cost | Use For | Limit |
|----------|-----------|------|---------|-------|
| **Mailtrap** | ⭐ Very Easy | Free | Testing only | Unlimited (fake) |
| **Gmail** | ⭐⭐ Easy | Free | Testing with real emails | 500/day |
| **SendGrid** | ⭐⭐⭐ Medium | Free tier | Production | 100/day free |
| **Hostinger** | ⭐⭐ Easy | Included | Production (own domain) | Varies |

---

## My Recommendation

**Start with Mailtrap:**
1. Takes 5 minutes to set up
2. Free forever
3. Safe (won't accidentally email users)
4. See all emails in web interface
5. Perfect for development

**Then switch to SendGrid for production:**
1. Professional email delivery
2. Better deliverability (won't go to spam)
3. Email analytics
4. Scalable

---

## Need Help?

1. **Mailtrap setup:** https://help.mailtrap.io/article/12-getting-started-guide
2. **Gmail App Password:** https://support.google.com/accounts/answer/185833
3. **SendGrid setup:** https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api

---

## After SMTP is Working

Once emails are sending, you can test:

✅ Forgot password → Reset password flow
✅ New user email verification
✅ OTP for password change
✅ Admin notifications
✅ Loan application notifications

**All email features will work automatically!**
