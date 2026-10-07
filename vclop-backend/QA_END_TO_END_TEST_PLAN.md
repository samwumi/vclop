# 🧪 VCLOP End-to-End Quality Assurance Test Plan

**Date:** October 3, 2026  
**Tester Role:** External Software Quality Assurance  
**System:** Vertical Capital Loan & Operations Platform (VCLOP)  
**Environment:** Production - https://verticalcapital.ng

---

## 📋 Test Scope

### **Modules to Test:**
1. Customer Registration & Management
2. Document Upload & Verification
3. Loan Application Creation
4. Compliance Review Workflow
5. Internal Control Approval
6. Loan Disbursement
7. Virtual Account Management
8. Repayment Recording
9. Permissions & Access Control
10. Data Security & NDPA Compliance

---

## 🎯 Test Objectives

- ✅ Verify complete customer-to-loan workflow
- ✅ Test all role-based permissions
- ✅ Validate data integrity and business rules
- ✅ Check error handling and validation
- ✅ Assess user experience and UI consistency
- ✅ Verify NDPA 2023 compliance features
- ✅ Test workflow state management
- ✅ Validate financial calculations

---

## 👥 Test Accounts Required

| Role | Email | Purpose |
|------|-------|---------|
| System Admin | (your admin account) | Full system access |
| Loan Officer | (loan officer account) | Customer & loan creation |
| Compliance Officer | (compliance account) | Document verification |
| Internal Control | (IC account) | Final approval & disbursement |
| Collections Officer | (collections account) | Repayment recording |
| Read-only User | (viewer account) | Permission boundary testing |

---

## 🧪 TEST SUITE 1: Customer Registration

### **Test Case 1.1: Valid Customer Registration**

**Priority:** Critical  
**Role:** Loan Officer

**Test Steps:**
1. Navigate to Customers → Add New Customer
2. Fill ALL required fields:
   - First Name: "Test"
   - Last Name: "Customer"
   - Phone: "08012345678" (unique)
   - BVN: "12345678901" (11 digits, unique)
   - NIN: "12345678901" (11 digits, unique)
   - ✅ Check "Data Processing Consent"
   - ✅ Check "Credit Bureau Consent"
3. Click "Register Customer"

**Expected Result:**
- ✅ Customer created successfully
- ✅ Customer Number generated (e.g., VC-000030)
- ✅ Status = `REGISTERED`
- ✅ BVN/NIN encrypted in database (check `bvnEncrypted`/`ninEncrypted` columns)
- ✅ Success message displayed
- ✅ Redirected to customer profile

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 1.2: Missing Required Fields**

**Priority:** High  
**Role:** Loan Officer

**Test Steps:**
1. Try to register customer WITHOUT BVN
2. Try to register WITHOUT NIN
3. Try to register WITHOUT consent checkboxes

**Expected Result:**
- ❌ "BVN is required" error shown
- ❌ "NIN is required" error shown
- ❌ "Data processing consent is required" error shown
- ❌ Form submission blocked

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 1.3: Duplicate Prevention**

**Priority:** High  
**Role:** Loan Officer

**Test Steps:**
1. Register a customer with phone: "08099999999"
2. Try to register another customer with same phone
3. Repeat for BVN and email

**Expected Result:**
- ❌ "Phone number already exists" error
- ❌ "BVN already registered" error
- ❌ "Email already exists" error

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 1.4: Customer Status Validation**

**Priority:** Critical  
**Role:** Database Check

**Test Steps:**
1. Register a new customer
2. Check database: `SELECT status FROM customers WHERE customerNumber = 'VC-XXXXX'`
3. Verify status is one of: REGISTERED, KYC_VERIFIED, ELIGIBLE, BLACKLISTED, DORMANT, INACTIVE
4. Try to set status to empty string via API (should be blocked by constraint)

**Expected Result:**
- ✅ Status = `REGISTERED`
- ❌ Cannot set status to empty string or invalid value
- ✅ Database constraint prevents invalid status

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 📄 TEST SUITE 2: Document Upload & Verification

### **Test Case 2.1: Document Upload**

**Priority:** Critical  
**Role:** Loan Officer

**Test Steps:**
1. Go to customer profile → Documents tab
2. Click "Upload Document"
3. Select document type: "Passport Photograph"
4. Upload a valid image file (< 10MB)
5. Click Upload

