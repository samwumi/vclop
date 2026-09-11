# Production Environment Setup Guide

## 🔴 CRITICAL: Production .env Configuration

This guide documents the **required** environment variables for production deployment on Hostinger.

---

## 📋 Required Environment Variables

### 1. Database
```env
DATABASE_URL="mysql://username:password@host:3306/vclop"
```
- Replace `username`, `password`, `host` with your production MySQL credentials
- Database name should be `vclop`

### 2. JWT & Security
```env
JWT_SECRET=<strong-random-secret-minimum-32-characters>
SEED_ADMIN_PASSWORD=<strong-password-with-special-chars>
```
⚠️ **IMPORTANT**: Use strong, unique values for production!

### 3. Frontend URL
```env
FRONTEND_URL=https://verticalcapital.ng
```
- Replace with your actual production frontend URL
- Used for CORS and email links

### 4. Storage Configuration (NEW - CRITICAL)
```env
STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
STORAGE_PUBLIC_URL=https://api.verticalcapital.ng/uploads
```
⚠️ **CRITICAL**: Without these, document upload/download will fail!
- `UPLOAD_DIR`: Where uploaded documents are stored on the server
- `STORAGE_PUBLIC_URL`: Public URL to access uploaded files

### 5. Email Configuration
```env
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_SECURE=true
MAIL_USER=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_FROM_NAME=Vertical Capital
MAIL_FROM_EMAIL=noreply@verticalcapital.ng
```
- Replace with your production SMTP provider (not Mailtrap!)
- Recommended providers: SendGrid, AWS SES, Mailgun, Postmark

---

## 🚀 Hostinger Deployment Checklist

### Before Deploying Code Changes:
- [ ] Test changes locally with `npm run build`
- [ ] Test changes locally with `npm run start:dev`
- [ ] Verify no TypeScript errors
- [ ] Check that all new features work as expected
- [ ] Review git diff to ensure no sensitive data is committed

### Deploying to Production:
- [ ] Commit changes: `git add . && git commit -m "description"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Wait 2-3 minutes for Hostinger auto-deployment
- [ ] Check deployment logs in Hostinger dashboard
- [ ] Verify application is running (check API health endpoint)

### After Deployment:
- [ ] Test the deployed feature in production
- [ ] Monitor error logs for 10-15 minutes
- [ ] Check that existing features still work (smoke test)
- [ ] Document any manual steps taken (DB changes, etc.)

---

## 📁 File Storage on Hostinger

### Directory Structure:
```
/home/u215495167/
├── uploads/                    # Document storage (UPLOAD_DIR points here)
│   └── customers/
│       └── {customerId}/
│           └── documents/
│               └── {uuid}.pdf
└── [application-directory]/
    └── vclop-backend/
```

### Setting Up Upload Directory:
```bash
# SSH into Hostinger
ssh u215495167@us-bos-web1461

# Create uploads directory (if it doesn't exist)
mkdir -p ~/uploads/customers

# Set permissions
chmod 755 ~/uploads
chmod 755 ~/uploads/customers

# Check if directory exists
ls -la ~/uploads
```

---

## 🔧 Environment Variables on Hostinger

### How to Set Environment Variables:

1. **Via Hostinger Control Panel:**
   - Go to Hosting → Manage → Node.js Application
   - Find "Environment Variables" section
   - Add each variable one by one

2. **Via .env File (Alternative):**
   - SSH into server
   - Navigate to application directory
   - Create/edit `.env` file
   - **⚠️ WARNING**: Ensure `.env` is in `.gitignore`!

---

## 🐛 Troubleshooting Document Upload/Download

### Problem: "Document not found" error

**Possible Causes:**
1. `UPLOAD_DIR` environment variable not set
2. Uploads directory doesn't exist on server
3. Incorrect file permissions
4. Files uploaded before fix (stored in wrong location)

**Solutions:**
```bash
# Check if uploads directory exists
ls -la ~/uploads

# Check if files exist
find ~/uploads -type f -name "*.pdf" | head -10

# Check environment variables (if using .env file)
cat .env | grep UPLOAD

# Check directory permissions
ls -la ~/uploads
```

### Problem: Files upload but can't download

**Cause**: Download endpoint was missing (fixed in commit ca63f352)

**Solution**: 
- Ensure you're on latest code
- Test endpoint: `GET /api/v1/customers/:customerId/documents/:documentId/download`

---

## 🔒 Production Safety Rules

1. **Never test directly on production** - Test locally first
2. **Backup database before schema changes**
3. **Deploy during low-traffic hours** (nights/weekends)
4. **Monitor after deployment** for at least 15 minutes
5. **Have rollback plan ready** (previous commit hash)
6. **Document all manual changes** (SQL scripts, env vars)
7. **Never commit sensitive data** (.env, secrets, keys)

---

## 📞 Emergency Contacts & Resources

- **Hostinger Support**: [Hostinger Help Center]
- **GitHub Repository**: https://github.com/samwumi/vclop
- **Database Access**: phpMyAdmin via Hostinger control panel
- **SSH Access**: `ssh u215495167@us-bos-web1461`

---

## 📝 Change Log

| Date | Change | Commit | Notes |
|------|--------|--------|-------|
| 2026-09-11 | Added document download endpoint | ca63f352 | Fixed "document not found" issue |
| 2026-09-11 | Added REQUEST_INFORMATION feature | 9861436f | Underwriters can request more info |
| 2026-09-11 | Fixed workflow validation | 78ef47b6 | Added to allowedActions in DB |
| 2026-09-11 | Added document requirements | 817baa7e | 8 document types seeded |

---

## ✅ Production Readiness Checklist

- [x] Database configured and migrated
- [x] Environment variables set
- [x] SMTP email configured
- [x] Storage directory created
- [x] File permissions set
- [x] Document requirements seeded
- [x] Workflow stages configured
- [x] SSL certificate installed
- [x] CORS configured for frontend
- [x] Auto-deployment from GitHub working

---

**Last Updated**: 2026-09-11
**Maintained By**: Development Team
