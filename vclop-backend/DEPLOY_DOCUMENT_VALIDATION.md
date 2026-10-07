# Deploy Document Validation Fix to Hostinger

## What We're Deploying
**Commit:** `27e9253f` - Document validation in compliance review  
**Date:** September 25, 2026  
**Changes:** Compliance Officers must now verify documents before approving loans

---

## Step 1: SSH into Hostinger

```bash
ssh your-username@your-hostinger-server

# Example (use your actual credentials):
# ssh u123456789@154.56.xx.xx
```

**Password:** Your Hostinger/cPanel password

---

## Step 2: Navigate to Backend Application

```bash
# Find your app (likely one of these paths)
cd ~/domains/verticalcapital.ng/vclop-backend

# OR
cd ~/public_html/vclop-backend

# OR (if unsure, search for it)
find ~ -maxdepth 4 -name "vclop-backend" -type d 2>/dev/null
```

**Verify you're in the right place:**
```bash
ls -la
# You should see: package.json, src/, prisma/, node_modules/
```

---

## Step 3: Pull Latest Code from GitHub

```bash
# Check current branch
git branch

# Check remote
git remote -v

# Pull latest code (includes commit 27e9253f)
git pull origin main

# If it shows conflicts or errors, force reset:
git fetch origin
git reset --hard origin/main
```

**Expected output:**
```
Updating 9faac61e..27e9253f
Fast-forward
 src/modules/loan-applications/loan-applications.service.ts | 44 +++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 43 insertions(+), 1 deletion(-)
```

---

## Step 4: Install Dependencies (if needed)

```bash
npm install
```

*(Usually not needed for code-only changes, but safe to run)*

---

## Step 5: Restart the Application

### **Option A: Using PM2 (most common)**
```bash
# Check if PM2 is available
pm2 list

# Restart the backend
pm2 restart vclop-backend

# OR if using npx:
npx pm2 restart vclop-backend

# Check logs to confirm restart
pm2 logs vclop-backend --lines 20
```

### **Option B: Using Hostinger Node.js Manager**
1. Go to **Hostinger hPanel**
2. Navigate to **Hosting** → **Manage**
3. Scroll to **Node.js Application**
4. Find `vclop-backend`
5. Click **Restart** button

### **Option C: Manual restart**
```bash
# Find the process
ps aux | grep node | grep vclop

# Kill it (replace PID with actual process ID)
kill -9 [PID]

# Restart
npm run start:prod &
```

---

## Step 6: Verify Deployment

### **A. Check the application is running:**
```bash
ps aux | grep node | grep vclop
```

You should see a running Node.js process.

### **B. Check logs for errors:**
```bash
pm2 logs vclop-backend --lines 50
# OR
tail -f ~/logs/vclop-backend.log
```

Look for startup messages like:
```
✅ Server running on port 3001
✅ Database connected
✅ Application started successfully
```

### **C. Test the API:**
```bash
curl https://api.verticalcapital.ng/health
```

Expected response:
```json
{"status": "ok"}
```

---

## Step 7: Test the Document Validation Feature

### **Test Case 1: Try to approve loan without documents**

1. Login to **https://verticalcapital.ng** as Compliance Officer
2. Navigate to **Compliance Review** page
3. Open any loan in COMPLIANCE_REVIEW status
4. Click **"Approve"** button WITHOUT approving any documents

**Expected Result:**
```
❌ Error: "Cannot approve: No documents have been verified and approved. 
    Please review and approve at least one customer document before approving the loan application."
```

### **Test Case 2: Approve with valid documents**

1. Same loan application
2. Go to **Customer Documents** section
3. View uploaded documents (passport, ID, etc.)
4. Mark at least one document as **"APPROVED"**
5. Now click **"Approve"** on the loan

**Expected Result:**
```
✅ Success: "Compliance review completed"
Loan moves to: INTERNAL_CONTROL_REVIEW
```

---

## Step 8: Monitor for Issues

After deployment, monitor for the next 1-2 hours:

```bash
# Watch logs in real-time
pm2 logs vclop-backend --lines 100

# Look for errors related to:
# - "Cannot approve"
# - "customerDocument"
# - "complianceReview"
```

---

## Rollback Plan (If Needed)

If the validation causes problems, rollback:

```bash
# SSH into server
cd ~/domains/verticalcapital.ng/vclop-backend

# Revert to previous commit (before document validation)
git revert 27e9253f --no-edit
git push origin main

# Pull the revert
git pull origin main

# Restart
pm2 restart vclop-backend
```

---

## Environment Variables Check

While you're SSH'd in, verify the `.env` file exists:

```bash
cat .env | grep -E "DATABASE_URL|PORT|JWT_SECRET"
```

**If you need to add the ENCRYPTION_KEY** (for Task #2):
```bash
nano .env

# Add this line:
ENCRYPTION_KEY=008f31898b4143a0a5cfb241bdae523b4365433a541cb0d0e8023e54d107df33

# Save: Ctrl+O, Enter, Ctrl+X
```

---

## Summary

**What changed:**
- ✅ Compliance Officers now **must approve at least 1 document** before approving loans
- ✅ Validates guarantor requirement (if loan product requires it)
- ✅ Prevents KYC violations and NDPA 2023 non-compliance

**Files modified:**
- `src/modules/loan-applications/loan-applications.service.ts`

**No database changes needed** - this is pure business logic.

**Deployment time:** ~5 minutes (pull + restart)

---

## Quick Command Summary

```bash
# 1. SSH into server
ssh your-username@hostinger-server

# 2. Navigate to app
cd ~/domains/verticalcapital.ng/vclop-backend

# 3. Pull latest code
git pull origin main

# 4. Restart
pm2 restart vclop-backend

# 5. Check logs
pm2 logs vclop-backend --lines 50

# 6. Test API
curl https://api.verticalcapital.ng/health
```

---

**Status:** Ready to deploy  
**Risk Level:** Low (validation adds security, no breaking changes)  
**Testing Required:** Yes (test with Compliance Officer role)

🚀 **Let's deploy!**
