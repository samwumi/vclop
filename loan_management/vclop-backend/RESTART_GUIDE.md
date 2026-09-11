# 🔄 Backend Restart Guide

## 🚀 Quick Start Scripts

### **Option 1: Full Restart (Recommended)**
Stops backend → Builds → Starts

```powershell
cd loan_management\vclop-backend
.\restart-backend.ps1
```

**Use when:**
- ✅ You made code changes
- ✅ You want to ensure latest code is running
- ✅ After pulling from Git

---

### **Option 2: Quick Restart (No Build)**
Stops backend → Starts (no build)

```powershell
cd loan_management\vclop-backend
.\quick-restart.ps1
```

**Use when:**
- ✅ No code changes, just need to restart
- ✅ Backend is stuck/frozen
- ✅ Testing configuration changes only

---

## 📝 Manual Restart

### **Full Restart:**
```powershell
cd loan_management\vclop-backend

# Stop existing processes
Get-Process -Name node | Stop-Process -Force

# Build
npm run build

# Start
npm run start:dev
```

### **Quick Restart:**
```powershell
cd loan_management\vclop-backend

# Stop
Get-Process -Name node | Stop-Process -Force

# Start (no build)
npm run start:dev
```

---

## 🎯 When to Restart

### **MUST Restart:**
- ✅ After code changes in `src/` folder
- ✅ After pulling updates from Git
- ✅ After changing environment variables in `.env`
- ✅ After running database migrations
- ✅ After installing new npm packages

### **DON'T Need to Restart:**
- ❌ Changing frontend code (frontend hot-reloads)
- ❌ Editing documentation files (`.md`)
- ❌ Changing SQL scripts (run separately)
- ❌ Viewing logs

---

## 🐛 Troubleshooting

### **Error: "Port 3000 is already in use"**
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill that process
Stop-Process -Id <ProcessID> -Force

# Or kill all Node processes
Get-Process -Name node | Stop-Process -Force
```

### **Error: "Cannot run script"**
PowerShell execution policy blocking the script:

```powershell
# Allow running scripts (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
.\restart-backend.ps1
```

### **Backend Won't Start**
```powershell
# Check if XAMPP/MySQL is running
# Backend needs database connection

# Check .env file exists
Test-Path .env

# Check node_modules installed
Test-Path node_modules

# If missing, install dependencies
npm install
```

### **Build Errors**
```powershell
# Clean build and retry
Remove-Item -Recurse -Force dist
npm run build

# If still fails, reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

---

## 📊 Check Backend Status

### **Is Backend Running?**
```powershell
# Check Node processes
Get-Process -Name node -ErrorAction SilentlyContinue

# Check port 3000
Test-NetConnection -ComputerName localhost -Port 3000
```

### **View Backend Logs:**
Backend logs appear in the terminal where `npm run start:dev` is running.

Look for:
```
[Nest] 12345  - 09/09/2026, 2:30:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 09/09/2026, 2:30:01 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 09/09/2026, 2:30:02 PM     LOG [NestApplication] Nest application successfully started
```

---

## 🔐 Production Restart

For production server:

```bash
# If using PM2
pm2 restart vclop-backend

# If using systemd
sudo systemctl restart vclop-backend

# If using manual process
pkill node
cd /path/to/vclop-backend
npm run build
npm run start:prod &
```

---

## ⚙️ Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| **Full Restart** | `.\restart-backend.ps1` | Stop → Build → Start |
| **Quick Restart** | `.\quick-restart.ps1` | Stop → Start (no build) |
| **Build** | `npm run build` | Compile TypeScript to JavaScript |
| **Start Dev** | `npm run start:dev` | Start with hot-reload |
| **Start Prod** | `npm run start:prod` | Start production build |

---

## 💡 Pro Tips

1. **Use Full Restart after Git pull:**
   ```powershell
   git pull origin main
   .\restart-backend.ps1
   ```

2. **Keep a dedicated terminal for backend:**
   - Don't close the terminal running the backend
   - Makes it easier to see logs and restart

3. **Check logs after restart:**
   - Watch for compilation errors
   - Verify database connection
   - Check all modules loaded

4. **Use Ctrl+C to stop gracefully:**
   - Allows cleanup
   - Better than force-killing

---

## 🎬 Common Workflow

### **After Making Code Changes:**
```powershell
# Option A: Use script
.\restart-backend.ps1

# Option B: Manual
# 1. Press Ctrl+C in backend terminal
# 2. Run: npm run start:dev
```

### **After Git Pull:**
```powershell
git pull origin main
npm install  # If package.json changed
.\restart-backend.ps1
```

### **After Database Changes:**
```powershell
# Run migration/seed
npm run prisma:migrate:dev
# OR
npm run prisma:seed

# Then restart backend
.\restart-backend.ps1
```

---

**Created:** September 9, 2026  
**Last Updated:** September 9, 2026  
**Status:** ✅ Ready to use