**Expected Result:**
- ✅ Document uploaded successfully
- ✅ File stored at: `uploads/customers/<customer-uuid>/documents/<file>.jpg`
- ✅ Document status = `PENDING`
- ✅ Document appears in list

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 2.2: File Size Validation**

**Priority:** High  
**Role:** Loan Officer

**Test Steps:**
1. Try to upload a file larger than 10MB

**Expected Result:**
- ❌ "File exceeds the 10MB upload limit" error

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 2.3: Document Verification by Compliance**

**Priority:** Critical  
**Role:** Compliance Officer

**Test Steps:**
1. Login as Compliance Officer
2. Go to customer with uploaded documents
3. Click "Verify" on a document
4. Select "Approved"
5. Submit

**Expected Result:**
- ✅ Document status changes to `VERIFIED`
- ✅ `verifiedById` and `verifiedAt` recorded in database
- ✅ Profile completion percentage updated

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 2.4: Document Rejection**

**Priority:** High  
**Role:** Compliance Officer

**Test Steps:**
1. Click "Verify" on a document
2. Select "Rejected"
3. Enter rejection reason: "Image not clear"
4. Submit

**Expected Result:**
- ✅ Document status = `REJECTED`
- ✅ Rejection reason stored
- ✅ Loan Officer can see rejection reason

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 2.5: View Document (Authentication)**

**Priority:** High  
**Role:** Compliance Officer

**Test Steps:**
1. Click on uploaded document to view
2. Check if document opens in new tab

**Expected Result:**
- ✅ Document loads successfully
- ✅ No 401 Authentication error
- ✅ No 404 File not found error

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 💰 TEST SUITE 3: Loan Application Creation

### **Test Case 3.1: Create Valid Loan Application**

**Priority:** Critical  
**Role:** Loan Officer

**Test Steps:**
1. Go to customer profile (must have at least 1 document uploaded)
2. Click "Apply for Loan"
3. Select loan product: "Personal Loan (24 Days)"
4. Enter amount: ₦100,000
5. Enter tenure: 24 days
6. Enter purpose: "Business expansion"
7. Add at least 1 guarantor (if product requires)
8. Submit application

**Expected Result:**
- ✅ Application created successfully
- ✅ Application Number generated (e.g., LA-000031)
- ✅ Status = `COMPLIANCE_REVIEW`
- ✅ Workflow instance created
- ✅ Workflow task assigned to Compliance
- ✅ Compliance Officers notified

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 3.2: Prevent Loan Without Documents**

**Priority:** Critical  
**Role:** Loan Officer

**Test Steps:**
1. Create a new customer (with NO documents uploaded)
2. Try to create loan application

**Expected Result:**
- ❌ "At least one document must be uploaded before applying for a loan" error
- ❌ Application creation blocked

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 3.3: Prevent Duplicate Active Loan**

**Priority:** High  
**Role:** Loan Officer

**Test Steps:**
1. Create a loan application for customer
2. Try to create another loan for same customer (before first is completed)

**Expected Result:**
- ❌ "Customer has an active loan application" error
- ❌ Second application blocked

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 3.4: Guarantor Requirement Validation**

**Priority:** High  
**Role:** Loan Officer

**Test Steps:**
1. Select a loan product that requires guarantor
2. Try to submit WITHOUT adding guarantor

**Expected Result:**
- ❌ "[Product Name] requires at least one guarantor" error
- ❌ Submission blocked

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 3.5: Loan Amount Limits**

**Priority:** Medium  
**Role:** Loan Officer

**Test Steps:**
1. Try to create loan with amount BELOW product minimum
2. Try to create loan with amount ABOVE product maximum

**Expected Result:**
- ❌ "Amount must be between ₦X and ₦Y" error

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## ✅ TEST SUITE 4: Compliance Review Workflow

### **Test Case 4.1: Compliance Approval - Happy Path**

**Priority:** Critical  
**Role:** Compliance Officer

**Test Steps:**
1. Login as Compliance Officer
2. Go to Compliance page
3. Open loan application in `COMPLIANCE_REVIEW` status
4. Verify at least 1 document is marked `APPROVED`
5. Click "Approve" on loan application
6. Add feedback: "All documents verified"
7. Submit

**Expected Result:**
- ✅ Loan status changes to `INTERNAL_CONTROL_REVIEW`
- ✅ Workflow moves to IC stage
- ✅ IC Officers notified
- ✅ Compliance feedback recorded

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 4.2: NEW - Block Approval Without Verified Documents**

