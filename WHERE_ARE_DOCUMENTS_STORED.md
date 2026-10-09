# Where Are Documents Stored?

## Current Storage Configuration

### Local Development
**Location:** `vclop-backend/uploads/customers/`
**Driver:** Local filesystem
**Base URL:** `http://localhost:3000/uploads`

### Production (Hostinger)
**Location:** `./uploads/` directory on the server
**Driver:** Local filesystem  
**Base URL:** `https://api.verticalcapital.ng/uploads`

**Configuration:** Set in `.env` file:
```env
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
STORAGE_PUBLIC_URL=https://api.verticalcapital.ng/uploads
```

## Directory Structure

```
vclop-backend/
└── uploads/
    └── customers/           # Customer documents (ID cards, utility bills, etc.)
        ├── uuid1.jpg
        ├── uuid2.pdf
        ├── uuid3.png
        └── ...
    
    # Future folders (when field visit photos are migrated):
    └── field-visits/        # Field visit photos
        ├── uuid1.jpg
        ├── uuid2.jpg
        └── ...
```

## How Files Are Named

**Format:** `{folder}/{uuid}.{extension}`

**Examples:**
- `customers/042827e9-d687-4ad4-bec0-3abc1234.jpg`
- `customers/365f2f10-1e4e-4520-82a2-9def5678.pdf`

