# 🚨 URGENT: Manual Frontend Deployment

The frontend is NOT auto-deploying. You need to manually trigger deployment.

## Option 1: Via Hostinger Panel (Easiest)

1. **Login**: https://hpanel.hostinger.com
2. **Go to**: Websites → verticalcapital.ng → Manage
3. **Find**: Git or GitHub integration section
4. **Click**: "Pull Changes" or "Deploy" or "Sync Repository"

**Look for buttons like:**
- Pull from Git
- Deploy Now
- Sync Repository
- Update from GitHub

---

## Option 2: Build Locally and Upload

### Step 1: Build on Your PC
```powershell
cd "c:\Users\DELL\Documents\loan_and_operation_management_phase6\vclop\vclop-frontend"

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with compiled files.

### Step 2: Upload to Hostinger

**Using File Manager:**
1. Login to Hostinger hPanel
2. Click **File Manager**
3. Navigate to your frontend directory (usually `public_html` or `domains/verticalcapital.ng/public_html`)
4. **Delete all old files** (index.html, assets folder, etc.)
5. **Upload everything from your local `dist` folder**

**Using FTP (FileZilla/WinSCP):**
1. Connect to: `ftp.verticalcapital.ng` (or your server IP)
2. Port: 21 (FTP) or 22 (SFTP)
3. Username: Your cPanel username
4. Password: Your cPanel password
5. Navigate to `public_html` (or wherever your frontend is)
6. Delete old files
7. Upload everything from `dist` folder

---

## Option 3: Check GitHub Integration

### In Hostinger Panel:
1. Go to **Git Version Control** or **GitHub Integration**
2. Check if repository is connected
3. Check if auto-deployment is enabled
4. If not, **connect your GitHub repo**:
   - Repository: `samwumi/vclop`
   - Branch: `main`
   - Path: `vclop-frontend`
   - Enable auto-deploy on push

---

## How to Verify Deployment Worked

After deploying:

1. **Clear browser cache** or use incognito/private mode
2. **Go to customer edit page**
3. **Open browser console** (F12)
4. **Look for new logs**:
   - `DEBUG: filteredBanks.length = 35`
   - Should see a yellow debug box in dropdown

5. **Check file hash**:
   - Console should show different JS file (not `index-9DtsG_8y.js`)
   - New hash means new deployment

---

## Still Not Working?

### Check These:

1. **Is there a separate frontend app in Hostinger?**
   - Some setups have backend + frontend as separate apps
   - Check if frontend has its own subdomain

2. **Is frontend served by the backend?**
   - Some setups serve frontend from backend's `public` folder
   - In that case, backend needs to be redeployed

3. **Check .gitignore**:
   - Make sure `dist` folder is in `.gitignore`
   - Make sure source files (`src/*`) are NOT ignored

4. **Verify files are in GitHub**:
   - Go to: https://github.com/samwumi/vclop
   - Check: `vclop-frontend/src/components/ui/BankSelect.tsx`
   - Should see the inline banks array (starting line ~10)

---

## Contact Hostinger Support

If nothing works, contact Hostinger support:

**Tell them:**
"I pushed code to my GitHub repo but my website is not updating. How do I trigger a deployment? Is auto-deploy enabled on my account?"

**They can:**
- Check if GitHub integration is working
- Manually trigger deployment
- Show you where the deploy button is

---

## Quick Test

To confirm GitHub has the latest code:

```powershell
cd "c:\Users\DELL\Documents\loan_and_operation_management_phase6\vclop"
git log --oneline -1
```

Should show: `a0ff30d0 debug: add simple bank list test and filteredBanks count display`

If yes, code is in GitHub. Problem is with Hostinger not pulling it.
