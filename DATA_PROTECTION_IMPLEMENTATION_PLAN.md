# VCLOP Data Protection Compliance Implementation Plan
**Nigeria Data Protection Act 2023 Compliance**

## Executive Summary
This document outlines a phased approach to implement data protection compliance features in the VCLOP (Vertical Capital Loan Operations Platform) system to meet Nigeria Data Protection Act 2023 requirements.

**Current State**: Basic security (authentication, role-based access, audit logging)  
**Target State**: Full NDPA 2023 compliance with automated workflows  
**Timeline**: 6-8 weeks  
**Priority**: HIGH (Legal requirement, financial penalties for non-compliance)

---

## Phase 1: Foundation & Governance (Week 1-2)

### 1.1 Data Protection Officer (DPO) Module
**Backend Implementation:**
- [ ] Create `data-protection` module
- [ ] Add DPO role and permissions to system
- [ ] Create DPO dashboard API endpoints
- [ ] Implement compliance metrics tracking

**Frontend Implementation:**
- [ ] DPO Dashboard page
- [ ] Compliance status overview
- [ ] Data processing activities monitor
- [ ] Breach incident tracker

**Database Schema:**
```sql
CREATE TABLE data_protection_officers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  appointed_date DATE NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(30),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE processing_activities (
  id VARCHAR(36) PRIMARY KEY,
  activity_name VARCHAR(200) NOT NULL,
  purpose TEXT NOT NULL,
  data_categories JSON NOT NULL, -- ['BVN', 'NIN', 'Financial', 'Biometric', 'Location']
  legal_basis ENUM('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTEREST', 'PUBLIC_TASK', 'LEGITIMATE_INTEREST') NOT NULL,
  data_subjects VARCHAR(200), -- 'Loan applicants', 'Customers', 'Staff'
  recipients TEXT, -- Who we share data with
  retention_period VARCHAR(100), -- '7 years after loan closure'
  security_measures TEXT,
  cross_border_transfer BOOLEAN DEFAULT FALSE,
  transfer_countries JSON,
  dpia_required BOOLEAN DEFAULT FALSE,
  dpia_completed BOOLEAN DEFAULT FALSE,
  dpia_date DATE,
  status ENUM('ACTIVE', 'INACTIVE', 'UNDER_REVIEW') DEFAULT 'ACTIVE',
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 1.2 Records of Processing Activities (ROPA)
**Features:**
- [ ] ROPA register page (admin only)
- [ ] Document all data processing activities
- [ ] Export ROPA as PDF/Excel for NDPC submission
- [ ] Activity status tracking

**Processing Activities to Document:**
1. Customer Registration & KYC
2. Loan Application Processing
3. Credit Assessment & Scoring
4. Loan Disbursement & Repayment
5. Collections & Recovery
6. Employee Records Management
7. Compliance & Audit Logging
8. Third-party Data Sharing (credit bureaus, payment processors)

---

## Phase 2: Consent & Transparency (Week 2-3)

### 2.1 Consent Management System
**Backend Implementation:**
```sql
CREATE TABLE consent_types (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('ESSENTIAL', 'FUNCTIONAL', 'MARKETING', 'ANALYTICS') NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_consents (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  consent_type_id VARCHAR(36) NOT NULL,
  consent_version INT NOT NULL,
  given BOOLEAN NOT NULL,
  given_at TIMESTAMP,
  given_method ENUM('ONLINE', 'PAPER', 'VERBAL', 'SMS') DEFAULT 'ONLINE',
  withdrawn_at TIMESTAMP,
  withdrawn_method ENUM('ONLINE', 'PAPER', 'VERBAL', 'SMS'),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (consent_type_id) REFERENCES consent_types(id)
);
```

**Consent Types:**
1. **Essential Processing** (Required) - Account creation, loan processing, compliance
2. **Data Sharing** (Required) - Credit bureaus, payment processors, regulators
3. **Marketing Communications** (Optional) - Promotional emails, SMS
4. **Location Tracking** (Optional) - GPS for field officers, geo-tagging
5. **Third-party Analytics** (Optional) - Performance monitoring

**Frontend Implementation:**
- [ ] Consent collection during registration
- [ ] Consent preferences page in customer profile
- [ ] Easy consent withdrawal mechanism
- [ ] Consent history log

### 2.2 Privacy Policy & Notices
**Documents to Create:**
- [ ] **Privacy Policy** (legal document on website)
- [ ] **Cookie Policy** (if using cookies/tracking)
- [ ] **Customer Privacy Notice** (simple, given at registration)
- [ ] **Data Processing Notice** (for loan applications)
- [ ] **Third-party Data Sharing Notice**

**Frontend Implementation:**
- [ ] Privacy Policy page (`/privacy-policy`)
- [ ] Cookie banner (if needed)
- [ ] Privacy notice during registration
- [ ] Links to privacy docs in footer

**Content Template:**
```
VCLOP Privacy Notice

1. Who We Are: Vertical Capital Ltd, licensed lender in Nigeria
2. Data We Collect: Name, BVN, NIN, phone, address, financial data, location (GPS)
3. Why We Collect: Loan processing, credit assessment, compliance, fraud prevention
4. Legal Basis: Contract (loan agreement), Legal obligation (KYC/AML), Consent (marketing)
5. Who We Share With: Credit bureaus, payment processors, regulators (CBN, NDPC)
6. How Long We Keep: 7 years after account closure (regulatory requirement)
7. Your Rights: Access, rectification, erasure, objection, portability, complaint
8. Security: Encryption, access controls, regular audits
9. Contact: [DPO contact details]
10. Complaint: Nigeria Data Protection Commission - ndpc.gov.ng
```

---

## Phase 3: Data Subject Rights (Week 3-4)

### 3.1 Data Access Request (Right to Access)
**Backend Implementation:**
```sql
CREATE TABLE data_subject_requests (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  request_type ENUM('ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY', 'OBJECTION', 'RESTRICTION') NOT NULL,
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
  request_details TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  completed_by VARCHAR(36),
  rejection_reason TEXT,
  notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);

CREATE TABLE data_exports (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  export_format ENUM('JSON', 'CSV', 'PDF') NOT NULL,
  file_path VARCHAR(500),
  file_size_bytes INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  downloaded_at TIMESTAMP,
  expires_at TIMESTAMP, -- Auto-delete after 30 days
  FOREIGN KEY (request_id) REFERENCES data_subject_requests(id)
);
```

**API Endpoints:**
- `POST /api/v1/data-protection/access-request` - Customer requests their data
- `GET /api/v1/data-protection/my-data` - Download personal data export
- `GET /api/v1/data-protection/requests` - DPO views all requests
- `PATCH /api/v1/data-protection/requests/:id/complete` - Mark request completed

**Data Export Contents:**
- Customer profile (name, phone, email, address, BVN, NIN)
- Loan applications (all submitted applications)
- Loan history (active/closed loans, repayments)
- Documents (list of uploaded docs, not the files themselves)
- Consents given
- Audit trail (major account actions)

**Frontend Implementation:**
- [ ] "Request My Data" button in customer profile
- [ ] Request status tracking page
- [ ] Download link when ready
- [ ] DPO request management dashboard

### 3.2 Right to Rectification
**Implementation:**
- [ ] Customer can edit their profile (already exists)
- [ ] Add "Report Incorrect Data" button
- [ ] DPO review workflow for sensitive fields (BVN, NIN)
- [ ] Audit log all corrections

### 3.3 Right to Erasure (Right to be Forgotten)
**Constraints:**
- Cannot delete data if active loan exists
- Cannot delete if legal obligation to retain (7 years post-closure)
- Can anonymize instead of delete

**Backend Logic:**
```typescript
async requestErasure(customerId: string) {
  // Check if customer has active loans
  const activeLoans = await this.prisma.loan.count({
    where: { customerId, status: { in: ['ACTIVE', 'OVERDUE'] } }
  });
  
  if (activeLoans > 0) {
    throw new Error('Cannot erase data while active loans exist');
  }
  
  // Check if within retention period
  const latestLoanClosure = await this.prisma.loan.findFirst({
    where: { customerId },
    orderBy: { closedAt: 'desc' }
  });
  
  const retentionEnd = latestLoanClosure 
    ? addYears(latestLoanClosure.closedAt, 7)
    : addYears(new Date(), 7);
  
  if (isBefore(new Date(), retentionEnd)) {
    return { allowed: false, reason: 'Data must be retained until ' + formatDate(retentionEnd) };
  }
  
  // Create erasure request for DPO approval
  return this.createDataSubjectRequest(customerId, 'ERASURE');
}

async anonymizeCustomer(customerId: string) {
  await this.prisma.customer.update({
    where: { id: customerId },
    data: {
      firstName: 'ANONYMIZED',
      lastName: 'USER',
      email: null,
      phone: `ANON${customerId.slice(0, 8)}`,
      bvn: null,
      nin: null,
      residentialAddress: null,
      businessAddress: null,
      // Keep: customerNumber, dates, loan history for audit
    }
  });
  
  // Delete documents
  await this.prisma.customerDocument.deleteMany({ where: { customerId } });
  
  // Audit log
  await this.auditLog.log('Customer anonymized per erasure request', customerId);
}
```

### 3.4 Right to Data Portability
**Implementation:**
- [ ] Export customer data in machine-readable format (JSON, CSV)
- [ ] Include all personal data provided by customer
- [ ] Easy transfer to another lender (if requested)

### 3.5 Right to Object & Restriction
**Implementation:**
- [ ] "Stop Marketing Communications" toggle
- [ ] "Object to Processing" form
- [ ] DPO review workflow

---

## Phase 4: Security & Breach Management (Week 4-5)

### 4.1 Enhanced Data Security

**Encryption at Rest (Sensitive Fields):**
```sql
-- Add encrypted columns for sensitive data
ALTER TABLE customers 
ADD COLUMN bvn_encrypted VARBINARY(500),
ADD COLUMN nin_encrypted VARBINARY(500),
ADD COLUMN encryption_key_version INT DEFAULT 1;
```

**Backend Implementation:**
```typescript
// Use Node.js crypto module
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
  
  encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

**Fields to Encrypt:**
- BVN (Bank Verification Number)
- NIN (National Identification Number)
- Account numbers (if stored)
- Passwords (already hashed, keep that)

### 4.2 Data Breach Management

**Backend Schema:**
```sql
CREATE TABLE data_breaches (
  id VARCHAR(36) PRIMARY KEY,
  incident_date TIMESTAMP NOT NULL,
  discovered_date TIMESTAMP NOT NULL,
  breach_type ENUM('UNAUTHORIZED_ACCESS', 'DATA_LOSS', 'DATA_THEFT', 'SYSTEM_COMPROMISE', 'HUMAN_ERROR', 'OTHER') NOT NULL,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
  affected_records INT,
  affected_customers JSON, -- Array of customer IDs
  data_categories JSON, -- ['BVN', 'Financial Data']
  description TEXT NOT NULL,
  root_cause TEXT,
  containment_actions TEXT,
  notified_ndpc BOOLEAN DEFAULT FALSE,
  notified_ndpc_at TIMESTAMP,
  notified_customers BOOLEAN DEFAULT FALSE,
  notified_customers_at TIMESTAMP,
  status ENUM('DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED') DEFAULT 'DETECTED',
  reported_by VARCHAR(36),
  assigned_to VARCHAR(36), -- DPO
  resolved_at TIMESTAMP,
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE breach_notifications (
  id VARCHAR(36) PRIMARY KEY,
  breach_id VARCHAR(36) NOT NULL,
  notification_type ENUM('NDPC', 'CUSTOMER', 'INTERNAL') NOT NULL,
  recipient VARCHAR(200),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_method ENUM('EMAIL', 'SMS', 'PORTAL', 'LETTER') NOT NULL,
  content TEXT,
  FOREIGN KEY (breach_id) REFERENCES data_breaches(id)
);
```

**Breach Response Workflow:**
1. **Detection** → Log incident immediately
2. **Assessment** → Determine severity (affected records, data types, risk)
3. **Containment** → Stop the breach, secure systems
4. **Notification** → Report to NDPC within 72 hours if high risk
5. **Customer Notice** → Notify affected customers if high risk to them
6. **Resolution** → Fix vulnerability, document lessons learned

**API Endpoints:**
- `POST /api/v1/data-protection/breaches` - Report breach
- `GET /api/v1/data-protection/breaches` - List breaches (DPO only)
- `POST /api/v1/data-protection/breaches/:id/notify-ndpc` - Send NDPC notification
- `POST /api/v1/data-protection/breaches/:id/notify-customers` - Bulk notify customers

**Frontend Implementation:**
- [ ] Breach incident reporting form
- [ ] Breach management dashboard (DPO)
- [ ] NDPC notification generator
- [ ] Customer notification templates

### 4.3 Security Audit Trail Enhancement
**Already implemented, enhance with:**
- [ ] Data access logging (who viewed customer BVN/NIN)
- [ ] Export logging (who downloaded customer data)
- [ ] Consent change logging
- [ ] Retention: 2 years minimum

---

## Phase 5: Retention & Minimization (Week 5-6)

### 5.1 Data Retention Policy

**Retention Periods:**
| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Customer KYC (BVN, NIN, ID docs) | 7 years after account closure | CBN/NDPC requirement |
| Loan applications (approved) | 7 years after loan closure | Financial regulation |
| Loan applications (rejected) | 2 years | Business need |
| Repayment records | 7 years after loan closure | Tax & audit |
| Audit logs | 2 years | Security compliance |
| Marketing consents | Until withdrawn + 6 months | Consent basis |
| Session logs | 90 days | Security monitoring |

**Database Schema:**
```sql
CREATE TABLE retention_policies (
  id VARCHAR(36) PRIMARY KEY,
  data_category VARCHAR(100) NOT NULL,
  retention_period_days INT NOT NULL,
  retention_basis VARCHAR(200),
  deletion_method ENUM('HARD_DELETE', 'SOFT_DELETE', 'ANONYMIZE') NOT NULL,
  auto_delete_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE retention_schedule (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'Customer', 'LoanApplication', 'Document'
  entity_id VARCHAR(36) NOT NULL,
  retention_policy_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  eligible_for_deletion_at TIMESTAMP NOT NULL,
  deletion_scheduled BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  FOREIGN KEY (retention_policy_id) REFERENCES retention_policies(id)
);
```

### 5.2 Automated Data Deletion Service

**Backend Implementation:**
```typescript
@Injectable()
export class DataRetentionService {
  
  @Cron('0 2 * * *') // Run daily at 2am
  async processRetentionSchedule() {
    const eligible = await this.prisma.retentionSchedule.findMany({
      where: {
        eligible_for_deletion_at: { lte: new Date() },
        deletion_scheduled: false
      },
      include: { retentionPolicy: true }
    });
    
    for (const item of eligible) {
      await this.deleteOrAnonymize(item);
    }
  }
  
  async deleteOrAnonymize(item: RetentionSchedule) {
    switch (item.retentionPolicy.deletion_method) {
      case 'HARD_DELETE':
        await this.hardDelete(item.entity_type, item.entity_id);
        break;
      case 'SOFT_DELETE':
        await this.softDelete(item.entity_type, item.entity_id);
        break;
      case 'ANONYMIZE':
        await this.anonymize(item.entity_type, item.entity_id);
        break;
    }
    
    await this.prisma.retentionSchedule.update({
      where: { id: item.id },
      data: { deletion_scheduled: true, deleted_at: new Date() }
    });
    
    await this.auditLog.log(`Data retention: ${item.deletion_method} executed`, item.entity_id);
  }
}
```

### 5.3 Data Minimization
**Checklist:**
- [ ] Review all forms - collect only necessary data
- [ ] Remove optional fields that aren't used
- [ ] Justify each data point collected
- [ ] Document purpose for each field

---

## Phase 6: Staff Training & Compliance (Week 6-7)

### 6.1 Staff Training Module
**Backend Schema:**
```sql
CREATE TABLE training_modules (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- HTML or Markdown
  module_type ENUM('DATA_PROTECTION', 'SECURITY', 'COMPLIANCE', 'GDPR') NOT NULL,
  duration_minutes INT,
  passing_score INT DEFAULT 70,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_completions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  module_id VARCHAR(36) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  score INT,
  passed BOOLEAN,
  certificate_url VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (module_id) REFERENCES training_modules(id)
);
```

**Training Modules:**
1. **Introduction to NDPA 2023** (30 mins)
   - What is data protection
   - Legal requirements
   - Penalties for non-compliance

2. **Handling Customer Data** (45 mins)
   - Data minimization
   - Secure storage
   - Access controls
   - Sharing rules

3. **Data Subject Rights** (30 mins)
   - Customer rights
   - How to handle requests
   - Response timelines

4. **Security Best Practices** (45 mins)
   - Password hygiene
   - Phishing awareness
   - Secure communications
   - Incident reporting

5. **Breach Response** (30 mins)
   - Recognizing breaches
   - Immediate actions
   - Reporting procedures

**Frontend Implementation:**
- [ ] Training portal page
- [ ] Module viewer with quizzes
- [ ] Progress tracking
- [ ] Certificate generation
- [ ] Annual renewal reminders

### 6.2 Confidentiality Agreements
**Implementation:**
- [ ] Digital NDA signing during onboarding
- [ ] Store signed agreements in user records
- [ ] Annual renewal

---

## Phase 7: DPIA & Documentation (Week 7-8)

### 7.1 Data Protection Impact Assessment (DPIA)

**When Required:**
- Large-scale processing of sensitive data (✓ BVN, NIN, financials)
- Systematic monitoring (✓ GPS tracking)
- Automated decision-making (✓ credit scoring)
- Biometric data (if you add fingerprint/facial recognition)

**DPIA Template Generator:**
```sql
CREATE TABLE dpias (
  id VARCHAR(36) PRIMARY KEY,
  processing_activity_id VARCHAR(36) NOT NULL,
  assessment_date DATE NOT NULL,
  assessor_id VARCHAR(36) NOT NULL,
  
  -- Section 1: Description
  description TEXT NOT NULL,
  necessity_justification TEXT NOT NULL,
  proportionality_justification TEXT NOT NULL,
  
  -- Section 2: Risks
  risks JSON NOT NULL, -- [{risk: 'Unauthorized access', likelihood: 'MEDIUM', impact: 'HIGH', mitigation: '...'}]
  
  -- Section 3: Compliance
  compliance_measures TEXT NOT NULL,
  safeguards TEXT NOT NULL,
  
  -- Section 4: Consultation
  consulted_dpo BOOLEAN DEFAULT FALSE,
  consulted_stakeholders TEXT,
  
  -- Section 5: Outcome
  outcome ENUM('PROCEED', 'PROCEED_WITH_CONDITIONS', 'DO_NOT_PROCEED', 'CONSULT_NDPC') NOT NULL,
  conditions TEXT,
  
  status ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
  approved_by VARCHAR(36),
  approved_at TIMESTAMP,
  
  review_date DATE, -- DPIA should be reviewed annually
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (processing_activity_id) REFERENCES processing_activities(id),
  FOREIGN KEY (assessor_id) REFERENCES users(id)
);
```

**DPIAs to Create:**
1. Customer KYC & BVN/NIN Collection
2. Credit Scoring & Automated Decision-Making
3. GPS Location Tracking for Field Officers
4. Third-party Data Sharing with Credit Bureaus
5. CCTV Surveillance (if applicable)

### 7.2 Compliance Reporting

**Dashboard Metrics:**
- Total customers
- Active consents by type
- Data subject requests (pending, completed)
- Retention schedule status
- Training completion rates
- Open data breaches
- DPIA completion status
- ROPA last updated

**API Endpoint:**
```typescript
GET /api/v1/data-protection/compliance-report

Response:
{
  reportDate: '2026-09-21',
  summary: {
    totalCustomers: 15234,
    activeConsents: 14890,
    pendingRequests: 12,
    breaches: { total: 2, open: 0 },
    staffTrained: { completed: 42, pending: 3 }
  },
  dataInventory: {
    sensitiveRecords: 15234, // BVN/NIN
    retentionCompliance: '98%',
    overdueForDeletion: 23
  },
  riskAssessment: {
    highRiskProcessing: 4,
    dpiasCompleted: 4,
    dpiasOverdue: 0
  }
}
```

---

## Phase 8: Third-party & Cross-border (Week 8)

### 8.1 Data Processing Agreements (DPAs)

**Vendors Requiring DPAs:**
- Cloud hosting provider (e.g., Hostinger, AWS)
- Email service (SMTP provider)
- SMS gateway
- Payment processors
- Credit bureaus
- Analytics tools (if any)

**DPA Checklist:**
- [ ] Identify all third-party data processors
- [ ] Draft DPA contracts (legal review)
- [ ] Ensure processors have adequate security
- [ ] Document data shared with each vendor
- [ ] Annual vendor security audits

**Database Schema:**
```sql
CREATE TABLE third_party_processors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(150),
  service_provided VARCHAR(200), -- 'Cloud hosting', 'Email delivery'
  data_shared JSON, -- ['Customer names', 'Email addresses']
  location VARCHAR(100), -- 'Nigeria', 'USA'
  dpa_signed BOOLEAN DEFAULT FALSE,
  dpa_signed_date DATE,
  dpa_document_url VARCHAR(500),
  security_certification VARCHAR(200), -- 'ISO 27001', 'SOC 2'
  last_audit_date DATE,
  next_audit_date DATE,
  risk_rating ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
  status ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8.2 Cross-border Data Transfer

**Scenarios:**
- If using international cloud providers (AWS US, etc.)
- If sharing data with international credit bureaus
- If parent company is outside Nigeria

**Compliance Mechanisms:**
1. **Adequacy Decision**: Transfer only to countries NDPC deems adequate
2. **Standard Contractual Clauses (SCCs)**: Use NDPC-approved SCCs
3. **Explicit Consent**: Get customer consent for international transfers
4. **Binding Corporate Rules**: If you're part of multinational group

**Implementation:**
- [ ] Document all cross-border transfers
- [ ] Implement SCCs with international vendors
- [ ] Add consent clause for international transfers
- [ ] Update Privacy Policy to disclose transfers

---

## Implementation Priority Matrix

| Priority | Feature | Impact | Effort | Timeline |
|----------|---------|--------|--------|----------|
| **P0 - Critical** | Privacy Policy & Notices | High | Low | Week 1 |
| **P0 - Critical** | Consent Management | High | Medium | Week 2-3 |
| **P0 - Critical** | Data Access Request | High | Medium | Week 3 |
| **P1 - High** | DPO Module & ROPA | High | Medium | Week 1-2 |
| **P1 - High** | Data Erasure/Anonymization | High | Medium | Week 4 |
| **P1 - High** | Encryption (BVN/NIN) | High | High | Week 4-5 |
| **P1 - High** | Data Retention Automation | Medium | High | Week 5-6 |
| **P2 - Medium** | Breach Management | Medium | Medium | Week 4-5 |
| **P2 - Medium** | Staff Training Module | Medium | High | Week 6-7 |
| **P2 - Medium** | DPIA Generator | Medium | Medium | Week 7 |
| **P3 - Low** | Third-party DPA Tracker | Low | Low | Week 8 |
| **P3 - Low** | Compliance Dashboard Polish | Low | Medium | Week 8 |

---

## Quick Start (Minimum Viable Compliance)

**If you need basic compliance FAST (2-3 weeks):**

1. **Week 1:**
   - [ ] Appoint DPO (designate a person)
   - [ ] Write Privacy Policy (use template above)
   - [ ] Publish privacy policy on website
   - [ ] Add consent checkboxes to registration form
   - [ ] Create ROPA document (manual Excel/PDF)

2. **Week 2:**
   - [ ] Implement "Request My Data" feature
   - [ ] Create data export function (JSON/CSV)
   - [ ] Set up email for data subject requests (dpo@verticalcapital.ng)
   - [ ] Document retention policy (PDF document)

3. **Week 3:**
   - [ ] Conduct staff training session (manual, 1-2 hours)
   - [ ] Have staff sign confidentiality agreements
   - [ ] Create breach response plan (document)
   - [ ] Review third-party vendors, get DPAs signed

**This gets you to ~60-70% compliance** - enough to avoid immediate penalties while you build out the full system.

---

## Success Criteria

✅ **Legal Compliance:**
- All NDPA 2023 requirements met
- NDPC audit-ready documentation
- Zero data protection violations

✅ **Operational:**
- Data subject requests handled within 30 days
- 100% staff training completion
- Automated retention enforcement
- Breach response time < 72 hours

✅ **Technical:**
- Sensitive data encrypted at rest
- Comprehensive audit logging
- Automated deletion workflows
- Secure data export functionality

---

## Budget Estimate

| Item | Cost (₦) | Notes |
|------|---------|-------|
| DPO Training/Certification | 300,000 - 500,000 | External course |
| Legal Review (Privacy Policy, DPAs) | 500,000 - 1,000,000 | One-time |
| Development Time (8 weeks) | 2,000,000 - 4,000,000 | If outsourced |
| Staff Training Materials | 100,000 | Templates, videos |
| NDPC Registration/Audit Fee | 50,000 - 200,000 | Annual |
| Security Audit (optional) | 500,000 - 1,500,000 | Annual |
| **Total** | **3.5M - 7.2M** | One-time + annual fees |

**Note:** If building in-house (developer already on payroll), main costs are DPO training and legal review (~800k - 1.5M).

---

## Next Steps

1. **Get Approval**: Share this plan with management/legal team
2. **Assign DPO**: Appoint or hire a Data Protection Officer
3. **Legal Review**: Have lawyer review and draft Privacy Policy, DPAs
4. **Prioritize**: Decide on full implementation vs. quick start
5. **Kickoff**: I can start implementing any phase immediately

**What would you like to tackle first?**
- Quick start (minimum compliance in 2-3 weeks)?
- Full Phase 1 (DPO Module + ROPA)?
- Privacy Policy & Consent (Phase 2)?
- Or review/adjust the plan?
