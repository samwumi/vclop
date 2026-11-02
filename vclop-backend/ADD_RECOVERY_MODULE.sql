-- ═══════════════════════════════════════════════════════════════════════════
-- VCLOP RECOVERY MODULE - DATABASE MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
-- This migration adds all tables and enums for the Loan Recovery Management Module
-- Run this SQL script on your production database
-- ═══════════════════════════════════════════════════════════════════════════

-- Create recovery_accounts table
CREATE TABLE `recovery_accounts` (
  `id` VARCHAR(36) NOT NULL,
  `accountNumber` VARCHAR(20) NOT NULL,
  `source` ENUM('LEGACY', 'VCLOP') NOT NULL DEFAULT 'LEGACY',
  `vclopLoanId` VARCHAR(36) NULL,
  `customerId` VARCHAR(36) NULL,
  `customerName` VARCHAR(200) NOT NULL,
  `customerPhone` VARCHAR(20) NOT NULL,
  `customerEmail` VARCHAR(150) NULL,
  `customerAddress` TEXT NULL,
  `originalPrincipal` DECIMAL(14, 2) NOT NULL,
  `disbursementDate` DATE NOT NULL,
  `originalReference` VARCHAR(100) NULL,
  `historicalRepayments` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `outstandingBalance` DECIMAL(14, 2) NOT NULL,
  `recoveredAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `totalExpenses` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `netRecovery` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `lastPaymentDate` DATETIME(3) NULL,
  `lastPaymentAmount` DECIMAL(14, 2) NULL,
  `assignedOfficerId` VARCHAR(36) NULL,
  `assignedDate` DATETIME(3) NULL,
  `branchId` VARCHAR(36) NULL,
  `status` ENUM('PENDING_VERIFICATION', 'ASSIGNED', 'IN_PROGRESS', 'PROMISE_ACTIVE', 'LEGAL_ACTION', 'PARTIALLY_RECOVERED', 'FULLY_RECOVERED', 'WRITTEN_OFF', 'CLOSED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `priorityLevel` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `createdById` VARCHAR(36) NOT NULL,
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `recovery_accounts_accountNumber_key` (`accountNumber`),
  UNIQUE INDEX `recovery_accounts_vclopLoanId_key` (`vclopLoanId`),
  INDEX `recovery_accounts_accountNumber_idx` (`accountNumber`),
  INDEX `recovery_accounts_customerId_idx` (`customerId`),
  INDEX `recovery_accounts_assignedOfficerId_idx` (`assignedOfficerId`),
  INDEX `recovery_accounts_status_idx` (`status`),
  INDEX `recovery_accounts_source_idx` (`source`),
  INDEX `recovery_accounts_branchId_idx` (`branchId`),
  INDEX `recovery_accounts_deletedAt_idx` (`deletedAt`),
  CONSTRAINT `recovery_accounts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recovery_accounts_vclopLoanId_fkey` FOREIGN KEY (`vclopLoanId`) REFERENCES `loans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recovery_accounts_assignedOfficerId_fkey` FOREIGN KEY (`assignedOfficerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recovery_accounts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recovery_accounts_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create recovery_activities table
CREATE TABLE `recovery_activities` (
  `id` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(36) NOT NULL,
  `activityType` ENUM('PHONE_CALL', 'SMS_SENT', 'EMAIL_SENT', 'FIELD_VISIT', 'OFFICE_VISIT', 'NEGOTIATION', 'PROMISE_RECEIVED', 'LEGAL_NOTICE', 'PAYMENT_RECEIVED', 'OTHER') NOT NULL,
  `activityDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `contactMethod` ENUM('PHONE', 'SMS', 'EMAIL', 'IN_PERSON', 'WHATSAPP') NULL,
  `contactOutcome` ENUM('CONTACTED', 'NO_ANSWER', 'WRONG_NUMBER', 'PROMISED_PAYMENT', 'REFUSED_TO_PAY', 'PARTIAL_AGREEMENT', 'HOSTILE', 'NOT_FOUND', 'PENDING_CALLBACK') NULL,
  `notes` TEXT NULL,
  `nextFollowupDate` DATETIME(3) NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `visitAddress` VARCHAR(500) NULL,
  `recordedById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `recovery_activities_accountId_idx` (`accountId`),
  INDEX `recovery_activities_activityType_idx` (`activityType`),
  INDEX `recovery_activities_activityDate_idx` (`activityDate`),
  INDEX `recovery_activities_nextFollowupDate_idx` (`nextFollowupDate`),
  CONSTRAINT `recovery_activities_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `recovery_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recovery_activities_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create recovery_payments table
CREATE TABLE `recovery_payments` (
  `id` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(14, 2) NOT NULL,
  `paymentDate` DATETIME(3) NOT NULL,
  `paymentMethod` VARCHAR(50) NOT NULL,
  `reference` VARCHAR(100) NULL,
  `status` ENUM('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `recordedById` VARCHAR(36) NOT NULL,
  `verifiedById` VARCHAR(36) NULL,
  `verifiedAt` DATETIME(3) NULL,
  `verificationNotes` TEXT NULL,
  `rejectionReason` TEXT NULL,
  `receiptPath` VARCHAR(500) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `recovery_payments_accountId_idx` (`accountId`),
  INDEX `recovery_payments_status_idx` (`status`),
  INDEX `recovery_payments_paymentDate_idx` (`paymentDate`),
  CONSTRAINT `recovery_payments_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `recovery_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recovery_payments_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `recovery_payments_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create repayment_promises table
CREATE TABLE `repayment_promises` (
  `id` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(36) NOT NULL,
  `promisedAmount` DECIMAL(14, 2) NOT NULL,
  `promisedDate` DATE NOT NULL,
  `promiseNotes` TEXT NULL,
  `status` ENUM('ACTIVE', 'KEPT', 'PARTIAL', 'BROKEN', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `actualPaidAmount` DECIMAL(14, 2) NULL,
  `actualPaidDate` DATETIME(3) NULL,
  `recordedById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `repayment_promises_accountId_idx` (`accountId`),
  INDEX `repayment_promises_status_idx` (`status`),
  INDEX `repayment_promises_promisedDate_idx` (`promisedDate`),
  CONSTRAINT `repayment_promises_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `recovery_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `repayment_promises_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create recovery_documents table
CREATE TABLE `recovery_documents` (
  `id` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(36) NOT NULL,
  `documentType` VARCHAR(100) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `filePath` VARCHAR(500) NOT NULL,
  `fileSize` INT NOT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `description` VARCHAR(500) NULL,
  `uploadedById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `recovery_documents_accountId_idx` (`accountId`),
  CONSTRAINT `recovery_documents_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `recovery_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recovery_documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create recovery_expenses table
CREATE TABLE `recovery_expenses` (
  `id` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(36) NOT NULL,
  `expenseType` ENUM('FUEL', 'LEGAL_FEES', 'COURT_FEES', 'INVESTIGATION', 'COMMUNICATION', 'TRAVEL', 'OTHER') NOT NULL,
  `amount` DECIMAL(14, 2) NOT NULL,
  `expenseDate` DATE NOT NULL,
  `description` TEXT NULL,
  `receiptPath` VARCHAR(500) NULL,
  `recordedById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `recovery_expenses_accountId_idx` (`accountId`),
  INDEX `recovery_expenses_expenseType_idx` (`expenseType`),
  INDEX `recovery_expenses_expenseDate_idx` (`expenseDate`),
  CONSTRAINT `recovery_expenses_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `recovery_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recovery_expenses_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify all tables were created
SELECT 'Recovery tables created successfully' AS status;

-- Show all recovery tables
SHOW TABLES LIKE 'recovery_%';
SHOW TABLES LIKE 'repayment_promises';

-- Check table structures
DESCRIBE recovery_accounts;
DESCRIBE recovery_activities;
DESCRIBE recovery_payments;
DESCRIBE repayment_promises;
DESCRIBE recovery_documents;
DESCRIBE recovery_expenses;