**Priority:** Critical  
**Role:** Compliance Officer

**Test Steps:**
1. Open loan with documents in `PENDING` status (none approved yet)
2. Try to approve the loan application

**Expected Result:**
- ❌ "Cannot approve: No documents have been verified and approved" error
- ❌ Approval blocked
- ✅ Compliance must first approve at least 1 document

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 4.3: Request Changes from Compliance**

**Priority:** High  
**Role:** Compliance Officer

**Test Steps:**
1. Open loan in `COMPLIANCE_REVIEW`
2. Click "Request Changes"
3. Enter feedback: "Please upload clearer ID photo"
4. Submit

**Expected Result:**
- ✅ Loan status = `NEEDS_ATTENTION`
- ✅ Feedback sent to Loan Officer
- ✅ Loan Officer can see feedback
- ✅ Loan Officer can resubmit after fixing

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 4.4: Reject Loan at Compliance**

**Priority:** High  
**Role:** Compliance Officer

**Test Steps:**
1. Open loan in `COMPLIANCE_REVIEW`
2. Click "Reject"
3. Enter reason: "Fraudulent documents detected"
4. Submit

**Expected Result:**
- ✅ Loan status = `REJECTED`
- ✅ Rejection reason stored
- ✅ Loan Officer notified
- ✅ Application closed (cannot be reopened)

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 🛡️ TEST SUITE 5: Internal Control Review

### **Test Case 5.1: IC Approval**

**Priority:** Critical  
**Role:** Internal Control Officer

**Test Steps:**
1. Login as IC Officer
2. Go to Internal Control page
3. Open loan in `INTERNAL_CONTROL_REVIEW` status
4. Review customer profile, credit history
5. Click "Approve"
6. Submit

**Expected Result:**
- ✅ Loan status = `APPROVED`
- ✅ Loan ready for disbursement
- ✅ Customer may be updated to `ELIGIBLE` status
- ✅ Authorized users can see "Disburse" button

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 5.2: IC Rejection**

**Priority:** High  
**Role:** Internal Control Officer

**Test Steps:**
1. Open loan in `INTERNAL_CONTROL_REVIEW`
2. Click "Reject"
3. Enter reason: "Customer debt-to-income ratio too high"
4. Submit

**Expected Result:**
- ✅ Loan status = `REJECTED`
- ✅ Rejection reason recorded
- ✅ Application closed

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 💸 TEST SUITE 6: Loan Disbursement

### **Test Case 6.1: Successful Disbursement**

**Priority:** Critical  
**Role:** System Admin or IC with Disburse Permission

**Test Steps:**
1. Login as authorized user
2. Open loan in `APPROVED` status
3. Click "Approve Disbursement"
4. Confirm disbursement details
5. Submit

**Expected Result:**
- ✅ Loan record created with loanNumber (e.g., LN-000017)
- ✅ Loan status = `ACTIVE`
- ✅ Application status = `DISBURSED`
- ✅ Repayment schedule generated (installments)
- ✅ Virtual Account created automatically
- ✅ Disbursement transaction recorded
- ✅ Customer notified

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 6.2: Virtual Account Creation**

**Priority:** Critical  
**Role:** System Admin

**Test Steps:**
1. After disbursement, refresh loan page
2. Check Virtual Account section appears
3. Verify account number, bank name, status

**Expected Result:**
- ✅ Virtual Account section visible
- ✅ Account Number displayed (e.g., 9817385801)
- ✅ Bank: Wema Bank or PAYSTACK
- ✅ Status: ACTIVE
- ✅ Provider: PAYSTACK or LOCAL

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 6.3: Prevent Unauthorized Disbursement**

**Priority:** Critical  
**Role:** Loan Officer (without disburse permission)

**Test Steps:**
1. Login as Loan Officer
2. Open approved loan
3. Check if "Approve Disbursement" button exists

**Expected Result:**
- ❌ "Approve Disbursement" button NOT visible
- ❌ User cannot disburse without permission

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 6.4: Repayment Schedule Calculation**

**Priority:** High  
**Role:** System Admin

**Test Steps:**
1. After disbursement, go to Loan → Repayment Schedule
2. Verify installment count = tenure / frequency
3. Check principal + interest = total per installment
4. Verify all installments sum to correct total

