# 🚨 URGENT: Action Required on Hostinger Production Server

## Issue Fixed
✅ **Document download endpoint added** (Commit: ca63f352)
- Users were getting "document not found" when trying to view uploaded documents
- Download endpoint was completely missing from the API

## ⚠️ CRITICAL: Environment Variables Must Be Added

The following environment variables **MUST** be added to your Hostinger production environment:

```env
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
STORAGE_PUBLIC_URL=https://api.verticalcapital.ng/uploads
```

**Without these variables, document upload/download will NOT work!**

---

## 🔧 How to Add Environment Variables on Hostinger

### Option 1: Via Hostinger Control Panel (Recommended)
1. Login to Hostinger
2. Go to **Hosting** → **Manage**
3. Click on **Node.js Application**
4. Scroll to **Environment Variables** section
5. Add each variable:
   - Name: `STORAGE_DRIVER`, Value: `local`
   - Name: `UPLOAD_DIR`, Value: `./uploads`
   - Name: `STORAGE_PUBLIC_URL`, Value: `https://api.verticalcapital.ng/uploads`
6. Click **Save** or **Restart Application**

### Option 2: Via SSH + .env File
```bash
# SSH into server
ssh u215495167@us-bos-web1461

# Navigate to application directory
cd [your-app-directory]

# Edit .env file
nano .env

# Add these lines:
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
STORAGE_PUBLIC_URL=https://api.verticalcapital.ng/uploads

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart application (method depends on your setup)
```

---

## 📁 Create Uploads Directory

After adding environment variables, ensure the uploads directory exists:

```bash
# SSH into server
ssh u215495167@us-bos-web1461

# Create uploads directory
mkdir -p ~/uploads/customers

# Set proper permissions
chmod 755 ~/uploads
chmod 755 ~/uploads/customers

# Verify
ls -la ~/uploads
```

---

## ✅ Verification Steps

After completing the above steps:

1. **Check application is running:**
   ```
   Visit: https://api.verticalcapital.ng/api/health
   Should return: { "status": "ok" }
   ```

2. **Test document upload:**
   - Login to the application
   - Upload a customer document
   - Verify no errors

3. **Test document download:**
   - Try to view/download the uploaded document
   - Should work without "document not found" error

4. **Check logs for errors:**
   - Monitor application logs for 10-15 minutes
   - Look for any storage-related errors

---

## 🐛 If Still Not Working

### Check these:

1. **Environment variables loaded?**
   ```bash
   # In your app directory
   cat .env | grep UPLOAD
   ```

2. **Uploads directory exists?**
   ```bash
   ls -la ~/uploads
   ```

3. **Application restarted?**
   - Restart via Hostinger control panel
   - Or via SSH (pm2 restart, etc.)

4. **Check application logs:**
   - Look for "Storage" or "upload" related errors
   - Check if UPLOAD_DIR is being read correctly

---

## 📊 What Changed

### Files Modified:
1. `src/modules/customers/customer-documents.controller.ts`
   - Added download endpoint: `GET /:documentId/download`
   - Added necessary imports (Response, ConfigService, fs, path)

2. `src/modules/customers/customer-documents.service.ts`
   - Added `findOne()` method to fetch document by ID

3. `.env` (local only)
   - Added storage configuration variables

### GitHub Commits:
- `ca63f352` - Fix: Add missing document download endpoint and storage config
- `afac63ab` - Docs: Add production environment setup guide

---

## 🔄 Deployment Status

- ✅ Code pushed to GitHub
- ✅ Hostinger should auto-deploy (within 2-3 minutes)
- ⏳ **WAITING**: Environment variables to be added
- ⏳ **WAITING**: Uploads directory to be created
- ⏳ **WAITING**: Application restart

---

## 📞 Need Help?

If you encounter issues:
1. Check the full guide: `PRODUCTION_ENV_SETUP.md`
2. Review environment template: `.env.production.example`
3. Check deployment logs in Hostinger dashboard

---

**Created**: 2026-09-11  
**Priority**: 🔴 HIGH - Production Issue  
**Impact**: Users cannot view uploaded documents
