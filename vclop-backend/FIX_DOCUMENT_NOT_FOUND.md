# Fix: Document Not Found When Viewing Uploaded Documents

## Problem
Users get "Document not found" or 404 error when trying to view/download uploaded customer documents.

---

## Diagnosis Steps

### Step 1: Check Database Document Paths

Run this SQL in phpMyAdmin:

```sql
SELECT 
    cd.id,
    c.customerNumber,
    dt.name as documentType,
    cd.fileKey,
    cd.originalName,
    cd.status
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
JOIN document_types dt ON dt.id = cd.documentTypeId
WHERE cd.deletedAt IS NULL
ORDER BY cd.createdAt DESC
LIMIT 10;
```

**Look for the `fileKey` column:**
- ✅ Correct format: `customers/123-uuid/documents/456-uuid.pdf`
- ❌ Wrong format: `/uploads/customers/...` or `uploads/customers/...`

---

### Step 2: Check Server File System

SSH into Hostinger and check if files actually exist:

```bash
# Navigate to your app
cd ~/domains/verticalcapital.ng/vclop-backend

# Check uploads directory
ls -la uploads/

# Check if customer document folders exist
ls -la uploads/customers/

# Check a specific customer folder (replace UUID with actual)
ls -la uploads/customers/<customer-uuid>/documents/
```

---

### Step 3: Check .env Configuration

```bash
# SSH into server
cd ~/domains/verticalcapital.ng/vclop-backend

# Check if UPLOAD_DIR is set
cat .env | grep UPLOAD_DIR

# If not set, add it:
nano .env

# Add this line:
UPLOAD_DIR=./uploads

# Save: Ctrl+O, Enter, Ctrl+X
```

---

## Common Causes & Fixes

### **Cause 1: Upload directory doesn't exist**

**Fix:**
```bash
# SSH into server
cd ~/domains/verticalcapital.ng/vclop-backend

# Create uploads directory
mkdir -p uploads/customers

# Set proper permissions
chmod 755 uploads
chmod 755 uploads/customers
```

---

### **Cause 2: UPLOAD_DIR environment variable not set**

**Check:**
```bash
cat .env | grep UPLOAD_DIR
```

**Fix if missing:**
```bash
nano .env

# Add:
UPLOAD_DIR=./uploads

# Or absolute path:
UPLOAD_DIR=/home/username/domains/verticalcapital.ng/vclop-backend/uploads
```

**Restart app:**
```bash
pm2 restart vclop-backend
```

---

### **Cause 3: Files were uploaded to wrong location**

This happens if the app was running with wrong `UPLOAD_DIR` setting.

**Check where files are:**
```bash
# Find all uploaded files
find ~/domains/verticalcapital.ng -name "*.pdf" -o -name "*.jpg" -o -name "*.png" | head -20
```

**If files are in wrong location, move them:**
```bash
# Example: Move from /tmp/uploads to correct location
cd ~/domains/verticalcapital.ng/vclop-backend
mv /wrong/path/uploads/* ./uploads/
```

---

### **Cause 4: fileKey in database has wrong path**

If the database has absolute paths like `/uploads/customers/...` instead of relative `customers/...`:

**Fix SQL:**
```sql
-- Check current format
SELECT fileKey FROM customer_documents LIMIT 5;

-- If they start with /uploads/ or uploads/, fix them:
UPDATE customer_documents 
SET fileKey = REPLACE(fileKey, '/uploads/', '')
WHERE fileKey LIKE '/uploads/%';

UPDATE customer_documents 
SET fileKey = REPLACE(fileKey, 'uploads/', '')
WHERE fileKey LIKE 'uploads/%';

-- Verify fix
SELECT fileKey FROM customer_documents LIMIT 5;
```

---

### **Cause 5: Permission issues**

Files exist but Node.js can't read them:

**Fix permissions:**
```bash
cd ~/domains/verticalcapital.ng/vclop-backend

# Make sure Node.js can read uploads
chmod -R 755 uploads/

# Check file ownership
ls -la uploads/customers/

# If owned by root or wrong user, change it:
# chown -R your-username:your-username uploads/
```

---

## Quick Debug Script

SSH into server and run:

```bash
cd ~/domains/verticalcapital.ng/vclop-backend

# Create debug script
cat > debug-uploads.sh << 'EOF'
#!/bin/bash
echo "=== Upload Directory Debug ==="
echo ""
echo "Current directory:"
pwd
echo ""
echo "UPLOAD_DIR from .env:"
grep UPLOAD_DIR .env || echo "Not set"
echo ""
echo "uploads/ exists?"
ls -ld uploads/ 2>/dev/null || echo "NO - uploads/ directory not found"
echo ""
echo "uploads/customers/ exists?"
ls -ld uploads/customers/ 2>/dev/null || echo "NO - uploads/customers/ not found"
echo ""
echo "Sample files in uploads/:"
find uploads/ -type f | head -10 || echo "No files found"
echo ""
echo "File count:"
find uploads/ -type f | wc -l
EOF

chmod +x debug-uploads.sh
./debug-uploads.sh
```

---

## Test After Fix

### 1. Upload a test document:
- Login to https://verticalcapital.ng
- Go to a customer profile
- Click "Upload Document"
- Upload a passport photo

### 2. Check it was saved:
```bash
# SSH into server
cd ~/domains/verticalcapital.ng/vclop-backend
ls -la uploads/customers/
```

### 3. Try to view the document:
- Click on the uploaded document
- Should display/download successfully
- If 404, check logs:

```bash
pm2 logs vclop-backend --lines 50
```

Look for errors like:
- `File not found on server`
- `ENOENT: no such file or directory`

---

## Permanent Fix (Code Level)

If the issue persists, we may need to add more logging to the download endpoint:

**Add debug logging to `customer-documents.controller.ts`:**

```typescript
@Get(':documentId/download')
async download(...) {
  const doc = await this.service.getDocumentForDownload(documentId, customerId);
  
  const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(process.cwd(), 'uploads');
  
  const filePath = path.join(uploadDir, doc.fileKey);

  // ADD THIS DEBUG LOGGING:
  console.log('[Document Download Debug]', {
    documentId,
    fileKey: doc.fileKey,
    uploadDir,
    filePath,
    exists: fs.existsSync(filePath),
    cwd: process.cwd(),
  });

  if (!fs.existsSync(filePath)) {
    console.error('[Document Not Found]', filePath);
    return res.status(404).json({ message: 'File not found on server' });
  }
  
  // ... rest of code
}
```

Then check logs after trying to download:
```bash
pm2 logs vclop-backend --lines 50
```

---

## Summary Checklist

- [ ] Run `DEBUG_DOCUMENT_NOT_FOUND.sql` to check database paths
- [ ] SSH into server and verify `uploads/` directory exists
- [ ] Check `.env` file has `UPLOAD_DIR=./uploads`
- [ ] Verify file permissions: `chmod 755 uploads/`
- [ ] Test upload new document
- [ ] Test view/download document
- [ ] Check `pm2 logs` for errors

---

**Most likely cause:** UPLOAD_DIR not set in .env or uploads directory doesn't exist.

**Quick fix:** 
```bash
cd ~/domains/verticalcapital.ng/vclop-backend
mkdir -p uploads/customers
echo "UPLOAD_DIR=./uploads" >> .env
pm2 restart vclop-backend
```

Let me know what you find! 🔍
