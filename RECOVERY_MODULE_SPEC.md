# VCLOP Loan Recovery Management Module - Technical Specification

## 1. Overview

A dedicated loan recovery management system to track historical loans (disbursed outside VCLOP) and VCLOP-originated defaulted loans, manage recovery operations, and monitor collection performance.

## 2. Key Design Decisions

### 2.1 Loan Classification
- **LEGACY**: Loans disbursed outside VCLOP (historical)
- **VCLOP**: Loans originated through VCLOP that became defaulted

### 2.2 Data Sources
- **Historical loans**: Excel spreadsheet imports
- **VCLOP defaulted loans**: Automatic entry when loan status becomes DEFAULTED

### 2.3 Recovery Team
- Both dedicated recovery officers AND existing loan officers can handle recovery
- Officers can be assigned multiple accounts
- Accounts can be reassigned between officers

### 2.4 Payment Channels
- Multiple payment channels supported
- All payments must be verified before updating balances
- Verification required from authorized personnel

## 3. Database Schema (Prisma Models)

### 3.1 Recovery Account
Represents a loan account in recovery.

```prisma
model RecoveryAccount {
  id                    String                @id @default(uuid()) @db.VarChar(36)
  accountNumber         String                @unique @db.VarChar(20)
  
  // Classification
  source                RecoverySource        @default(LEGACY) // LEGACY or VCLOP
  vcloplLoanId          String?               @db.VarChar(36)  // If source is VCLOP
  
  // Customer information
  customerId            String?               @db.VarChar(36)  // Link to existing customer if available
  customerName          String                @db.VarChar(200)
  customerPhone         String                @db.VarChar(20)
  customerEmail         String?               @db.VarChar(150)
  customerAddress       String?               @db.Text
  
  // Loan details
  originalPrincipal     Decimal               @db.Decimal(14, 2)
  disbursementDate      DateTime              @db.Date
  originalReference     String?               @db.VarChar(100)
  
  // Financial tracking
  historicalRepayments  Decimal               @default(0) @db.Decimal(14, 2)
  outstandingBalance    Decimal               @db.Decimal(14, 2)
  recoveredAmount       Decimal               @default(0) @db.Decimal(14, 2)
  lastPaymentDate       DateTime?
  lastPaymentAmount     Decimal?              @db.Decimal(14, 2)
  
  // Assignment
  assignedOfficerId     String?               @db.VarChar(36)
  assignedDate          DateTime?
  branchId              String?               @db.VarChar(36)
  
  // Status
  status                RecoveryStatus        @default(ASSIGNED)
  ageing                RecoveryAgeing?       // Computed based on disbursementDate
  
  // Metadata
  notes                 String?               @db.Text
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  createdById           String                @db.VarChar(36)
  
  // Relations
  customer              Customer?             @relation(fields: [customerId], references: [id])
  vcloplLoan            Loan?                 @relation(fields: [vcloplLoanId], references: [id])
  assignedOfficer       User?                 @relation(fields: [assignedOfficerId], references: [id])
  branch                Branch?               @relation(fields: [branchId], references: [id])
  activities            RecoveryActivity[]
  payments              RecoveryPayment[]
  promises              RepaymentPromise[]
  documents             RecoveryDocument[]
  
  @@index([accountNumber])
  @@index([customerId])
  @@index([assignedOfficerId])
  @@index([status])
  @@index([source])
  @@map("recovery_accounts")
}

enum RecoverySource {
  LEGACY  // Historical loans from outside VCLOP
  VCLOP   // Defaulted loans from VCLOP system
}

enum RecoveryStatus {
  PENDING_VERIFICATION  // Balance needs verification
  ASSIGNED              // Assigned to recovery officer
  IN_PROGRESS           // Active recovery efforts
  PROMISE_ACTIVE        // Customer made payment promise
  LEGAL_ACTION          // Escalated to legal
  PARTIALLY_RECOVERED   // Some payments received
  FULLY_RECOVERED       // All debt collected
  WRITTEN_OFF           // Formally written off
  CLOSED                // Case closed
}

enum RecoveryAgeing {
  RECENT              // 0-30 days
  EARLY_DELINQUENT    // 31-90 days
  DELINQUENT          // 91-180 days
  SERIOUS_DELINQUENT  // 181-365 days
  LONG_TERM           // Over 365 days
}
```

### 3.2 Recovery Activity
Tracks all recovery actions (calls, visits, negotiations).