**UUID = Unique identifier** - prevents filename conflicts and ensures security (can't guess file paths)

## Database Records

### CustomerDocument Table
```sql
SELECT 
  id,
  customerId,
  documentTypeId,
  fileKey,              -- e.g. "customers/uuid.jpg"
  fileUrl,              -- Full URL: "http://localhost:3000/uploads/customers/uuid.jpg"
  originalName,         -- Original filename when uploaded
  mimeType,             -- e.g. "image/jpeg", "application/pdf"
  size,                 -- File size in bytes
  status                -- PENDING, VERIFIED, REJECTED
FROM customer_documents;
```

**Key fields:**
- `fileKey` - Relative path in storage (stored in DB)
- `fileUrl` - Full URL (constructed by StorageService)
- `originalName` - User's original filename (for display only)

## How to Access Stored Files

### Option 1: Via API (Recommended)
**Endpoint:** `GET /api/v1/customers/{customerId}/documents/{documentId}/download`

**Authentication:** Required (JWT token)

**Response:** File blob (opens in browser or downloads)

**Example:**
```javascript
const blob = await customersService.downloadDocument(customerId, documentId);
const url = URL.createObjectURL(blob);
window.open(url, '_blank');
```

### Option 2: Direct File Access (Development Only)

**Local development:**
1. Navigate to: `vclop-backend/uploads/customers/`
2. Files are named with UUIDs (check database for mapping)
3. Open with any image viewer or PDF reader

**Example:**
```bash
cd vclop-backend/uploads/customers
ls -lh  # List all files
open 042827e9-d687-4ad4-bec0-3abc1234.jpg  # Mac
start 042827e9-d687-4ad4-bec0-3abc1234.jpg  # Windows
```

### Option 3: Via Public URL (If Served as Static Files)

Backend serves `/uploads/*` as static files:

**URL format:** `{BASE_URL}/uploads/{fileKey}`

**Example:**
```
http://localhost:3000/uploads/customers/042827e9-d687-4ad4-bec0-3abc1234.jpg
```

**⚠️ Security Note:** This only works if:
- Backend serves uploads as static files
- Files are not behind authentication
- NOT recommended for production (documents should require auth)

### Option 4: Via Database Query

**Find the file path from database:**
```sql
-- Get all documents for a customer
SELECT 
  cd.id,
  cd.fileKey,
  cd.fileUrl,
  cd.originalName,
  cd.status,
  dt.name as documentType,
  c.customerNumber
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
JOIN document_types dt ON dt.id = cd.documentTypeId
WHERE c.customerNumber = 'VC-000027';

-- Result example:
-- fileKey: "customers/042827e9-d687-4ad4-bec0-3abc1234.jpg"
-- fileUrl: "http://localhost:3000/uploads/customers/042827e9-d687-4ad4-bec0-3abc1234.jpg"
```

Then open the file manually:
```bash
cd vclop-backend
start uploads/customers/042827e9-d687-4ad4-bec0-3abc1234.jpg
```

## Storage on Hostinger (Production)

### File Location on Server
**Path:** `/home/u924639440/domains/api.verticalcapital.ng/public_html/uploads/`

**Access via SSH:**
```bash
ssh u924639440@verticalcapital.ng
cd domains/api.verticalcapital.ng/public_html/uploads/customers
ls -lh  # List files
```

**Access via File Manager (Hostinger Control Panel):**
1. Login to Hostinger
2. Go to **File Manager**
3. Navigate to: `domains/api.verticalcapital.ng/public_html/uploads/customers/`
4. Download files to view them locally

### Production URLs
Documents are served at:
```
https://api.verticalcapital.ng/uploads/customers/{uuid}.{ext}
```

**⚠️ Important:** Ensure backend serves uploads directory as static files!

## Backup Strategy

### What to Backup
✅ **Database** - Contains metadata (fileKey, originalName, status, etc.)  
✅ **uploads/ directory** - Contains actual files

**Both are required!** Database without files = broken links. Files without database = can't identify them.

### Backup Commands

**Local development:**
```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup database (already done via mysqldump)
```

**Production (Hostinger):**
```bash
# Via SSH
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Download to local machine
scp u924639440@verticalcapital.ng:/path/to/uploads-backup-*.tar.gz ./backups/
```

**Via Hostinger Control Panel:**
1. File Manager → Right-click `uploads/` folder
2. Compress → Download ZIP
3. Store in secure location

## File Size Limits

**Current limit:** 10 MB per file  
**Configured in:** `.env` → `MAX_FILE_SIZE_MB=10`

**Allowed file types:**
- Images: `.jpg`, `.jpeg`, `.png`, `.webp`
- Documents: `.pdf`

**To increase limit:**
```env
MAX_FILE_SIZE_MB=20
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,application/pdf,application/msword
```

## Storage Driver Options

### Option 1: Local Filesystem (Current)
✅ **Simple** - No external dependencies  
✅ **Fast** - Direct file access  
❌ **Not scalable** - Single server only  
❌ **No CDN** - Can't distribute globally  
❌ **Backup manual** - Must backup uploads/ folder separately  

**Best for:** Small deployments, development, testing

### Option 2: AWS S3 / DigitalOcean Spaces (Recommended for Production)
✅ **Scalable** - Unlimited storage  
✅ **Durable** - 99.999999999% durability (11 nines)  
✅ **CDN ready** - Serve via CloudFront/CDN  
✅ **Auto backup** - Built-in redundancy  
✅ **Global access** - Fast worldwide  

**How to switch:**
```env
STORAGE_DRIVER=s3
S3_BUCKET=vclop-documents
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-key-id
S3_SECRET_ACCESS_KEY=your-secret
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com  # For DigitalOcean Spaces
S3_PUBLIC_URL=https://cdn.verticalcapital.ng     # Optional CDN
```

**⚠️ Migration:** Existing files in `uploads/` must be uploaded to S3!

## Troubleshooting

### "Document not found" error
1. Check database: Does `fileKey` exist in `customer_documents` table?
2. Check filesystem: Does the file exist at `uploads/{fileKey}`?
3. Check permissions: Can Node.js read the uploads directory?

```sql
-- Find document record
SELECT fileKey, fileUrl FROM customer_documents WHERE id = 'doc-id-here';
```

```bash
# Check if file exists
cd vclop-backend
ls -l uploads/customers/042827e9-d687-4ad4-bec0-3abc1234.jpg
```

### "Permission denied" when accessing files
**Linux/Mac:**
```bash
chmod -R 755 uploads/
chown -R node:node uploads/  # Or your Node.js user
```

**Windows:** Ensure Node.js process has read access to uploads folder

### Files not accessible via URL
Check that backend serves uploads as static:

```typescript
// main.ts or app.module.ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

### Large files failing to upload
1. Increase `MAX_FILE_SIZE_MB` in `.env`
2. Check Nginx/Apache upload limits (if using reverse proxy)
3. Check Node.js body-parser limits

## Security Considerations

### ✅ Current Security Features
- UUID-based filenames (can't guess paths)
- Authentication required for download API
- File type validation (MIME type checking)
- File size limits

### ⚠️ Security Recommendations
1. **Do NOT serve uploads as public static files** without authentication
2. Use signed URLs for temporary access (especially with S3)
3. Scan uploaded files for malware (consider ClamAV integration)
4. Encrypt sensitive documents at rest
5. Log all file access (audit trail)
6. Implement rate limiting on upload endpoints

## Summary

**Where documents are stored:**
- **Local:** `vclop-backend/uploads/customers/` (development)
- **Production:** `/home/u924639440/domains/api.verticalcapital.ng/public_html/uploads/customers/` (Hostinger)

**How to view them:**
- **In app:** Customer profile → Documents tab → Click "View" button
- **Direct access:** Navigate to uploads folder and open files
- **Via SSH:** Login to server and browse files
- **File Manager:** Hostinger control panel → File Manager

**Database records:** `customer_documents` table stores metadata (`fileKey`, `fileUrl`, `originalName`, etc.)

**Field visit photos:** Currently stored as base64 in database (❌ bad) - should be migrated to file storage like customer documents.