**Expected Result:**
- ✅ Installments calculated correctly
- ✅ Each installment has: due date, principal, interest, total
- ✅ Status = `PENDING`
- ✅ Math checks out (no rounding errors)

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 🔄 TEST SUITE 7: Workflow State Management

### **Test Case 7.1: Workflow Instance Exists for All Loans**

**Priority:** Critical  
**Role:** Database Check

**Test Steps:**
1. Run SQL:
```sql
SELECT 
    la.applicationNumber,
    la.status,
    CASE WHEN wi.id IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END as workflow_status
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id
WHERE la.status IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED', 'REJECTED')
AND la.deletedAt IS NULL;
```

**Expected Result:**
- ✅ ALL loans show `✅ EXISTS`
- ❌ NO loans show `❌ MISSING`

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 7.2: Workflow Tasks Assigned**

**Priority:** High  
**Role:** Database Check

**Test Steps:**
1. Create a new loan application
2. Check: `SELECT * FROM workflow_tasks WHERE workflowInstanceId = '<instance-id>'`
3. Verify task exists with status = `PENDING`

**Expected Result:**
- ✅ Task created for current stage
- ✅ Task assigned to correct role
- ✅ Status = `PENDING`

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 💳 TEST SUITE 8: Repayment Recording

### **Test Case 8.1: Record Full Payment**

**Priority:** Critical  
**Role:** Collections Officer

**Test Steps:**
1. Go to loan with status = `ACTIVE`
2. Click on first installment (status = `PENDING`)
3. Click "Record Payment"
4. Enter full amount due
5. Enter payment method: "Bank Transfer"
6. Enter reference: "TXN123456"
7. Submit

**Expected Result:**
- ✅ Installment status = `PAID`
- ✅ Payment transaction recorded
- ✅ Loan balance reduced
- ✅ Next installment remains `PENDING`

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 8.2: Record Partial Payment**

**Priority:** High  
**Role:** Collections Officer

**Test Steps:**
1. Record payment less than full installment amount

**Expected Result:**
- ✅ Installment status = `PARTIALLY_PAID`
- ✅ Remaining balance calculated correctly
- ✅ Transaction recorded

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 8.3: Complete Loan Repayment**

**Priority:** High  
**Role:** Collections Officer

**Test Steps:**
1. Record payments for ALL installments
2. Pay the full loan amount

**Expected Result:**
- ✅ All installments status = `PAID`
- ✅ Loan status = `COMPLETED`
- ✅ Customer remains `ELIGIBLE`

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 8.4: Overdue Detection**

**Priority:** Medium  
**Role:** System Check

**Test Steps:**
1. Find a loan with installment past due date
2. Check installment status

**Expected Result:**
- ✅ Status should be `OVERDUE` (if system has automated check)
- OR manual marking by Collections Officer

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 🔐 TEST SUITE 9: Permissions & Access Control

### **Test Case 9.1: Loan Officer Permissions**

**Priority:** Critical  
**Role:** Loan Officer

**Test Steps:**
1. Login as Loan Officer
2. Try to access: Compliance page, IC page, Disbursement button

**Expected Result:**
- ✅ Can create customers
- ✅ Can upload documents
- ✅ Can create loan applications
- ✅ Can view OWN customers/loans
- ❌ CANNOT see Compliance page
- ❌ CANNOT see IC page
- ❌ CANNOT disburse loans
- ❌ CANNOT view other loan officers' customers (unless branch-wide permission)

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 9.2: Compliance Officer Permissions**

**Priority:** Critical  
**Role:** Compliance Officer

**Test Steps:**
1. Login as Compliance Officer
2. Check accessible pages

**Expected Result:**
- ✅ Can view ALL customers
- ✅ Can view ALL loan applications
- ✅ Can verify documents
- ✅ Can approve/reject at compliance stage
- ❌ CANNOT create customers/loans
- ❌ CANNOT disburse
- ❌ CANNOT record repayments

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 9.3: IC Officer Permissions**

**Priority:** Critical  
**Role:** Internal Control Officer

**Test Steps:**
1. Login as IC Officer
2. Check permissions

**Expected Result:**
- ✅ Can view ALL customers/loans
- ✅ Can approve/reject at IC stage
- ✅ Can disburse loans (if permission given)
- ❌ CANNOT create customers
- ❌ CANNOT upload documents
- ❌ CANNOT bypass compliance stage

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 9.4: System Admin Permissions**

