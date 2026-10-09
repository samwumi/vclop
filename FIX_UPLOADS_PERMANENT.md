# Fix Document Uploads - Make Storage Permanent

## Problem
The `uploads/` folder is created inside Hostinger's build directory, which gets **deleted on every deployment**. This causes:
- Uploaded documents disappear after redeployment
- "File not found" errors when viewing documents
- Data loss

## Solution
Move uploads to `public_html/uploads/` which persists across deployments.

---

## Step 1: Update Production .env

### SSH Method (Recommended):

```bash
# SSH into Hostinger
ssh u215495167@verticalcapital.ng

# Edit the config
nano ~/domains/verticalcapital.ng/hbuilds/config/.env
```

**Find this line:**
```env
UPLOAD_DIR='./uploads'
```

**Change it to:**
```env
UPLOAD_DIR='/home/u215495167/domains/verticalcapital.ng/public_html/uploads'
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` (to confirm)
- Press `Enter`

### File Manager Method (Alternative):

1. Login to Hostinger control panel
2. Go to **File Manager**
3. Navigate to: `domains/verticalcapital.ng/hbuilds/config/`
4. Right-click `.env` → Edit
5. Find line: `UPLOAD_DIR='./uploads'`
6. Change to: `UPLOAD_DIR='/home/u215495167/domains/verticalcapital.ng/public_html/uploads'`
7. Save and close

---

## Step 2: Verify uploads folder exists in public_html

```bash
# SSH command
ls -la ~/domains/verticalcapital.ng/public_html/uploads/customers/
```

**Should see:**
```
drwxrwxrwx customers/
```

If not, create it:
```bash
mkdir -p ~/domains/verticalcapital.ng/public_html/uploads/customers
chmod -R 777 ~/domains/verticalcapital.ng/public_html/uploads/
```

---

## Step 3: Restart the Application

### Option A: Via Hostinger Control Panel
1. Go to **Websites** → Your site
2. Click **Manage**
3. Go to **Advanced** → **Application**
4. Click **Restart Application**

### Option B: Trigger Rebuild
1. Make a small code change (or empty commit)
2. Push to GitHub
3. Hostinger auto-deploys

### Option C: Via SSH (if you have process manager)
```bash
# Find running Node process
ps aux | grep node

# Restart (method depends on your setup)
# Usually Hostinger handles this automatically
```

---

## Step 4: Test Upload

1. Go to https://verticalcapital.ng
2. Navigate to any customer profile → Documents tab
3. Upload a test document
4. Verify it appears in: `public_html/uploads/customers/{customerId}/documents/`

```bash
# SSH check
ls -la ~/domains/verticalcapital.ng/public_html/uploads/customers/
```

You should see a new folder with customer UUID.

---

## Step 5: Move Existing Uploads (if any)

If there are recent uploads in the build directory that you want to keep:

```bash
# Check if there are files to move
ls -la ~/domains/verticalcapital.ng/hbuilds/versions/*/nodejs/uploads/customers/

# Move them to permanent location (if any exist)
cp -r ~/domains/verticalcapital.ng/hbuilds/versions/*/nodejs/uploads/customers/* \
      ~/domains/verticalcapital.ng/public_html/uploads/customers/ 2>/dev/null
```

---

## Step 6: Verify Download Works

1. In the app, click "View" on an uploaded document
2. Document should open in new tab
3. No "File not found" error

If you still see errors, check:

```bash
# Verify file URL in database matches actual location
# Run this SQL:
```

```sql
SELECT 
  cd.fileKey,
  cd.fileUrl,
  cd.originalName,
  c.customerNumber
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
WHERE cd.createdAt >= '2026-10-08'
LIMIT 5;
```

**Expected fileKey format:**
```
customers/{customerId}/documents/{uuid}.jpg
```

**Expected fileUrl format:**
```
/uploads/customers/{customerId}/documents/{uuid}.jpg
```

---

## Step 7: Clean Up Old Build Uploads (Optional)

After confirming the new location works:

```bash
# Remove uploads from old build directories (optional cleanup)
rm -rf ~/domains/verticalcapital.ng/hbuilds/versions/*/nodejs/uploads/
```

---

## Verification Checklist

- [ ] `.env` updated with absolute path to `public_html/uploads`
- [ ] `public_html/uploads/customers/` folder exists with 777 permissions
- [ ] Application restarted
- [ ] Test upload successful
- [ ] File appears in `public_html/uploads/customers/`
- [ ] Downloaded/viewed document works in browser
- [ ] Old broken documents cleaned up (ran SQL cleanup script)

---

## Future Deployments

With this fix, uploads will now **persist across all future deployments**:

✅ **Before fix:** New deployment → uploads deleted → files lost  
✅ **After fix:** New deployment → uploads in `public_html/` → files preserved

---

## Troubleshooting

### "File not found" after moving

**Check permissions:**
```bash
chmod -R 755 ~/domains/verticalcapital.ng/public_html/uploads/
```

**Check file exists:**
```bash
ls -la ~/domains/verticalcapital.ng/public_html/uploads/customers/
```

### Uploads still going to build directory

**Verify .env was saved:**
```bash
cat ~/domains/verticalcapital.ng/hbuilds/config/.env | grep UPLOAD
```

Should show:
```
UPLOAD_DIR='/home/u215495167/domains/verticalcapital.ng/public_html/uploads'
```

**Restart app again** - changes require restart to take effect.

### Permission denied when uploading

```bash
# Give Node.js write access
chmod -R 777 ~/domains/verticalcapital.ng/public_html/uploads/
```

---

## Summary

**What we fixed:**
1. ❌ **Before:** Uploads saved to temporary build directory → lost on deployment
2. ✅ **After:** Uploads saved to `public_html/uploads/` → persists forever

**What you need to do:**
1. Update `.env` with absolute path
2. Restart app
3. Test upload
4. Run cleanup SQL for old broken documents
5. Notify users to re-upload documents submitted before Oct 8

**Files involved:**
- Config: `~/domains/verticalcapital.ng/hbuilds/config/.env`
- Storage: `~/domains/verticalcapital.ng/public_html/uploads/customers/`
- Cleanup: `vclop/CLEANUP_BROKEN_DOCUMENTS.sql`
