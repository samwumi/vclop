# 🚀 Production Deployment Guide - Document Validation Fix

## 📋 Overview

This guide explains how to deploy the document validation fix to production **without running the seed script**. Instead, you'll run a SQL script directly in the production database.

---

## ⚠️ Prerequisites

Before starting:
- ✅ Access to production database (MySQL/MariaDB)
- ✅ Database credentials (username/password)
- ✅ Backup of production database (recommended)
- ✅ `PRODUCTION_DOCUMENT_REQUIREMENTS.sql` file

---

## 🎯 Deployment Steps

### **Option 1: Command Line (Recommended)**

If you have SSH access to production server:

```bash
# 1. Connect to production server
ssh user@your-production-server

# 2. Navigate to the backend directory
cd /path/to/vclop-backend

# 3. Run the SQL script
mysql -u your_db_user -p vclop < PRODUCTION_DOCUMENT_REQUIREMENTS.sql

# Enter database password when prompted
```

**Expected Output:**
```
=== CURRENT LOAN PRODUCTS ===
=== CURRENT DOCUMENT TYPES ===
=== EXISTING DOCUMENT REQUIREMENTS (BEFORE) ===
✔ Quick Cash document requirements configured
✔ Business Growth document requirements configured
=== DOCUMENT REQUIREMENTS CONFIGURED (AFTER) ===
=== SUMMARY ===
✅ DEPLOYMENT COMPLETE - Document validation now enforced!
```

---

### **Option 2: phpMyAdmin (Web Interface)**

If you use phpMyAdmin or similar web interface:

1. **Login to phpMyAdmin** on production server
2. **Select the `vclop` database** from the left sidebar
3. **Click the "SQL" tab** at the top
4. **Copy the entire contents** of `PRODUCTION_DOCUMENT_REQUIREMENTS.sql`
5. **Paste into the SQL query box**
6. **Click "Go" or "Execute"**
7. **Verify the results** show 8 requirements configured

---

### **Option 3: MySQL Workbench**

If you use MySQL Workbench:

1. **Connect to production database**
2. **Open the SQL script:**
   - File → Open SQL Script
   - Select `PRODUCTION_DOCUMENT_REQUIREMENTS.sql`
3. **Execute the script** (Lightning bolt icon or Ctrl+Shift+Enter)
4. **Check the output panel** for success messages

---

### **Option 4: Manual Database Connection**

If you have direct database access:

```bash
# Connect to production database
mysql -h production-db-host -u username -p -D vclop

# Once connected, source the file
mysql> source /path/to/PRODUCTION_DOCUMENT_REQUIREMENTS.sql;

# Or copy-paste the SQL commands manually
```

---

## ✅ Verification

After running the script, verify it worked:

### **Check 1: Count Requirements**
```sql
SELECT COUNT(*) AS total 
FROM loan_product_document_requirements;
```
**Expected:** At least 8 rows (3 for Quick Cash + 5 for Business Growth)

### **Check 2: View Requirements**
```sql
SELECT 
  lp.name AS product,
  dt.name AS document,
  lpdr.isRequired AS required
FROM loan_products lp
JOIN loan_product_document_requirements lpdr ON lp.id = lpdr.loanProductId
JOIN document_types dt ON lpdr.documentTypeId = dt.id
ORDER BY lp.name, dt.name;
```

**Expected Output:**
```
+--------------------------------+---------------------+----------+
| product                        | document            | required |
+--------------------------------+---------------------+----------+
| Business Growth Loan (90 Days) | CAC Certificate     |        1 |
| Business Growth Loan (90 Days) | NIN Slip            |        1 |
| Business Growth Loan (90 Days) | Passport Photograph |        1 |
| Business Growth Loan (90 Days) | Selfie              |        1 |
| Business Growth Loan (90 Days) | Utility Bill        |        1 |
| Quick Cash (30 Days)           | NIN Slip            |        1 |
| Quick Cash (30 Days)           | Passport Photograph |        1 |
| Quick Cash (30 Days)           | Selfie              |        1 |
+--------------------------------+---------------------+----------+
```