```prisma
model RecoveryActivity {
  id                String            @id @default(uuid()) @db.VarChar(36)
  accountId         String            @db.VarChar(36)
  activityType      ActivityType
  activityDate      DateTime          @default(now())
  
  // Activity details
  contactMethod     ContactMethod?
  contactOutcome    ContactOutcome?
  notes             String?           @db.Text
  nextFollowupDate  DateTime?
  
  // Location (for field visits)
  latitude          Decimal?          @db.Decimal(10, 8)
  longitude         Decimal?          @db.Decimal(11, 8)
  visitAddress      String?           @db.VarChar(500)
  
  // Recording
  recordedById      String            @db.VarChar(36)
  createdAt         DateTime          @default(now())
  
  // Relations
  account           RecoveryAccount   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  recordedBy        User              @relation(fields: [recordedById], references: [id])
  
  @@index([accountId])
  @@index([activityType])
  @@index([activityDate])
  @@map("recovery_activities")
}

enum ActivityType {
  PHONE_CALL
  SMS_SENT
  EMAIL_SENT
  FIELD_VISIT
  OFFICE_VISIT
  NEGOTIATION
  PROMISE_RECEIVED
  LEGAL_NOTICE
  OTHER
}

enum ContactMethod {
  PHONE
  SMS
  EMAIL
  IN_PERSON
  WHATSAPP
}

enum ContactOutcome {
  CONTACTED          // Successfully reached customer
  NO_ANSWER          // Customer didn't answer
  WRONG_NUMBER       // Number invalid
  PROMISED_PAYMENT   // Customer committed to pay
  REFUSED_TO_PAY     // Customer declined
  PARTIAL_AGREEMENT  // Negotiation in progress
  HOSTILE            // Customer was hostile
  NOT_FOUND          // Customer not at address
}
```

### 3.3 Recovery Payment
Tracks all payments with verification workflow.

```prisma
model RecoveryPayment {
  id                String            @id @default(uuid()) @db.VarChar(36)
  accountId         String            @db.VarChar(36)
  
  // Payment details
  amount            Decimal           @db.Decimal(14, 2)
  paymentDate       DateTime
  paymentMethod     String            @db.VarChar(50)
  reference         String?           @db.VarChar(100)
  
  // Verification
  status            PaymentStatus     @default(PENDING_VERIFICATION)
  recordedById      String            @db.VarChar(36)
  verifiedById      String?           @db.VarChar(36)
  verifiedAt        DateTime?
  verificationNotes String?           @db.Text
  
  // Evidence
  receiptPath       String?           @db.VarChar(500)
  
  // Metadata
  notes             String?           @db.Text
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  account           RecoveryAccount   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  recordedBy        User              @relation("PaymentRecordedBy", fields: [recordedById], references: [id])
  verifiedBy        User?             @relation("PaymentVerifiedBy", fields: [verifiedById], references: [id])
  
  @@index([accountId])
  @@index([status])
  @@index([paymentDate])
  @@map("recovery_payments")
}

enum PaymentStatus {
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
}
```

### 3.4 Repayment Promise
Tracks customer commitments to pay.

```prisma
model RepaymentPromise {
  id                String            @id @default(uuid()) @db.VarChar(36)
  accountId         String            @db.VarChar(36)
  
  // Promise details
  promisedAmount    Decimal           @db.Decimal(14, 2)
  promisedDate      DateTime          @db.Date
  promiseNotes      String?           @db.Text
  
  // Status tracking
  status            PromiseStatus     @default(ACTIVE)
  actualPaidAmount  Decimal?          @db.Decimal(14, 2)
  actualPaidDate    DateTime?
  
  // Recording
  recordedById      String            @db.VarChar(36)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  account           RecoveryAccount   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  recordedBy        User              @relation(fields: [recordedById], references: [id])
  
  @@index([accountId])
  @@index([status])
  @@index([promisedDate])
  @@map("repayment_promises")
}

enum PromiseStatus {
  ACTIVE      // Promise is pending
  KEPT        // Customer paid as promised
  PARTIAL     // Customer paid less than promised
  BROKEN      // Promise date passed without payment
  CANCELLED   // Promise cancelled/renegotiated
}
```

### 3.5 Recovery Document
Supporting documents for recovery accounts.

```prisma
model RecoveryDocument {
  id                String            @id @default(uuid()) @db.VarChar(36)
  accountId         String            @db.VarChar(36)
  
  // Document details
  documentType      String            @db.VarChar(100)
  fileName          String            @db.VarChar(255)
  filePath          String            @db.VarChar(500)
  fileSize          Int
  mimeType          String            @db.VarChar(100)
  
  // Metadata
  description       String?           @db.VarChar(500)
  uploadedById      String            @db.VarChar(36)
  createdAt         DateTime          @default(now())
  
  // Relations
  account           RecoveryAccount   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  uploadedBy        User              @relation(fields: [uploadedById], references: [id])
  
  @@index([accountId])
  @@map("recovery_documents")
}
```

