# Seed Production Database from Local Machine

## 🎯 Quick Guide - Add Email Templates to Production

Since your production database is missing email templates, we'll seed it from your local computer.

---

## ✅ **Method 1: Direct Seed (Recommended)**

### **Step 1: Create Production .env file**

In `vclop/loan_management/vclop-backend/` create a file named `.env.production`:

```env
# Production Database Connection
DATABASE_URL="mysql://your_db_user:your_db_password@srv1461.hstgr.io:3306/your_database_name"

# Required for seed script
JWT_SECRET=your_production_jwt_secret
SEED_ADMIN_PASSWORD=skip_admin_creation
```

**Replace:**
- `your_db_user` → Your MySQL username
- `your_db_password` → Your MySQL password  
- `your_database_name` → Your database name
- `your_production_jwt_secret` → Your actual JWT secret from production

### **Step 2: Run Seed with Production Config**

```powershell
cd vclop/loan_management/vclop-backend

# Use production .env file
$env:DATABASE_URL="mysql://your_db_user:your_db_password@srv1461.hstgr.io:3306/your_database_name"

# Run seed
npm run prisma:seed
```

**What it does:**
- ✅ Adds all email templates (password reset, OTP, verification)
- ✅ Adds document types
- ✅ Adds notification templates
- ❌ Skips creating admin (if already exists)

---

## ✅ **Method 2: SQL Direct Insert (Faster)**

If seed doesn't work, insert templates directly via phpMyAdmin:

### **Step 1: Copy SQL Script**

I'll create a SQL script with all templates...

### **Step 2: Run in phpMyAdmin**

1. Hostinger Panel → Databases → phpMyAdmin
2. Select your database
3. Click **SQL** tab
4. Paste the SQL script
5. Click **Go**

---

## 📝 **Let me create the SQL script for you:**

Creating INSERT statements for all email templates...