### **Check 3: Test in Application**
1. Login as a loan officer
2. Create a new loan application
3. Try to submit WITHOUT uploading documents
4. **Expected:** Error message: *"Customer is missing X verified document(s) required by [Product Name]"*

---

## 🔄 If Something Goes Wrong

### **Problem: Script fails with "Duplicate entry" error**
**Solution:** This is actually fine! It means requirements already exist. The script uses `INSERT IGNORE` so it won't create duplicates.

### **Problem: "Unknown column" error**
**Solution:** Your database schema might be outdated. Run migrations first:
```bash
npx prisma migrate deploy
```

### **Problem: No loan products found**
**Solution:** Make sure loan products exist in the database:
```sql
SELECT * FROM loan_products;
```
If empty, you need to seed loan products first.

### **Problem: No document types found**
**Solution:** Make sure document types exist:
```sql
SELECT * FROM document_types;
```
If empty, you need to seed document types first.

---

## 🔙 Rollback (If Needed)

If you need to undo this change:

```sql
-- Remove all document requirements
DELETE FROM loan_product_document_requirements;

-- Or remove specific product requirements
DELETE FROM loan_product_document_requirements 
WHERE loanProductId IN (
  SELECT id FROM loan_products WHERE code IN ('quick-cash-30', 'business-growth-90')
);
```

**⚠️ Warning:** Only rollback if absolutely necessary. This will allow officers to submit applications without documents again.

---

## 📊 What This Changes

### **Before Deployment:**
- ❌ Officers can submit loan applications without any documents
- ❌ No validation of customer documentation
- ❌ `loan_product_document_requirements` table is empty

### **After Deployment:**
- ✅ Officers MUST upload required documents before submission
- ✅ Documents must be VERIFIED by admin
- ✅ Clear error messages guide the process
- ✅ 8 document requirements configured in database

---

## 🎯 Impact on Users

### **Loan Officers:**
- Must ensure customers upload ALL required documents
- Documents must be verified by admin before submission
- Will see clear error messages if documents are missing

### **Admins:**
- Must verify customer documents (change status to VERIFIED)
- Can see which documents are required for each loan product
- Rejection reasons can be added for rejected documents

### **Customers:**
- Must provide proper documentation before loan approval
- Will be notified when documents are verified/rejected
- Better loan processing with complete documentation

---

## 📞 Support

If you encounter issues:

1. **Check the SQL output** - it shows exactly what was configured
2. **Verify database connection** - make sure you're connected to the right database
3. **Check permissions** - ensure database user has INSERT privileges
4. **Review logs** - check application logs for any errors
5. **Test in staging first** - if you have a staging environment, test there first

---

## 📝 Post-Deployment Checklist

- [ ] SQL script executed successfully
- [ ] 8 document requirements in database
- [ ] Verification queries show correct data
- [ ] Test loan submission without documents (should fail)
- [ ] Test loan submission with all documents (should succeed)
- [ ] Inform loan officers about the change
- [ ] Update user documentation/training materials
- [ ] Monitor for any issues in first 24-48 hours

---

## 🔒 Security Notes

- ✅ Script uses `INSERT IGNORE` - safe to run multiple times
- ✅ No data deletion - only adds new requirements
- ✅ No impact on existing loan applications
- ✅ No downtime required
- ✅ Reversible if needed

---

## 📅 Deployment Information

- **Script Name:** `PRODUCTION_DOCUMENT_REQUIREMENTS.sql`
- **Database:** `vclop`
- **Tables Modified:** `loan_product_document_requirements`
- **Rows Added:** 8 (3 for Quick Cash + 5 for Business Growth)
- **Breaking Changes:** None (only adds validation)
- **Downtime Required:** None
- **Rollback Available:** Yes

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ SQL script runs without errors
2. ✅ 8 rows in `loan_product_document_requirements` table
3. ✅ Loan submission fails without verified documents
4. ✅ Loan submission succeeds with all verified documents
5. ✅ Error messages are clear and helpful

---

**Need Help?** Review the `DOCUMENT_VALIDATION_FIX.md` file for technical details about how the validation works.

**Date Prepared:** September 9, 2026  
**Version:** 1.0  
**Status:** Ready for Production Deployment
