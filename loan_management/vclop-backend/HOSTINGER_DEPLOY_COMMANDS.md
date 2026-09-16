# 🚀 Hostinger Deployment Commands

## Step 1: Find Your Application

Run these commands one by one in your SSH session:

```bash
# Show where you are
pwd

# List everything in home directory
ls -la ~

# Check for domains folder
ls -la ~/domains 2>/dev/null || echo "No domains folder"

# Check for public_html
ls -la ~/public_html 2>/dev/null || echo "No public_html folder"

# Search for vclop-backend (this might take a moment)
find ~ -maxdepth 4 -name "vclop-backend" -type d 2>/dev/null
```

---

## Step 2: Once You Find the Path

Let's say your path is: `~/domains/verticalcapital.ng/vclop-backend`

Replace `[PATH]` below with your actual path:

```bash
# Navigate to your app
cd [PATH]/vclop-backend

# Example:
# cd ~/domains/verticalcapital.ng/vclop-backend

# Verify you're in the right place
ls -la

# You should see: package.json, src/, prisma/, etc.
```

---

## Step 3: Pull Latest Code

```bash
# Pull from GitHub
git pull origin main

# If that doesn't work, try:
git fetch origin
git reset --hard origin/main
```

---

## Step 4: Install Dependencies (if needed)

```bash
npm install
```

---

## Step 5: Find and Restart Your App

### Option A: If using PM2

```bash
# Find PM2
which pm2

# If not found, try:
~/.nvm/versions/node/*/bin/pm2 list

# Or:
npx pm2 list

# Restart
pm2 restart vclop-backend
# Or:
npx pm2 restart vclop-backend
```

### Option B: If using Node.js App Manager (Hostinger Panel)

1. Go to Hostinger hPanel
2. Click **Hosting** → **Manage**
3. Scroll to **Node.js Application**
4. Click **Restart** button

### Option C: If using systemd

```bash
sudo systemctl restart vclop-backend
```

### Option D: Manual restart

```bash
# Kill existing process
pkill -f "node.*vclop"

# Start again
npm run start:prod &
```

---

## Step 6: Check Logs

### If using PM2:
```bash
pm2 logs vclop-backend --lines 50
# Or:
npx pm2 logs vclop-backend --lines 50
```

### If logs are in a file:
```bash
# Common log locations
tail -f ~/logs/vclop-backend.log
tail -f ~/domains/*/logs/*.log
tail -f ~/.pm2/logs/*.log
```

---

## Quick Diagnostic Commands

```bash
# Check if app is running
ps aux | grep node | grep vclop

# Check which ports are in use
netstat -tulpn | grep node

# Check Node version
node --version

# Check if git repo is correct
git remote -v

# Check current git branch
git branch

# Check git status
git status
```

---

## If You Can't Find PM2

PM2 might be installed locally in the project:

```bash
# Try using npx
npx pm2 list
npx pm2 logs
npx pm2 restart all

# Or install it globally
npm install -g pm2
```

---

## Alternative: Use the Hostinger Panel

If SSH commands are confusing:

1. **Login to Hostinger hPanel**
2. Go to **Hosting** → Your domain
3. Click **Advanced** → **Node.js Application**
4. You should see your app listed
5. Click **Edit** or **Restart**
6. In the configuration, look for **Git** settings
7. Click **Pull from Git** or **Update from Repository**
8. Then click **Restart Application**

---

## Common Paths on Hostinger

Your app is likely in one of these:

- `~/domains/verticalcapital.ng/vclop-backend`
- `~/domains/api.verticalcapital.ng/vclop-backend`
- `~/public_html/vclop-backend`
- `~/repositories/vclop/loan_management/vclop-backend`
- `~/applications/vclop-backend`

---

## What to Look For

When you find the right directory, you should see:

```
✅ package.json
✅ src/ folder
✅ prisma/ folder
✅ node_modules/ folder
✅ .env file (or .env.production)
✅ dist/ folder (compiled code)
```

---

## Next: After Restart

Once restarted, test the password change OTP:

1. Go to your app: https://app.verticalcapital.ng
2. Request password change
3. Check email
4. Check logs for debug output:
   - Look for: `Generated OTP: 123456`
   - Look for: `Variables received: {...}`
   - Look for: `HTML contains placeholders: false`

---

## Need the Logs?

Send me the output from:
```bash
pm2 logs vclop-backend --lines 100
# Or whatever log command works for you
```

Look for lines starting with:
- `Generated OTP:`
- `Variables received:`
- `Compiled HTML`
