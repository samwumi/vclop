# ⚡ Setup Leave Balances RIGHT NOW (No Restart Required)

## Quick Fix - Call API Endpoint Directly

You can now setup leave entitlements **without** restarting the application or setting environment variables!

### Step 1: Get Your Auth Token

1. Login to your application
2. Open Browser DevTools (F12)
3. Go to Application → Local Storage
4. Find `vclop_token` and copy the value

### Step 2: Call the Setup Endpoint

**Using Postman/Insomnia:**
```
POST https://your-domain.com/api/v1/hr/leaves/admin/setup-entitlements
Headers:
  Authorization: Bearer YOUR_TOKEN_HERE
```

**Using cURL:**
```bash
curl -X POST https://your-domain.com/api/v1/hr/leaves/admin/setup-entitlements \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Using Browser Console:**
```javascript
fetch('/api/v1/hr/leaves/admin/setup-entitlements', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('vclop_token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log(data));
```

### Step 3: Verify Response

You should see:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "year": 2026,
    "usersProcessed": 6,
    "leaveTypes": 7,
    "entitlementsCreated": 42,
    "entitlementsSkipped": 0,
    "details": [
      {
        "username": "john.doe",
        "email": "john@example.com",
        "entitlements": [
          { "leaveType": "Annual Leave", "days": "21" },
          { "leaveType": "Sick Leave", "days": "10" }
        ]
      }
    ]
  }
}
```

### Step 4: Test Leave Application

1. Go to Apply for Leave
2. Select leave type
3. Should now show available balance (e.g., 21 days)
4. Submit application - should work!

## ✅ What This Does

- Creates leave entitlements for ALL active users
- For current year (2026)
- Based on default days per leave type
- Safe to call multiple times (skips existing entitlements)
- **No app restart required!**

## 🔒 Security

- Requires `leaves:manage` permission
- Only admins/HR can call this endpoint
- If you get 403 Forbidden, your user doesn't have permission

## 🐛 Troubleshooting

### "403 Forbidden"
Your user needs `leaves:manage` permission. Ask admin to grant it or login as admin.

### "401 Unauthorized"
Your token expired. Login again and get new token.

### "entitlementsCreated": 0, "entitlementsSkipped": 42
Entitlements already exist! This means setup was done before or automatic setup ran.

### Still showing "Available: 0"
1. Check the response - were entitlements created?
2. Refresh the leave application page (Ctrl+R)
3. Clear cache and try again
4. Check browser console for errors

## 💡 Alternative Methods

If the API endpoint doesn't work, you can still:

1. **SSH to server and run:**
   ```bash
   cd /path/to/vclop/vclop-backend
   npm run setup:leave-entitlements
   ```

2. **Run SQL script:**
   ```bash
   mysql -u root -p vclop_db < vclop-backend/QUICK_FIX_LEAVE_BALANCE.sql
   ```

3. **Set environment variable and restart:**
   ```
   AUTO_SETUP_LEAVE_ENTITLEMENTS=true
   ```

But the API endpoint is fastest! ⚡
