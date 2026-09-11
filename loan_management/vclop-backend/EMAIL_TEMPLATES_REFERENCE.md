# Email Templates Reference

## Overview
This document describes the email notification templates implemented in the VCLOP system.

## Template Variables

### Email Verification Template
**Event:** `auth.email_verification`  
**Template Code:** `email-verification`

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `firstName` | string | User's first name | "John" |
| `verifyLink` | string | Full URL with verification token | "http://localhost:5173/auth/verify-email?token=abc123..." |
| `year` | number | Current year for copyright | 2026 |

**Subject:** "Verify your VCLOP account"

**Trigger:** Emitted when a new user is created with `sendVerificationEmail: true` (default behavior)

**Location in Code:** `src/modules/users/users.service.ts` → `create()` method

---

### Password Reset Template
**Event:** `auth.password_reset`  
**Template Code:** `password-reset`

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `firstName` | string | User's first name | "John" |
| `resetLink` | string | Full URL with reset token | "http://localhost:5173/auth/reset-password?token=xyz789..." |
| `expiresIn` | string | Human-readable expiry time | "60 minutes" |
| `year` | number | Current year for copyright | 2026 |

**Subject:** "Reset your VCLOP password"

**Trigger:** Emitted when user requests password reset via forgot-password endpoint

**Location in Code:** `src/modules/auth/auth.service.ts` → `forgotPassword()` method

---

## Template Design

Both templates share a consistent design system:

### Color Palette
- **Primary Gradient:** Linear gradient from `#667eea` to `#764ba2` (purple/blue)
- **Text Colors:**
  - Heading: `#1a1a1a`
  - Body: `#4a4a4a`
  - Muted: `#6b6b6b`
  - Footer: `#8a8a8a`
- **Background:**
  - Page: `#f5f5f5`
  - Card: `#ffffff`
  - Code block: `#f8f8f8`
  - Footer: `#f8f8f8`
  - Warning: `#fff3cd` with `#ffc107` border

### Typography
- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Heading (H1):** 28px, 600 weight, white on gradient
- **Heading (H2):** 24px, 600 weight
- **Body:** 16px, 1.6 line-height
- **Small:** 13-14px

### Layout
- **Container Width:** 600px
- **Border Radius:** 8px for card, 6px for button, 4px for code blocks
- **Spacing:** Consistent 40px padding on main sections
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.1)` on card, `0 4px 12px rgba(102, 126, 234, 0.4)` on button

### Components

#### Call-to-Action Button
```html
<a href="{{link}}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
  Button Text
</a>
```

#### Code Block / Link Display
```html
<p style="margin: 8px 0 0; padding: 12px; background-color: #f8f8f8; border-radius: 4px; word-break: break-all;">
  <a href="{{link}}" style="color: #667eea; text-decoration: none; font-size: 13px;">{{link}}</a>
</p>
```

#### Warning/Notice Box
```html
<div style="margin-top: 32px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
  <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
    <strong>⏱ Important:</strong> Warning message here
  </p>
</div>
```

---

## Customization Guide

### Changing Colors
To update the brand colors, replace these values across both templates:

1. **Primary Gradient:**
   - Find: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
   - Replace with your brand gradient

2. **Link Color:**
   - Find: `#667eea`
   - Replace with your brand primary color

3. **Button Shadow:**
   - Find: `rgba(102, 126, 234, 0.4)`
   - Update to match your primary color with 40% opacity

### Changing Company Branding
Update these sections in both templates:

1. **Company Name in Header:**
   ```html
   <h1 style="...">VCLOP</h1>
   <p style="...">Lending made simple</p>
   ```

2. **Footer Copyright:**
   ```html
   <p style="...">© {{year}} Vertical Capital. All rights reserved.</p>
   ```

### Adding Company Logo
Replace the text header with an image:

```html
<!-- Replace this: -->
<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">VCLOP</h1>

<!-- With this: -->
<img src="https://yourdomain.com/logo-white.png" alt="VCLOP" style="height: 40px; display: block; margin: 0 auto;" />
```

### Changing Link Expiry Times
Update in configuration files, not templates:

**Email Verification (default: 24 hours):**
- File: `src/config/auth.config.ts`
- Key: `emailVerificationExpiresIn`

**Password Reset (default: 60 minutes):**
- File: `src/config/auth.config.ts`
- Key: `passwordResetExpiresIn`

Or set via environment variables:
```env
EMAIL_VERIFICATION_EXPIRES_HOURS=24
PASSWORD_RESET_EXPIRES_MINUTES=60
```

---

## Testing Templates

