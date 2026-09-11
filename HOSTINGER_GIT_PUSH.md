# 🚀 Push to Hostinger Git Repository

## 📋 Hostinger Git Setup

### **Step 1: Get Your Hostinger Git URL**

1. Login to **Hostinger hPanel**
2. Go to **Advanced** → **Git**
3. Find your repository
4. Copy the **Git Clone URL** (looks like this):
   ```
   ssh://u123456789@your-domain.com/~/public_html/
   # OR
   ssh://username@server-ip/home/username/repository
   ```

---

### **Step 2: Add Hostinger Remote**

```bash
cd "c:\Users\DELL\Downloads\loan_and_operation_management_phase6"

# Add Hostinger as remote origin
git remote add hostinger ssh://YOUR_USERNAME@YOUR_SERVER/path/to/repo

# Example:
# git remote add hostinger ssh://u123456789@yourdomain.com/~/repositories/vclop.git
```

---

### **Step 3: Push to Hostinger**

```bash
# Push to Hostinger
git push hostinger master

# OR if your branch is main:
git push hostinger main
```

---

## 🔑 SSH Key Authentication (Recommended)

If you don't have SSH key set up:

### **1. Generate SSH Key (if needed):**
```powershell
# In PowerShell
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

Press Enter to accept default location: `C:\Users\DELL\.ssh\id_rsa`

### **2. Copy Your Public Key:**
```powershell
Get-Content C:\Users\DELL\.ssh\id_rsa.pub | clip
```
(This copies your public key to clipboard)

### **3. Add to Hostinger:**
1. Go to Hostinger hPanel
2. **Advanced** → **SSH Access**
3. Click **Manage SSH Keys**
4. Paste your public key
5. Click **Add Key**

---

## 🔐 Alternative: Use Password Authentication

If SSH doesn't work, Hostinger might require password authentication:

```bash
# When prompted, enter your cPanel/hosting password
git push hostinger master
```

---

## 📂 Common Hostinger Git Paths

Hostinger typically uses these paths:

### **Option 1: Public HTML (Website root):**
```bash
git remote add hostinger ssh://username@server/~/public_html
```

### **Option 2: Repositories folder:**
```bash
git remote add hostinger ssh://username@server/~/repositories/vclop.git
```

### **Option 3: Specific app folder:**
```bash
git remote add hostinger ssh://username@server/~/domains/yourdomain.com/vclop-backend
```

---

## 🔍 Find Your Hostinger Git Details

### **Method 1: Hostinger hPanel**
1. Login to Hostinger
2. **Websites** → Select your site
3. **Advanced** → **Git**
4. Look for "Clone URL" or "Repository URL"

### **Method 2: SSH into Hostinger**
```bash
ssh username@your-server-ip
pwd  # Shows current directory
cd repositories  # Navigate to repositories
ls -la  # List repositories
```

---

## 🔧 If You Get "Permission Denied"

### **1. Check SSH connection:**
```bash
ssh username@your-server-ip
```

If this works, SSH is configured correctly.

### **2. Verify remote URL:**
```bash
cd "c:\Users\DELL\Downloads\loan_and_operation_management_phase6"
git remote -v
```

### **3. Update remote if needed:**
```bash
git remote set-url hostinger ssh://CORRECT_URL_HERE
```

---

## 📡 Alternative: FTP/SFTP Upload

If Git push doesn't work, you can upload via FTP:

### **Files to Upload:**
```
📁 loan_management/vclop-backend/
├── prisma/seed.ts (updated)
├── src/modules/loan-applications/ (updated files)
├── PRODUCTION_DOCUMENT_REQUIREMENTS.sql
├── *.md documentation files
└── .gitignore
```

### **Upload Using FileZilla or WinSCP:**
1. Host: `ftp.yourdomain.com` or Hostinger's SFTP server
2. Username: Your cPanel username
3. Password: Your cPanel password
4. Port: 21 (FTP) or 22 (SFTP)

---

## ✅ After Successful Push

Once pushed to Hostinger, you'll need to:

### **1. SSH into server:**
```bash
ssh username@your-server
cd /path/to/vclop-backend
```

### **2. Install dependencies:**
```bash
npm install
```

### **3. Run database updates:**
```bash
# Option A: Run SQL script
mysql -u your_db_user -p your_db_name < PRODUCTION_DOCUMENT_REQUIREMENTS.sql

# Option B: Run seed
npm run prisma:seed
```

### **4. Build and restart:**
```bash
npm run build
pm2 restart vclop-backend
# OR
systemctl restart vclop-backend
```

---

## 🆘 Common Issues

### **Issue 1: "Host key verification failed"**
```bash
ssh-keyscan your-server >> ~/.ssh/known_hosts
```

### **Issue 2: "Repository not found"**
Check if you need to initialize Git on Hostinger first:
```bash
ssh username@your-server
cd /path/to/your/app
git init --bare
```

### **Issue 3: "Permission denied (publickey)"**
Make sure your SSH key is added to Hostinger (see SSH Key Authentication above)

---

## 📞 Need Help?

**Contact Hostinger Support:**
- Live Chat available 24/7
- They can provide your exact Git URL
- Can help set up SSH access
- Can verify Git is enabled on your hosting

**Tell them:**
"I need to push my Node.js application to the server via Git. What's my Git repository URL?"

---

## 📝 Quick Command Summary

```bash
# Add Hostinger remote
git remote add hostinger ssh://username@server/path/to/repo

# Push
git push hostinger master

# Verify
git remote -v

# If needed, update URL
git remote set-url hostinger ssh://CORRECT_URL
```

---

**Current Commit Ready to Push:** `970695e8`  
**Branch:** `master`  
**Status:** ✅ Committed locally, waiting for remote URL

---

**Next Step:** Get your exact Hostinger Git URL from hPanel and push! 🚀