## 4. API Endpoints Structure

### 4.1 Recovery Accounts
- `POST /api/recovery/accounts` - Create single recovery account
- `POST /api/recovery/accounts/import` - Bulk import from Excel
- `GET /api/recovery/accounts` - List all accounts (with filters)
- `GET /api/recovery/accounts/:id` - Get account details
- `PATCH /api/recovery/accounts/:id` - Update account
- `POST /api/recovery/accounts/:id/assign` - Assign to officer
- `PATCH /api/recovery/accounts/:id/status` - Update status

### 4.2 Recovery Activities
- `POST /api/recovery/accounts/:id/activities` - Log activity
- `GET /api/recovery/accounts/:id/activities` - Get activity history
- `GET /api/recovery/activities/my-followups` - Officer's pending followups

### 4.3 Recovery Payments
- `POST /api/recovery/accounts/:id/payments` - Record payment
- `PATCH /api/recovery/payments/:id/verify` - Verify payment
- `PATCH /api/recovery/payments/:id/reject` - Reject payment
- `GET /api/recovery/payments/pending` - List unverified payments

### 4.4 Repayment Promises
- `POST /api/recovery/accounts/:id/promises` - Record promise
- `GET /api/recovery/promises/active` - Active promises
- `GET /api/recovery/promises/missed` - Broken promises
- `PATCH /api/recovery/promises/:id/status` - Update promise status

### 4.5 Reports & Dashboard
- `GET /api/recovery/dashboard` - Overall recovery metrics
- `GET /api/recovery/reports/officer-performance` - Officer stats
- `GET /api/recovery/reports/ageing` - Ageing analysis
- `GET /api/recovery/reports/collection` - Collection reports

## 5. Permissions

```typescript
// New permissions to add
const RECOVERY_PERMISSIONS = [
  'recovery:dashboard_view',
  'recovery:accounts_create',
  'recovery:accounts_read',
  'recovery:accounts_update',
  'recovery:accounts_delete',
  'recovery:accounts_import',
  'recovery:accounts_assign',
  'recovery:activities_create',
  'recovery:activities_read',
  'recovery:payments_record',
  'recovery:payments_verify',
  'recovery:promises_create',
  'recovery:promises_read',
  'recovery:reports_view',
  'recovery:all_accounts', // See all accounts vs only assigned
];
```

### Role Assignments
- **Super Admin**: All recovery permissions
- **MD**: Dashboard view, reports, all accounts
- **Operations Manager**: All permissions except delete
- **Accounting Head**: Payment verification, reports
- **Recovery Officer**: Own assigned accounts, activities, promises, payment recording
- **Loan Officer**: Same as Recovery Officer (when assigned recovery accounts)

## 6. Frontend Structure

### Pages to Create
1. `/recovery` - Recovery Dashboard
2. `/recovery/accounts` - All Recovery Accounts
3. `/recovery/accounts/new` - Create Account
4. `/recovery/accounts/import` - Bulk Import
5. `/recovery/accounts/:id` - Account Detail Page
6. `/recovery/my-accounts` - Officer's Assigned Accounts
7. `/recovery/payments/pending` - Pending Payment Verifications
8. `/recovery/promises` - Active Promises
9. `/recovery/reports` - Recovery Reports

## 7. Implementation Plan

### Phase 1: Database & Backend (Week 1)
- [ ] Add Prisma models to schema
- [ ] Run migrations
- [ ] Create recovery module structure
- [ ] Implement API endpoints
- [ ] Add permissions to database

### Phase 2: Import & Setup (Week 2)
- [ ] Excel import functionality
- [ ] Account validation logic
- [ ] Assignment functionality
- [ ] Auto-ageing calculation

### Phase 3: Core Features (Week 2-3)
- [ ] Activity logging
- [ ] Payment recording & verification
- [ ] Promise tracking
- [ ] Document uploads

### Phase 4: Frontend (Week 3-4)
- [ ] Recovery dashboard
- [ ] Account list & detail pages
- [ ] Officer workspace
- [ ] Payment verification interface
- [ ] Reports & analytics

### Phase 5: Integration (Week 4)
- [ ] Auto-add VCLOP defaulted loans
- [ ] Workflow triggers
- [ ] Notifications
- [ ] Testing & deployment

## Next Steps

1. Get sample Excel data structure
2. Clarify payment verification workflow
3. Determine officer visibility rules
4. Decide on recovery cost tracking
5. Begin implementation

---

**Created**: 2026-10-28
**Status**: Specification Draft
**Next Review**: After clarifications from stakeholders
