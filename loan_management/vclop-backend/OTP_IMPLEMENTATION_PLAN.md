# 🔐 OTP for Password Change - Implementation Plan

## Current Flow vs. OTP Flow

### **Current Implementation:**
```
User logged in → Provides current password → Changes password directly
```

### **New OTP Flow (More Secure):**
```
User requests password change → System sends OTP via email → User enters OTP → Password changed
```

---

## Use Cases

### **1. Staff Password Change (Authenticated Users)**
- Loan officers, managers, admins changing their password
- **Flow:**
  1. User clicks "Change Password" in their profile
  2. System sends 6-digit OTP to their registered email
  3. User enters OTP + new password
  4. System verifies OTP and updates password

### **2. Customer Password Change (If customers have accounts)**
- Customers who have self-service portal access
- Same flow as staff

### **3. Forgot Password (Already Implemented)**
- Uses token-based reset (already working!)
- This is separate from OTP change

---

## Implementation Steps

### **Step 1: Database Schema (Token Type)**
Already have `Token` table with types. Add new type:
- `PASSWORD_CHANGE_OTP` (or reuse `PASSWORD_RESET`)

### **Step 2: OTP Generation Service**
Create utility to generate 6-digit OTP:
```typescript
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

### **Step 3: New API Endpoints**

#### `POST /api/v1/auth/request-password-change-otp`
- **Input:** None (uses JWT token)
- **Action:** Generates OTP, sends email
- **Response:** Success message

#### `POST /api/v1/auth/change-password-with-otp`
- **Input:** 
  ```json
  {
    "otp": "123456",
    "newPassword": "NewSecure@123"
  }
  ```
- **Action:** Verifies OTP, changes password
- **Response:** Success message

### **Step 4: Email Template**
Create new template: **`auth.password_change_otp`**

Subject: "Your VCLOP Password Change OTP"

Content:
- 6-digit OTP prominently displayed
- Validity: 10 minutes
- Security warning: "If you didn't request this, contact support"

### **Step 5: OTP Validation**
- OTP expires in 10 minutes
- One-time use (mark as used after validation)
- Maximum 3 attempts (prevent brute force)
- Rate limiting (max 3 OTP requests per hour)

---

## Security Features

✅ **Time-Limited:** OTP expires in 10 minutes  
✅ **One-Time Use:** Cannot reuse same OTP  
✅ **Rate Limiting:** Prevent OTP spam  
✅ **Attempt Tracking:** Lock after 3 failed attempts  
✅ **Audit Trail:** Log all OTP requests and usage  
✅ **Email Verification:** OTP sent only to verified email  
✅ **Session Revocation:** All sessions logged out after password change  

---

## Email Template Design

```html
<h2>Password Change OTP</h2>
<p>Hi {{firstName}},</p>
<p>You requested to change your password. Use this OTP to proceed:</p>

<div style="font-size: 32px; font-weight: bold; color: #667eea; padding: 20px; background: #f0f0f0; text-align: center; letter-spacing: 8px;">
  {{otp}}
</div>

<p><strong>⏱ This OTP expires in 10 minutes</strong></p>

<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
  <p><strong>⚠️ Security Notice:</strong></p>
  <p>If you didn't request this OTP, please ignore this email or contact our support team immediately.</p>
</div>
```

---

## API Workflow Example

### **1. User Requests OTP**
```http
POST /api/v1/auth/request-password-change-otp
Authorization: Bearer <user-token>
```

Response:
```json
{
  "success": true,
  "message": "OTP has been sent to your registered email",
  "data": {
    "expiresIn": "10 minutes",
    "maskedEmail": "al***@gmail.com"
  }
}
```

### **2. System Sends Email with OTP**
Email to user with 6-digit code: `847392`

### **3. User Submits OTP with New Password**
```http
POST /api/v1/auth/change-password-with-otp
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "otp": "847392",
  "newPassword": "NewSecure@123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again with your new password.",
  "data": null
}
```

### **4. User Logs Out and Logs In with New Password**

---

## Additional Features (Optional)

### **1. SMS OTP (Future Enhancement)**
- Send OTP via SMS for additional security
- Useful for high-risk operations

### **2. OTP Resend**
```http
POST /api/v1/auth/resend-password-change-otp
```
- Allow users to request new OTP if they didn't receive it
- Rate limit: 1 resend per 2 minutes

### **3. OTP Verification Before Sensitive Actions**
- Loan disbursement approval
- Permission changes
- Account deletion

---

## Database Changes Needed

### **Option 1: Use Existing Token Table**
```sql
-- No schema changes needed, just use existing token table
-- TokenType enum already supports custom types
```

### **Option 2: Add OTP Tracking Fields (Recommended)**
```sql
ALTER TABLE tokens 
ADD COLUMN attempts INT DEFAULT 0,
ADD COLUMN maxAttempts INT DEFAULT 3,
ADD COLUMN ipAddress VARCHAR(45);
```

---

## Configuration (Environment Variables)

```env
# OTP Settings
OTP_LENGTH=6
OTP_EXPIRES_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_REQUESTS=3
OTP_RATE_LIMIT_WINDOW_MINUTES=60
```

---

## Frontend Integration

### **Change Password Form (2-Step Process)**

**Step 1: Request OTP**
```typescript
const requestOTP = async () => {
  const response = await fetch('/api/v1/auth/request-password-change-otp', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Show "OTP sent to your email" message
  // Show OTP input field
};
```

**Step 2: Submit OTP with New Password**
```typescript
const changePassword = async (otp: string, newPassword: string) => {
  const response = await fetch('/api/v1/auth/change-password-with-otp', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ otp, newPassword })
  });
  // Logout and redirect to login
};
```

---

## Testing Plan

### **Test Case 1: Happy Path**
1. User requests OTP
2. Check email for 6-digit code
3. Submit OTP with new password
4. Verify password changed
5. Login with new password

### **Test Case 2: Expired OTP**
1. Request OTP
2. Wait 11 minutes
3. Try to use OTP
4. Should fail with "OTP expired"

### **Test Case 3: Invalid OTP**
1. Request OTP
2. Enter wrong OTP (3 times)
3. Should lock OTP temporarily
4. Should send security alert email

### **Test Case 4: Rate Limiting**
1. Request OTP 4 times in quick succession
2. 4th request should fail
3. Should log suspicious activity

---

## Priority: High 🔴

**Why this is important:**
- ✅ Adds extra security layer for password changes
- ✅ Standard practice in financial/banking apps
- ✅ Protects against session hijacking
- ✅ Audit trail for compliance
- ✅ User trust and confidence

**Estimated Implementation Time:** 4-6 hours
- Backend API: 2-3 hours
- Email template: 30 minutes
- Testing: 1-2 hours
- Documentation: 1 hour

---

## Next Steps

**Do you want me to:**
1. ✅ Implement the OTP functionality now?
2. ✅ Create the email template?
3. ✅ Add the API endpoints?
4. ✅ Update the database seed with OTP template?

**Or should I:**
- First show you the complete code design?
- Create a proof-of-concept?
- Focus on specific user types (staff vs. customer)?

Let me know and I'll implement it right away! 🚀