**Priority:** High  
**Role:** System Admin

**Test Steps:**
1. Login as Admin
2. Check all features accessible

**Expected Result:**
- ✅ Can access ALL features
- ✅ Can see ALL data
- ✅ Can perform ALL actions
- ✅ Can manage users
- ✅ Can override workflow (if needed)

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 🔒 TEST SUITE 10: Data Security & NDPA Compliance

### **Test Case 10.1: BVN/NIN Encryption**

**Priority:** Critical  
**Role:** Database Check

**Test Steps:**
1. Register a new customer with BVN: "12345678901"
2. Check database:
```sql
SELECT bvn, bvnEncrypted, nin, ninEncrypted 
FROM customers 
WHERE customerNumber = 'VC-XXXXX';
```

**Expected Result:**
- ✅ `bvn` column has plain text (backward compatibility)
- ✅ `bvnEncrypted` column has encrypted value (format: `encrypted$iv$authTag`)
- ✅ Same for NIN
- ✅ Encrypted values are NOT readable

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 10.2: Consent Recording**

**Priority:** High  
**Role:** Database Check

**Test Steps:**
1. Register customer with consents checked
2. Check database:
```sql
SELECT 
    dataProcessingConsent,
    dataProcessingConsentDate,
    creditBureauConsent,
    creditBureauConsentDate
FROM customers 
WHERE customerNumber = 'VC-XXXXX';
```

**Expected Result:**
- ✅ `dataProcessingConsent` = 1
- ✅ `dataProcessingConsentDate` has timestamp
- ✅ `creditBureauConsent` = 1
- ✅ `creditBureauConsentDate` has timestamp

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 10.3: Sensitive Data Not Exposed in API**

**Priority:** Critical  
**Role:** API Check

**Test Steps:**
1. Make API call: GET `/customers/<id>`
2. Check JSON response

**Expected Result:**
- ❌ `bvnEncrypted` NOT in response
- ❌ `ninEncrypted` NOT in response
- ❌ Encryption keys NOT exposed
- ✅ Only decrypted BVN/NIN shown (if user has permission)

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 🧩 TEST SUITE 11: Edge Cases & Error Handling

### **Test Case 11.1: Empty Customer Status**

**Priority:** Critical  
**Role:** Database Check

**Test Steps:**
1. Try to set customer status to empty string:
```sql
UPDATE customers SET status = '' WHERE id = '<test-customer-id>';
```

**Expected Result:**
- ❌ "Check constraint 'chk_customer_status' is violated" error
- ❌ Update blocked by database constraint

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 11.2: Network Error Handling**

**Priority:** Medium  
**Role:** User

**Test Steps:**
1. Disconnect internet
2. Try to submit a form
3. Reconnect and retry

**Expected Result:**
- ❌ User-friendly error message shown
- ✅ Form data not lost
- ✅ Can retry after reconnection

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

### **Test Case 11.3: Session Timeout**

**Priority:** Medium  
**Role:** User

**Test Steps:**
1. Login and let session expire (wait 30+ minutes)
2. Try to perform an action

**Expected Result:**
- ❌ "Session expired" message
- ✅ Redirected to login
- ✅ Can login again and continue

**Actual Result:** _____________________

**Pass/Fail:** _____________________

---

## 📊 TEST SUMMARY REPORT

### **Critical Issues Found:**
1. _____________________
2. _____________________
3. _____________________

### **High Priority Issues:**
1. _____________________
2. _____________________

### **Medium/Low Issues:**
1. _____________________
2. _____________________

### **Overall Test Coverage:**
- **Total Test Cases:** 50+
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____
- **Pass Rate:** _____%

### **System Readiness:**
- [ ] **READY FOR PRODUCTION** - All critical tests passed
- [ ] **NEEDS FIXES** - Critical issues found
- [ ] **NOT READY** - Major functionality broken

---

## 🎯 Recommendations

### **Must Fix Before Production:**
1. _____________________
2. _____________________

### **Should Fix Soon:**
1. _____________________
2. _____________________

### **Nice to Have:**
1. _____________________
2. _____________________

---

## ✅ Sign-Off

**QA Tester:** _____________________  
**Date:** _____________________  
**Status:** [ ] Approved [ ] Rejected [ ] Conditional Approval

**Notes:**
_____________________
_____________________
_____________________

---

**End of Test Plan**
