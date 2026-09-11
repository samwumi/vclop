# ⚡ Quick Deployment - Document Validation Fix

## 🎯 What This Does
Fixes the issue where officers can submit loan applications without uploading required documents.

---

## 🚀 Deploy in 3 Steps

### **Step 1: Upload SQL File to Production**
Upload `PRODUCTION_DOCUMENT_REQUIREMENTS.sql` to your production server.

### **Step 2: Run the SQL Script**

Choose ONE method:

#### **Method A: SSH Command Line**
```bash
mysql -u your_username -p vclop < PRODUCTION_DOCUMENT_REQUIREMENTS.sql
```

#### **Method B: phpMyAdmin**
1. Open phpMyAdmin
2. Select `vclop` database
3. Click "SQL" tab
4. Copy-paste entire SQL file contents
5. Click "Go"

#### **Method C: Inside MySQL Console**
```bash
mysql -u your_username -p vclop
```
Then inside MySQL:
```sql
source /path/to/PRODUCTION_DOCUMENT_REQUIREMENTS.sql;
```

### **Step 3: Verify**
```sql
SELECT COUNT(*) FROM loan_product_document_requirements;
```
**Expected result:** 8 (or more if you already had some)

---

## ✅ Expected Output

You should see:
```
✔ Quick Cash document requirements configured
✔ Business Growth document requirements configured
✅ DEPLOYMENT COMPLETE - Document validation now enforced!
```

And a table showing:
- **Quick Cash:** 3 required documents
- **Business Growth:** 5 required documents

---

## 🧪 Test It Works

1. Try to submit a loan application WITHOUT documents
2. Should get error: *"Customer is missing X verified document(s)..."*
3. ✅ **If you see this error, deployment succeeded!**

---

## 🔒 Safety

- ✅ Safe to run multiple times (uses INSERT IGNORE)
- ✅ No existing data affected
- ✅ No downtime required
- ✅ Can be rolled back if needed

---

## 📞 Problems?

**"Duplicate entry" error?**  
→ This is fine! Means requirements already exist.

**"Table doesn't exist" error?**  
→ Run database migrations first: `npx prisma migrate deploy`

**Script runs but nothing happens?**  
→ Check if loan products and document types exist in your database.

---

## 📋 What Gets Configured

### Quick Cash (30 Days) - 3 Documents:
- ✅ NIN Slip
- ✅ Passport Photograph  
- ✅ Selfie

### Business Growth (90 Days) - 5 Documents:
- ✅ NIN Slip
- ✅ CAC Certificate
- ✅ Passport Photograph
- ✅ Utility Bill
- ✅ Selfie

---

**That's it!** 🎉 Document validation is now enforced.

**More details?** See `PRODUCTION_DEPLOYMENT_GUIDE.md`
