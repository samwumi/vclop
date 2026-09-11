# 📧 Mailtrap Setup Guide - Step by Step

## Step 1: Sign Up (Free Account)

1. Go to: **https://mailtrap.io/register/signup**
2. Fill in:
   - Your email address
   - Create a password
   - Full name
3. Click **"Sign Up"**
4. Check your email and verify your account (click the verification link)

---

## Step 2: Access Your Inbox

After logging in:

1. You'll see the **Dashboard**
2. On the left sidebar, click **"Email Testing"**
3. Click **"Inboxes"**
4. You should see **"My Inbox"** (created by default)
5. Click on **"My Inbox"**

---

## Step 3: Get SMTP Credentials

Inside "My Inbox":

1. Look for the **"SMTP Settings"** section (usually in the middle of the page)
2. You'll see a dropdown that says **"Show Credentials"** or integration options
3. Click on **"Show Credentials"** or select **"Nodemailer"** from the integration dropdown

You'll see something like this:

```
Host: sandbox.smtp.mailtrap.io
Port: 2525
Username: 1a2b3c4d5e6f7g
Password: 9h8i7j6k5l4m3n
```

---

## Step 4: Copy to Your .env File

Open your `.env` file in: `loan_management/vclop-backend/.env`

Update these lines:

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=1a2b3c4d5e6f7g          ← Paste your Username here
MAIL_PASSWORD=9h8i7j6k5l4m3n      ← Paste your Password here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=noreply@vclop.local
```

**Important:** Replace the username and password with YOUR actual credentials from Mailtrap!

---

## Visual Guide to Finding Credentials

### If you see the Integration dropdown:

```
┌─────────────────────────────────────────────┐
│ Integration                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Nodemailer ▼                            │ │  ← Click here and select "Nodemailer"
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

You'll see code like this:

```javascript
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1a2b3c4d5e6f7g",        ← This is your USERNAME
    pass: "9h8i7j6k5l4m3n"         ← This is your PASSWORD
  }
});
```

### Alternative: SMTP Settings Tab

Some accounts show a tab called **"SMTP Settings"**:

```
┌──────────────────────────────────────────────┐
│  SMTP Settings    HTTP API    Actions        │  ← Click "SMTP Settings"
├──────────────────────────────────────────────┤
│  Host: sandbox.smtp.mailtrap.io             │
│  Port: 2525                                  │
│  Username: 1a2b3c4d5e6f7g                   │  ← Copy this
│  Password: 9h8i7j6k5l4m3n                   │  ← Copy this
│  Auth: PLAIN, LOGIN, CRAM-MD5               │
│  TLS: Optional (STARTTLS on all ports)      │
└──────────────────────────────────────────────┘
```

---

## Step 5: Save and Test

1. **Save** your `.env` file
2. **Start the backend:**
   ```bash
   cd loan_management/vclop-backend
   npm run start:dev
   ```

3. **Send a test email** (see testing section below)

---

## 🧪 Quick Test

Once your server is running, test password reset (easiest test):

```bash
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@vclop.local"
}
```

Then:
1. Go back to **Mailtrap.io**
2. Click **"My Inbox"**
3. You should see the password reset email! 🎉

---

## Troubleshooting

### "I don't see any SMTP Settings"

Try these:
1. Make sure you're inside an inbox (click "My Inbox")
2. Look for tabs at the top: SMTP Settings, HTTP API, etc.
3. Look for "Integration" dropdown and select "Nodemailer"
4. If still not visible, try creating a new inbox:
   - Go to Inboxes
   - Click "+ Create Inbox"
   - Name it "VCLOP Test"
   - Open it and look for SMTP Settings

### "My credentials don't work"

1. Double-check you copied them correctly (no extra spaces)
2. Make sure you're using:
   - Host: `sandbox.smtp.mailtrap.io`
   - Port: `2525` (not 25 or 587)
   - Secure: `false`
3. Try copying the credentials again (sometimes they get truncated)

### "I can't create an account"

- You need a valid email address
- Check spam folder for verification email
- Try a different browser if signup is stuck

---

## Alternative: Use Gmail Instead

If Mailtrap is giving you trouble, you can use Gmail:

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Click "Select app" → Choose "Mail"
4. Click "Select device" → Choose "Windows Computer"
5. Click "Generate"
6. Copy the 16-character password (no spaces)
7. Update `.env`:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-16-char-password-here
MAIL_FROM_NAME=VCLOP
MAIL_FROM_EMAIL=your-email@gmail.com
```

---

## Summary

**What you need from Mailtrap:**
- Username (looks like: `1a2b3c4d5e6f7g`)
- Password (looks like: `9h8i7j6k5l4m3n`)

**Where to find them:**
- Mailtrap.io → Email Testing → Inboxes → My Inbox → SMTP Settings

**What to do with them:**
- Paste into `.env` file as `MAIL_USER` and `MAIL_PASSWORD`

That's it! 🚀
