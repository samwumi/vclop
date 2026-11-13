-- ================================================================================
-- HR & EMPLOYEE SELF-SERVICE MODULE - DATABASE MIGRATION
-- ================================================================================
-- Version: 1.0
-- Date: 2026-10-28
-- Database: MariaDB 10.x / MySQL 8.x
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- ================================================================================
-- IMPORTANT: Review this file before execution
-- BACKUP YOUR DATABASE BEFORE RUNNING
-- Test in development environment first
-- ================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- ════════════════════════════════════════════════════════════════════════════
-- 1. EMPLOYMENT MANAGEMENT
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `employment_periods` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `endReason` VARCHAR(500) NULL,
    `jobTitle` VARCHAR(150) NULL,
    `departmentId` VARCHAR(36) NULL,
    `branchId` VARCHAR(36) NULL,
    `supervisorId` VARCHAR(36) NULL,
    `isCurrentEmployment` BOOLEAN NOT NULL DEFAULT TRUE,
    `hireType` ENUM('NEW_HIRE', 'REHIRE', 'TRANSFER', 'PROMOTION') NOT NULL DEFAULT 'NEW_HIRE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    INDEX `employment_periods_userId_idx`(`userId`),
    INDEX `employment_periods_isCurrentEmployment_idx`(`isCurrentEmployment`),
    INDEX `employment_periods_startDate_idx`(`startDate`),
    
    CONSTRAINT `employment_periods_userId_fkey` 
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `employment_periods_departmentId_fkey` 
        FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `employment_periods_branchId_fkey` 
        FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `employment_periods_supervisorId_fkey` 
        FOREIGN KEY (`supervisorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `employment_periods_createdById_fkey` 
        FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `salary_history` (
    `id` VARCHAR(36) NOT NULL,
    `employmentPeriodId` VARCHAR(36) NOT NULL,
    `effectiveFrom` DATE NOT NULL,
    `effectiveTo` DATE NULL,
    `grossSalary` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'PHP',
    `payFrequency` ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUAL') NOT NULL DEFAULT 'MONTHLY',
    `changeReason` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    INDEX `salary_history_employmentPeriodId_idx`(`employmentPeriodId`),
    INDEX `salary_history_effectiveFrom_idx`(`effectiveFrom`),
    
    CONSTRAINT `salary_history_employmentPeriodId_fkey` 
        FOREIGN KEY (`employmentPeriodId`) REFERENCES `employment_periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `salary_history_createdById_fkey` 
        FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. LEAVE MANAGEMENT
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `leave_types` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `description` VARCHAR(500) NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT TRUE,
    `requiresDocumentation` BOOLEAN NOT NULL DEFAULT FALSE,
    `countWeekendsAsLeave` BOOLEAN NOT NULL DEFAULT FALSE,
    `countHolidaysAsLeave` BOOLEAN NOT NULL DEFAULT FALSE,
    `canCarryForward` BOOLEAN NOT NULL DEFAULT FALSE,
    `maxCarryForwardDays` DECIMAL(5, 1) NOT NULL DEFAULT 0,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT TRUE,
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `leave_types_code_key`(`code`),
    INDEX `leave_types_isActive_idx`(`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_entitlements` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `leaveTypeId` VARCHAR(36) NOT NULL,
    `year` INTEGER NOT NULL,
    `allocatedDays` DECIMAL(5, 1) NOT NULL,
    `carryForwardDays` DECIMAL(5, 1) NOT NULL DEFAULT 0,
    `adjustmentDays` DECIMAL(5, 1) NOT NULL DEFAULT 0,
    `adjustmentReason` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `leave_entitlements_userId_leaveTypeId_year_key`(`userId`, `leaveTypeId`, `year`),
    INDEX `leave_entitlements_userId_year_idx`(`userId`, `year`),
    INDEX `leave_entitlements_leaveTypeId_idx`(`leaveTypeId`),
    
    CONSTRAINT `leave_entitlements_userId_fkey` 
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `leave_entitlements_leaveTypeId_fkey` 
        FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `leave_entitlements_createdById_fkey` 
        FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_applications` (
    `id` VARCHAR(36) NOT NULL,
    `applicationNumber` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `leaveTypeId` VARCHAR(36) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `startDayType` ENUM('FULL_DAY', 'MORNING', 'AFTERNOON') NOT NULL DEFAULT 'FULL_DAY',
    `endDayType` ENUM('FULL_DAY', 'MORNING', 'AFTERNOON') NOT NULL DEFAULT 'FULL_DAY',
    `businessDaysRequested` DECIMAL(5, 1) NOT NULL,
    `primaryEntitlementYear` INTEGER NOT NULL,
    `secondaryEntitlementYear` INTEGER NULL,
    `daysFromPrimaryYear` DECIMAL(5, 1) NULL,
    `daysFromSecondaryYear` DECIMAL(5, 1) NULL,
    `reason` TEXT NOT NULL,
    `handoverNotes` TEXT NULL,
    `emergencyContact` VARCHAR(150) NULL,
    `emergencyPhone` VARCHAR(30) NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `submittedById` VARCHAR(36) NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(36) NULL,
    `approvalNotes` TEXT NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectedById` VARCHAR(36) NULL,
    `rejectionReason` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledById` VARCHAR(36) NULL,
    `cancellationReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `leave_applications_applicationNumber_key`(`applicationNumber`),
    INDEX `leave_applications_userId_idx`(`userId`),
    INDEX `leave_applications_leaveTypeId_idx`(`leaveTypeId`),
    INDEX `leave_applications_status_idx`(`status`),
    INDEX `leave_applications_userId_primaryEntitlementYear_idx`(`userId`, `primaryEntitlementYear`),
    INDEX `leave_applications_startDate_endDate_idx`(`startDate`, `endDate`),
    
    CONSTRAINT `leave_applications_userId_fkey` 
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `leave_applications_leaveTypeId_fkey` 
        FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_approvals` (
    `id` VARCHAR(36) NOT NULL,
    `leaveApplicationId` VARCHAR(36) NOT NULL,
    `approvalLevel` INTEGER NOT NULL,
    `approverId` VARCHAR(36) NOT NULL,
    `delegatedFromId` VARCHAR(36) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    `decision` ENUM('APPROVE', 'REJECT', 'RETURN_FOR_INFO') NULL,
    `comments` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedAt` DATETIME(3) NULL,
    `dueAt` DATETIME(3) NULL,
    `policyVersionId` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    INDEX `leave_approvals_leaveApplicationId_idx`(`leaveApplicationId`),
    INDEX `leave_approvals_approverId_status_idx`(`approverId`, `status`),
    UNIQUE KEY `leave_approvals_leaveApplicationId_approvalLevel_key`(`leaveApplicationId`, `approvalLevel`),
    
    CONSTRAINT `leave_approvals_leaveApplicationId_fkey` 
        FOREIGN KEY (`leaveApplicationId`) REFERENCES `leave_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `leave_approvals_approverId_fkey` 
        FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `leave_approvals_delegatedFromId_fkey` 
        FOREIGN KEY (`delegatedFromId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `branch_workweeks` (
    `id` VARCHAR(36) NOT NULL,
    `branchId` VARCHAR(36) NOT NULL,
    `effectiveFrom` DATE NOT NULL,
    `effectiveTo` DATE NULL,
    `isSundayWorkday` BOOLEAN NOT NULL DEFAULT FALSE,
    `isMondayWorkday` BOOLEAN NOT NULL DEFAULT TRUE,
    `isTuesdayWorkday` BOOLEAN NOT NULL DEFAULT TRUE,
    `isWednesdayWorkday` BOOLEAN NOT NULL DEFAULT TRUE,
    `isThursdayWorkday` BOOLEAN NOT NULL DEFAULT TRUE,
    `isFridayWorkday` BOOLEAN NOT NULL DEFAULT TRUE,
    `isSaturdayWorkday` BOOLEAN NOT NULL DEFAULT FALSE,
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    INDEX `branch_workweeks_branchId_effectiveFrom_idx`(`branchId`, `effectiveFrom`),
    
    CONSTRAINT `branch_workweeks_branchId_fkey` 
        FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `public_holidays` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `date` DATE NOT NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT TRUE,
    `branchId` VARCHAR(36) NULL COMMENT 'NULL = all branches',
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    INDEX `public_holidays_date_idx`(`date`),
    INDEX `public_holidays_branchId_date_idx`(`branchId`, `date`),
    
    CONSTRAINT `public_holidays_branchId_fkey` 
        FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. STAFF LOANS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `staff_loans` (
    `id` VARCHAR(36) NOT NULL,
    `loanNumber` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `loanPurpose` VARCHAR(200) NOT NULL,
    `requestedAmount` DECIMAL(15, 2) NOT NULL,
    `approvedAmount` DECIMAL(15, 2) NULL,
    `proposedTenureMonths` INTEGER NOT NULL,
    `approvedTenureMonths` INTEGER NULL,
    `interestRate` DECIMAL(5, 2) NULL COMMENT 'Flat interest rate %',
    `justification` TEXT NOT NULL,
    `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(36) NULL,
    `approvalNotes` TEXT NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectedById` VARCHAR(36) NULL,
    `rejectionReason` TEXT NULL,
    `disbursedAt` DATETIME(3) NULL,
    `disbursedById` VARCHAR(36) NULL,
    `disbursementDate` DATE NULL,
    `disbursementMethod` VARCHAR(100) NULL,
    `disbursementReference` VARCHAR(100) NULL,
    `disbursementNotes` TEXT NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `staff_loans_loanNumber_key`(`loanNumber`),
    INDEX `staff_loans_userId_idx`(`userId`),
    INDEX `staff_loans_status_idx`(`status`),
    INDEX `staff_loans_loanNumber_idx`(`loanNumber`),
    
    CONSTRAINT `staff_loans_userId_fkey` 
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `staff_loans_approvedById_fkey` 
        FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `staff_loans_rejectedById_fkey` 
        FOREIGN KEY (`rejectedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `staff_loans_disbursedById_fkey` 
        FOREIGN KEY (`disbursedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_loan_installments` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `dueDate` DATE NOT NULL,
    `principalAmount` DECIMAL(15, 2) NOT NULL,
    `interestAmount` DECIMAL(15, 2) NOT NULL,
    `totalAmount` DECIMAL(15, 2) NOT NULL,
    `amountPaid` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paidDate` DATE NULL,
    `outstandingBalance` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    INDEX `staff_loan_installments_loanId_idx`(`loanId`),
    INDEX `staff_loan_installments_status_dueDate_idx`(`status`, `dueDate`),
    UNIQUE KEY `staff_loan_installments_loanId_installmentNumber_key`(`loanId`, `installmentNumber`),
    
    CONSTRAINT `staff_loan_installments_loanId_fkey` 
        FOREIGN KEY (`loanId`) REFERENCES `staff_loans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_loan_payments` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `installmentId` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `appliedAmount` DECIMAL(15, 2) NOT NULL COMMENT 'Amount actually applied to this installment',
    `paymentDate` DATE NOT NULL,
    `paymentMethod` VARCHAR(100) NOT NULL,
    `referenceNumber` VARCHAR(100) NULL,
    `status` ENUM('COMPLETED', 'REVERSED') NOT NULL DEFAULT 'COMPLETED',
    `notes` TEXT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedById` VARCHAR(36) NOT NULL,
    
    PRIMARY KEY (`id`),
    INDEX `staff_loan_payments_loanId_idx`(`loanId`),
    INDEX `staff_loan_payments_installmentId_idx`(`installmentId`),
    INDEX `staff_loan_payments_status_idx`(`status`),
    
    CONSTRAINT `staff_loan_payments_loanId_fkey` 
        FOREIGN KEY (`loanId`) REFERENCES `staff_loans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `staff_loan_payments_installmentId_fkey` 
        FOREIGN KEY (`installmentId`) REFERENCES `staff_loan_installments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `staff_loan_payments_recordedById_fkey` 
        FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_loan_reversals` (
    `id` VARCHAR(36) NOT NULL,
    `paymentId` VARCHAR(36) NOT NULL,
    `reversalDate` DATE NOT NULL,
    `reason` TEXT NOT NULL,
    `reversedById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `staff_loan_reversals_paymentId_key`(`paymentId`),
    
    CONSTRAINT `staff_loan_reversals_paymentId_fkey` 
        FOREIGN KEY (`paymentId`) REFERENCES `staff_loan_payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `staff_loan_reversals_reversedById_fkey` 
        FOREIGN KEY (`reversedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. RESOURCE OWNERSHIP & DELEGATION
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `resource_ownerships` (
    `id` VARCHAR(36) NOT NULL,
    `resourceType` ENUM('CUSTOMER', 'LOAN_APPLICATION', 'RECOVERY_ACCOUNT', 'WORKFLOW_TASK') NOT NULL,
    `resourceId` VARCHAR(36) NOT NULL COMMENT 'Generic resource ID',
    `customerId` VARCHAR(36) NULL,
    `loanApplicationId` VARCHAR(36) NULL,
    `recoveryAccountId` VARCHAR(36) NULL,
    `workflowTaskId` VARCHAR(36) NULL,
    `ownerId` VARCHAR(36) NOT NULL,
    `assignedById` VARCHAR(36) NOT NULL,
    `effectiveFrom` DATE NOT NULL,
    `effectiveTo` DATE NULL COMMENT 'NULL = current owner',
    `reason` VARCHAR(500) NOT NULL,
    `reassignedAt` DATETIME(3) NULL,
    `relatedOffboardingId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    INDEX `resource_ownerships_resourceType_resourceId_idx`(`resourceType`, `resourceId`),
    INDEX `resource_ownerships_ownerId_effectiveTo_idx`(`ownerId`, `effectiveTo`),
    INDEX `resource_ownerships_customerId_idx`(`customerId`),
    INDEX `resource_ownerships_loanApplicationId_idx`(`loanApplicationId`),
    
    CONSTRAINT `resource_ownerships_customerId_fkey` 
        FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_ownerships_loanApplicationId_fkey` 
        FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_ownerships_ownerId_fkey` 
        FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_ownerships_assignedById_fkey` 
        FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resource_delegations` (
    `id` VARCHAR(36) NOT NULL,
    `resourceType` ENUM('CUSTOMER', 'LOAN_APPLICATION', 'RECOVERY_ACCOUNT', 'WORKFLOW_TASK') NOT NULL,
    `resourceId` VARCHAR(36) NOT NULL COMMENT 'Generic resource ID',
    `customerId` VARCHAR(36) NULL,
    `loanApplicationId` VARCHAR(36) NULL,
    `recoveryAccountId` VARCHAR(36) NULL,
    `workflowTaskId` VARCHAR(36) NULL,
    `delegatedFrom` VARCHAR(36) NOT NULL,
    `delegatedTo` VARCHAR(36) NOT NULL,
    `effectiveFrom` DATE NOT NULL,
    `effectiveTo` DATE NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `acceptedAt` DATETIME(3) NULL,
    `responseNotes` TEXT NULL,
    `revokedAt` DATETIME(3) NULL,
    `revokedById` VARCHAR(36) NULL,
    `revocationReason` VARCHAR(500) NULL,
    `relatedLeaveId` VARCHAR(36) NULL,
    `relatedOffboardingId` VARCHAR(36) NULL,
    `canRead` BOOLEAN NOT NULL DEFAULT TRUE,
    `canUpdate` BOOLEAN NOT NULL DEFAULT FALSE,
    `canApproveLoans` BOOLEAN NOT NULL DEFAULT FALSE,
    `canDisburse` BOOLEAN NOT NULL DEFAULT FALSE,
    `canCollect` BOOLEAN NOT NULL DEFAULT FALSE,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    
    PRIMARY KEY (`id`),
    INDEX `resource_delegations_resourceType_resourceId_idx`(`resourceType`, `resourceId`),
    INDEX `resource_delegations_delegatedTo_status_idx`(`delegatedTo`, `status`),
    INDEX `resource_delegations_status_effectiveTo_idx`(`status`, `effectiveTo`),
    INDEX `resource_delegations_customerId_idx`(`customerId`),
    INDEX `resource_delegations_loanApplicationId_idx`(`loanApplicationId`),
    
    CONSTRAINT `resource_delegations_customerId_fkey` 
        FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_delegations_loanApplicationId_fkey` 
        FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_delegations_delegatedFrom_fkey` 
        FOREIGN KEY (`delegatedFrom`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_delegations_delegatedTo_fkey` 
        FOREIGN KEY (`delegatedTo`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `resource_delegations_relatedLeaveId_fkey` 
        FOREIGN KEY (`relatedLeaveId`) REFERENCES `leave_applications`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. OFFBOARDING
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `offboarding_cases` (
    `id` VARCHAR(36) NOT NULL,
    `caseNumber` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `employmentPeriodId` VARCHAR(36) NOT NULL,
    `exitDate` DATE NOT NULL,
    `exitReason` VARCHAR(500) NOT NULL,
    `isVoluntary` BOOLEAN NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `initiatedAt` DATETIME(3) NOT NULL,
    `initiatedById` VARCHAR(36) NOT NULL,
    `itAccessStatus` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `itAccessRevokedAt` DATETIME(3) NULL,
    `itAccessRevokedById` VARCHAR(36) NULL,
    `itAccessRevocationNotes` TEXT NULL,
    `financeCleared` BOOLEAN NULL COMMENT 'NULL = not yet processed',
    `financeClearedAt` DATETIME(3) NULL,
    `financeClearedById` VARCHAR(36) NULL,
    `outstandingFinanceAmount` DECIMAL(15, 2) NULL,
    `financeClearanceNotes` TEXT NULL,
    `assetCleared` BOOLEAN NULL COMMENT 'NULL = not yet processed',
    `assetClearedAt` DATETIME(3) NULL,
    `assetClearedById` VARCHAR(36) NULL,
    `outstandingAssets` TEXT NULL,
    `assetClearanceNotes` TEXT NULL,
    `hrCleared` BOOLEAN NULL COMMENT 'NULL = not yet processed',
    `hrClearedAt` DATETIME(3) NULL,
    `hrClearedById` VARCHAR(36) NULL,
    `hrClearanceNotes` TEXT NULL,
    `exitInterviewCompleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `exitInterviewDate` DATE NULL,
    `exitInterviewById` VARCHAR(36) NULL,
    `exitInterviewNotes` TEXT NULL,
    `completedAt` DATETIME(3) NULL,
    `completedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `offboarding_cases_caseNumber_key`(`caseNumber`),
    INDEX `offboarding_cases_userId_idx`(`userId`),
    INDEX `offboarding_cases_status_idx`(`status`),
    INDEX `offboarding_cases_exitDate_idx`(`exitDate`),
    
    CONSTRAINT `offboarding_cases_userId_fkey` 
        FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `offboarding_cases_employmentPeriodId_fkey` 
        FOREIGN KEY (`employmentPeriodId`) REFERENCES `employment_periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `offboarding_cases_initiatedById_fkey` 
        FOREIGN KEY (`initiatedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. APPROVAL POLICIES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `approval_policies` (
    `id` VARCHAR(36) NOT NULL,
    `entityType` ENUM('LEAVE_APPLICATION', 'STAFF_LOAN', 'EXPENSE_CLAIM', 'PURCHASE_REQUEST') NOT NULL,
    `policyName` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `levels` JSON NOT NULL COMMENT 'Approval level configuration',
    `version` INTEGER NOT NULL DEFAULT 1,
    `effectiveFrom` DATE NOT NULL,
    `effectiveTo` DATE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NOT NULL,
    
    PRIMARY KEY (`id`),
    INDEX `approval_policies_entityType_idx`(`entityType`),
    INDEX `approval_policies_effectiveFrom_effectiveTo_idx`(`effectiveFrom`, `effectiveTo`),
    
    CONSTRAINT `approval_policies_createdById_fkey` 
        FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

-- Show created tables
SELECT 'HR Module Tables Created:' AS info;
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
ORDER BY TABLE_NAME;

-- Count foreign keys
SELECT 'Foreign Key Constraints:' AS info;
SELECT COUNT(*) AS total_fk_constraints
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
AND CONSTRAINT_TYPE = 'FOREIGN KEY';

-- Count indexes
SELECT 'Indexes Created:' AS info;
SELECT COUNT(*) AS total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
AND INDEX_NAME != 'PRIMARY';

SET foreign_key_checks = 1;

-- ================================================================================
-- MIGRATION COMPLETE
-- ================================================================================
-- Next Steps:
-- 1. Review verification output above
-- 2. Execute ADD_HR_PERMISSIONS.sql to seed permissions
-- 3. Seed initial data (leave types, workweeks, holidays, policies)
-- 4. Test API endpoints
-- ================================================================================