### Preview in Browser
1. Copy the HTML from the template
2. Replace variables with sample data:
   - `{{firstName}}` → "John"
   - `{{verifyLink}}` → "http://localhost:5173/auth/verify-email?token=sample"
   - `{{year}}` → "2026"
3. Save as `.html` file and open in browser

### Test Email Sending
Use the notification service directly:

```typescript
// In your test file or playground
await this.events.emit('notification.send', {
  recipientEmail: 'test@example.com',
  event: 'auth.email_verification',
  variables: {
    firstName: 'John',
    verifyLink: 'http://localhost:5173/auth/verify-email?token=test123',
    year: new Date().getFullYear(),
  },
});
```

### Email Client Testing
Test templates across different email clients:
- Gmail (web, mobile app)
- Outlook (web, desktop)
- Apple Mail
- Yahoo Mail
- Mobile devices (iOS Mail, Android Gmail)

**Tools:**
- [Litmus](https://www.litmus.com/) - Email testing service
- [Email on Acid](https://www.emailonacid.com/) - Email preview tool
- [Mailtrap](https://mailtrap.io/) - Email sandbox with preview

---

## Database Schema

Templates are stored in the `notification_templates` table:

```sql
CREATE TABLE notification_templates (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  event VARCHAR(100) NOT NULL,
  channel ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL,
  subject VARCHAR(255),
  bodyHtml LONGTEXT,
  bodyText TEXT,
  variables JSON,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (event),
  INDEX (channel)
);
```

### Querying Templates

```sql
-- View all email templates
SELECT code, name, event, isActive 
FROM notification_templates 
WHERE channel = 'EMAIL';

-- Get specific template
SELECT * FROM notification_templates 
WHERE code = 'email-verification';

-- Update template
UPDATE notification_templates 
SET bodyHtml = '<new html here>', 
    updatedAt = NOW() 
WHERE code = 'email-verification';

-- Disable template
UPDATE notification_templates 
SET isActive = FALSE 
WHERE code = 'password-reset';
```

---

## Notification Logs

All sent emails are logged in `notification_logs` table for audit and debugging:

```sql
-- View recent sent emails
SELECT 
  recipientRef AS email,
  event,
  subject,
  status,
  sentAt,
  failureReason
FROM notification_logs
WHERE channel = 'EMAIL'
ORDER BY createdAt DESC
LIMIT 50;

-- Count emails by status
SELECT status, COUNT(*) as count
FROM notification_logs
WHERE channel = 'EMAIL'
GROUP BY status;

-- Find failed emails
SELECT *
FROM notification_logs
WHERE channel = 'EMAIL' 
  AND status = 'FAILED'
ORDER BY createdAt DESC;
```

---

## Best Practices

### 1. Always Include Plain Text Alternative
Both HTML and plain text versions should be provided for maximum compatibility.

### 2. Keep HTML Simple
- Avoid complex CSS (some email clients strip it)
- Use inline styles only
- Test across multiple email clients
- Use tables for layout (more reliable than divs)

### 3. Mobile Responsive
- Use `width="600"` but allow content to scale
- Font sizes should be readable on mobile (minimum 14px for body)
- Touch targets (buttons) should be at least 44x44px

### 4. Accessible Design
- Use sufficient color contrast (minimum 4.5:1 for body text)
- Include alt text for images
- Ensure content makes sense without images (some clients block them)

### 5. Security
- Never include sensitive data in email templates
- Always use HTTPS for links
- Include unsubscribe option for marketing emails (not needed for transactional)

### 6. Testing
- Always test with real SMTP before going to production
- Send test emails to multiple providers (Gmail, Outlook, Yahoo)
- Check spam score using tools like Mail Tester

---

## Additional Template Ideas

Future templates you might want to add:

### Account Security Alerts
- `auth.password_changed` - Notify user of password change
- `auth.2fa_enabled` - Confirm 2FA activation
- `auth.login_from_new_device` - Security alert

### Loan Application Notifications
- `loan.application_submitted` - Confirmation to customer
- `loan.application_approved` - Approval notification
- `loan.application_rejected` - Rejection with reason
- `loan.disbursement_complete` - Funds disbursed
- `loan.repayment_reminder` - Payment due reminder
- `loan.repayment_overdue` - Overdue payment notice

### System Notifications
- `user.account_created` - Welcome email
- `user.role_assigned` - Role/permission changes
- `document.verification_required` - Document upload needed
- `document.verification_complete` - Document approved/rejected

Each new template follows the same pattern:
1. Define template in seed file with HTML and plain text
2. Emit notification event with required variables
3. Add to this reference document
