# 🚀 Production Deployment Checklist

## ✅ Code Pushed Successfully!

**Commit:** `676dcf5d`  
**Branch:** `main`  
**Files Changed:** 86 files, 24,580 insertions

---

## 📋 Pre-Deployment Checklist

### 1. **Database Migrations** (CRITICAL - Do This First!)

#### Step 1.1: Run HR Module Migration
```bash
# Connect to production database
mysql -h srv1461.hstgr.io -u u215495167_vclop -p u215495167_vclop

# Run the migration
source vclop-backend/migrations/HR_MODULE_MIGRATION.sql;

# Verify tables were created
source vclop-backend/migrations/HR_MODULE_VERIFY.sql;
```

**Expected Output:**
- 15 new tables created
- All verification queries return expected counts

#### Step 1.2: Run Permission Setup Scripts
```bash
# Staff Loan Permissions
cd vclop-backend
npx ts-node src/scripts/setup-staff-loan-permissions.ts

# HR Module Permissions (if needed)
mysql -h srv1461.hstgr.io -u u215495167_vclop -p u215495167_vclop < ADD_HR_PERMISSIONS_SIMPLE.sql
```

**Expected Output:**
- 9 staff loan permissions created
- Permissions assigned to roles
- HR permissions added

---

### 2. **Pull Latest Code on Production Server**

```bash
# SSH into production server
ssh user@your-production-server

# Navigate to project directory
cd /path/to/vclop

# Pull latest code
git pull origin main

# Verify you have the latest commit
git log -1
# Should show: feat: Add HR Module & Daily Transactions Page (676dcf5d)
```

---

### 3. **Backend Deployment**

#### Step 3.1: Install Dependencies
```bash
cd vclop-backend
npm install
```

#### Step 3.2: Generate Prisma Client
```bash
npx prisma generate
```

#### Step 3.3: Build Backend
```bash
npm run build
```

**Expected Output:**
- Build completes without errors
- `dist/` folder created with compiled files

#### Step 3.4: Restart Backend Service
```bash
# Option A: Using PM2
pm2 restart vclop-backend

# Option B: Using systemd
sudo systemctl restart vclop-backend

# Option C: Direct
npm run start:prod
```

#### Step 3.5: Verify Backend is Running
```bash
# Check backend health
curl https://your-domain.com/api/health

# Check new endpoints
curl https://your-domain.com/api/hr/staff-loans/eligibility -H "Authorization: Bearer YOUR_TOKEN"
curl https://your-domain.com/api/transactions/daily -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. **Frontend Deployment**

#### Step 4.1: Install Dependencies
```bash
cd vclop-frontend
npm install
```

#### Step 4.2: Build Frontend
```bash
npm run build
```

**Expected Output:**
- Build completes successfully
- `dist/` folder created with optimized files

#### Step 4.3: Deploy Built Files
```bash
# Option A: Copy to backend public folder (if using integrated deployment)
cp -r dist/* ../vclop-backend/public/

# Option B: Deploy to separate web server
# Copy dist/ contents to your web server root
```

#### Step 4.4: Restart Web Server (if needed)
```bash
# Nginx
sudo systemctl restart nginx

# Apache
sudo systemctl restart apache2
```

---

### 5. **Post-Deployment Verification**

#### ✅ Check Backend API Endpoints

```bash
# Test HR endpoints
curl https://your-domain.com/api/hr/staff-loans/eligibility
curl https://your-domain.com/api/hr/leaves/balance
curl https://your-domain.com/api/hr/resources/my-resources

# Test Transactions endpoint
curl https://your-domain.com/api/transactions/daily?startDate=2024-11-13
```

#### ✅ Check Frontend Pages

1. Open browser: `https://your-domain.com`
2. Login with valid credentials
3. Check navigation sidebar - should see:
   - **Operations → Daily Transactions** ✅
   - **HR & Staff → My Loans** ✅
4. Navigate to each new page:
   - `/transactions` - Daily Transactions page loads
   - `/hr/staff-loans/my-loans` - Staff Loans page loads
   - `/hr/staff-loans/apply` - Application form loads

#### ✅ Test Core Functionality

**Staff Loans:**
1. Go to "My Loans"
2. Click "Apply for Loan"
3. Check eligibility is calculated
4. Fill form and submit (if eligible)
5. Verify application appears in list

**Daily Transactions:**
1. Go to "Daily Transactions"
2. Verify summary cards show data
3. Test date range filter
4. Test type filter (VA/Manual)
5. Verify transactions table loads

---

### 6. **Database Verification Queries**

Run these queries to verify data integrity:

```sql
-- Check HR tables exist
SHOW TABLES LIKE '%staff_loan%';
SHOW TABLES LIKE '%leave%';
SHOW TABLES LIKE '%offboarding%';
SHOW TABLES LIKE '%resource%';

-- Check staff loan permissions
SELECT name, description 
FROM Permission 
WHERE name LIKE 'STAFF_LOANS:%';

-- Check if any users have employment records
SELECT COUNT(*) as employment_count 
FROM employment_periods;

-- Check virtual account transactions (for Daily Transactions page)
SELECT COUNT(*) as va_transactions_count 
FROM virtual_account_transactions 
WHERE DATE(receivedAt) = CURDATE();

-- Check manual repayments
SELECT COUNT(*) as manual_repayments_count 
FROM repayment_transactions 
WHERE DATE(createdAt) = CURDATE();
```

---

### 7. **Monitoring & Logging**

#### Check Application Logs

```bash
# Backend logs
pm2 logs vclop-backend

# Or if using systemd
journalctl -u vclop-backend -f

# Check for errors
grep "error" /path/to/logs/backend.log
```

#### Check Web Server Logs

```bash
# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check for 404s or 500s
sudo grep "500\|404" /var/log/nginx/access.log | tail -20
```

---

### 8. **Performance Checks**

```bash
# Check backend response time
time curl https://your-domain.com/api/hr/staff-loans/eligibility

# Check frontend load time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Check database connections
mysql -h srv1461.hstgr.io -u u215495167_vclop -p -e "SHOW PROCESSLIST;"
```

---

## 🚨 Rollback Plan (If Needed)

### If something goes wrong:

#### 1. Rollback Code
```bash
cd /path/to/vclop
git revert 676dcf5d
git push origin main
```

#### 2. Rollback Database
```bash
mysql -h srv1461.hstgr.io -u u215495167_vclop -p u215495167_vclop < vclop-backend/migrations/HR_MODULE_ROLLBACK.sql
```

#### 3. Rebuild and Restart
```bash
# Backend
cd vclop-backend
npm run build
pm2 restart vclop-backend

# Frontend
cd vclop-frontend
npm run build
# Redeploy dist folder
```

---

## 📊 Success Criteria

Deployment is successful when:

- ✅ Backend compiles with 0 errors
- ✅ Backend starts without errors
- ✅ All API endpoints respond (200 status)
- ✅ Frontend builds successfully
- ✅ Frontend loads without errors
- ✅ Navigation shows new menu items
- ✅ All new pages are accessible
- ✅ Database tables created successfully
- ✅ Permissions set up correctly
- ✅ No console errors in browser
- ✅ No 500 errors in backend logs
- ✅ Staff can apply for loans
- ✅ Daily transactions page shows data

---

## 🔧 Troubleshooting

### Problem: Backend won't start

**Check:**
```bash
# Check if port is in use
sudo netstat -tulpn | grep 3000

# Check environment variables
cat .env | grep DATABASE_URL

# Check Prisma client
npx prisma generate
```

### Problem: Frontend shows blank page

**Check:**
```bash
# Browser console (F12) for errors
# Check if API_URL is correct in frontend config
# Verify dist/index.html exists
ls -la vclop-frontend/dist/
```

### Problem: Database connection fails

**Check:**
```bash
# Test database connection
mysql -h srv1461.hstgr.io -u u215495167_vclop -p

# Check if database has new tables
USE u215495167_vclop;
SHOW TABLES;
```

### Problem: Permissions not working

**Run:**
```bash
cd vclop-backend
npx ts-node src/scripts/setup-staff-loan-permissions.ts
```

### Problem: Routes not found (404)

**Check:**
1. Frontend build includes new routes
2. Web server config allows SPA routing
3. Nginx config has `try_files $uri $uri/ /index.html;`

---

## 📱 User Communication

### Notify Users:

**Email/Slack Message:**
```
🚀 New Features Deployed!

We've just deployed major updates to the VCLOP platform:

✅ HR Module
   - Staff Loans: Apply for loans with 0% interest
   - Leave Management: Request and track leave
   - Resource Management: Track ownership & delegations

✅ Daily Transactions Page
   - View all repayments in one place
   - Filter by VA or Manual payments
   - Real-time transaction tracking

Check the sidebar for new menu items:
- Operations → Daily Transactions
- HR & Staff → My Loans

If you experience any issues, please contact support.
```

---

## ✅ Final Checklist

Before marking deployment complete:

- [ ] Code pulled to production server
- [ ] Database migrations run successfully
- [ ] Permissions created
- [ ] Dependencies installed (backend & frontend)
- [ ] Backend built successfully
- [ ] Frontend built successfully
- [ ] Backend service restarted
- [ ] Web server restarted (if needed)
- [ ] API endpoints tested and responding
- [ ] Frontend pages load correctly
- [ ] Navigation menu updated
- [ ] Test transactions visible on Daily Transactions page
- [ ] Staff loan application tested
- [ ] No errors in backend logs
- [ ] No errors in browser console
- [ ] Users notified of new features
- [ ] Documentation updated

---

## 🎉 Deployment Complete!

Once all checks pass, your HR Module and Daily Transactions features are live in production!

**Deployed Features:**
- ✅ Staff Loans (Complete workflow)
- ✅ Leave Management (Applications & tracking)
- ✅ Offboarding (Clearance process)
- ✅ Resource Management (Delegation system)
- ✅ Daily Transactions (Unified repayment view)

**Next Steps:**
1. Monitor logs for first 24 hours
2. Gather user feedback
3. Address any issues promptly
4. Plan next iteration based on usage

---

**Deployment Date:** _________  
**Deployed By:** _________  
**Verified By:** _________

---

## 📞 Support Contacts

- **Technical Issues:** Your dev team
- **Database Issues:** DBA
- **User Training:** HR team
- **Emergency Rollback:** Senior dev + DevOps

---

**Good luck with the deployment!** 🚀
