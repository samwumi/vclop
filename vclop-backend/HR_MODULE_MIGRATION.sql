-- ═══════════════════════════════════════════════════════════════════════════
-- HR & EMPLOYEE SELF-SERVICE MODULE - DATABASE MIGRATION
-- Architecture Version: 3.0
-- Date: October 28, 2026
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1: CREATE NEW TABLES
-- ───────────────────────────────────────────────────────────────────────────

-- Employment History
CREATE TABLE `employment_periods` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `periodNumber` INT NOT NULL,
  `hireDate` DATE NOT NULL,
  `terminationDate` DATE NULL,
  `lastWorkingDay` DATE NULL,
  `jobTitle` VARCHAR(200) NOT NULL,
  `departmentId` VARCHAR(36) NOT NULL,
  `branchId` VARCHAR(36) NOT NULL,
  `contractType` ENUM('PERMANENT', 'CONTRACT', 'PROBATION', 'INTERN', 'CONSULTANT') NOT NULL,
  `salary` DECIMAL(14, 2) NULL,
  `salaryEffectiveDate` DATE NULL,
  `terminationType` ENUM('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END', 'DEATH', 'ABSCONDING', 'MUTUAL_SEPARATION') NULL,
  `terminationReason` TEXT NULL,
  `isVoluntary` BOOLEAN NULL,
  `rehireEligible` BOOLEAN NOT NULL DEFAULT true,
  `isCurrent` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdById` VARCHAR(36) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employment_periods_userId_periodNumber_key` (`userId`, `periodNumber`),
  INDEX `employment_periods_userId_isCurrent_idx` (`userId`, `isCurrent`),
  INDEX `employment_periods_terminationDate_idx` (`terminationDate`),
  CONSTRAINT `employment_periods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `employment_periods_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `employment_periods_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `employment_periods_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Types
CREATE TABLE `leave_types` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `description` TEXT NULL,
  `defaultDaysPerYear` INT NOT NULL,
  `carryForwardAllowed` BOOLEAN NOT NULL DEFAULT false,
  `maxCarryForwardDays` INT NULL,
  `requiresApproval` BOOLEAN NOT NULL DEFAULT true,
  `minNoticeDays` INT NOT NULL DEFAULT 0,
  `maxConsecutiveDays` INT NULL,
  `allowHalfDay` BOOLEAN NOT NULL DEFAULT true,
  `prorateForMidYearJoiners` BOOLEAN NOT NULL DEFAULT true,
  `countWeekendsAsLeave` BOOLEAN NOT NULL DEFAULT false,
  `countHolidaysAsLeave` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leave_types_name_key` (`name`),
  UNIQUE KEY `leave_types_code_key` (`code`),
  INDEX `leave_types_code_idx` (`code`),
  INDEX `leave_types_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Entitlements
CREATE TABLE `leave_entitlements` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `leaveTypeId` VARCHAR(36) NOT NULL,
  `year` INT NOT NULL,
  `allocatedDays` DECIMAL(5, 1) NOT NULL,
  `carryForwardDays` DECIMAL(5, 1) NOT NULL DEFAULT 0,
  `adjustmentDays` DECIMAL(5, 1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdById` VARCHAR(36) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  `updatedById` VARCHAR(36) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leave_entitlements_userId_leaveTypeId_year_key` (`userId`, `leaveTypeId`, `year`),
  INDEX `leave_entitlements_userId_year_idx` (`userId`, `year`),
  INDEX `leave_entitlements_year_idx` (`year`),
  CONSTRAINT `leave_entitlements_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_entitlements_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_entitlements_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_entitlements_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Entitlement Adjustments
CREATE TABLE `leave_entitlement_adjustments` (
  `id` VARCHAR(36) NOT NULL,
  `entitlementId` VARCHAR(36) NOT NULL,
  `adjustmentDays` DECIMAL(5, 1) NOT NULL,
  `reason` TEXT NOT NULL,
  `approvedById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `leave_entitlement_adjustments_entitlementId_idx` (`entitlementId`),
  CONSTRAINT `leave_entitlement_adjustments_entitlementId_fkey` FOREIGN KEY (`entitlementId`) REFERENCES `leave_entitlements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_entitlement_adjustments_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Applications
CREATE TABLE `leave_applications` (
  `id` VARCHAR(36) NOT NULL,
  `applicationNumber` VARCHAR(20) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `leaveTypeId` VARCHAR(36) NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE NOT NULL,
  `startDayType` ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY',
  `endDayType` ENUM('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF') NOT NULL DEFAULT 'FULL_DAY',
  `businessDaysRequested` DECIMAL(5, 1) NOT NULL,
  `primaryEntitlementYear` INT NOT NULL,
  `secondaryEntitlementYear` INT NULL,
  `daysFromPrimaryYear` DECIMAL(5, 1) NULL,
  `daysFromSecondaryYear` DECIMAL(5, 1) NULL,
  `reason` TEXT NOT NULL,
  `handoverNotes` TEXT NULL,
  `emergencyContact` VARCHAR(100) NULL,
  `emergencyPhone` VARCHAR(20) NULL,
  `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `submittedAt` DATETIME(3) NULL,
  `submittedById` VARCHAR(36) NULL,
  `approvedById` VARCHAR(36) NULL,
  `approvedAt` DATETIME(3) NULL,
  `approvalNotes` TEXT NULL,
  `rejectedById` VARCHAR(36) NULL,
  `rejectedAt` DATETIME(3) NULL,
  `rejectionReason` VARCHAR(500) NULL,
  `cancelledById` VARCHAR(36) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `cancellationReason` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `leave_applications_applicationNumber_key` (`applicationNumber`),
  INDEX `leave_applications_userId_status_idx` (`userId`, `status`),
  INDEX `leave_applications_status_startDate_idx` (`status`, `startDate`),
  INDEX `leave_applications_leaveTypeId_idx` (`leaveTypeId`),
  INDEX `leave_applications_primaryEntitlementYear_idx` (`primaryEntitlementYear`),
  CONSTRAINT `leave_applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_applications_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_applications_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_applications_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_applications_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_applications_cancelledById_fkey` FOREIGN KEY (`cancelledById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Policies
CREATE TABLE `approval_policies` (
  `id` VARCHAR(36) NOT NULL,
  `entityType` ENUM('LEAVE_APPLICATION', 'STAFF_LOAN', 'RESOURCE_ASSIGNMENT') NOT NULL,
  `version` INT NOT NULL,
  `levels` LONGTEXT NOT NULL,
  `effectiveFrom` DATE NOT NULL,
  `effectiveTo` DATE NULL,
  `createdById` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `approval_policies_entityType_version_key` (`entityType`, `version`),
  INDEX `approval_policies_entityType_effectiveFrom_effectiveTo_idx` (`entityType`, `effectiveFrom`, `effectiveTo`),
  CONSTRAINT `approval_policies_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Approvals
CREATE TABLE `leave_approvals` (
  `id` VARCHAR(36) NOT NULL,
  `leaveApplicationId` VARCHAR(36) NOT NULL,
  `approvalLevel` INT NOT NULL,
  `approverId` VARCHAR(36) NOT NULL,
  `delegatedFromId` VARCHAR(36) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `decision` ENUM('APPROVE', 'REJECT', 'RETURN_FOR_INFO', 'ESCALATE') NULL,
  `decidedAt` DATETIME(3) NULL,
  `comments` TEXT NULL,
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `dueAt` DATETIME(3) NULL,
  `policyVersionId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `leave_approvals_leaveApplicationId_idx` (`leaveApplicationId`),
  INDEX `leave_approvals_approverId_status_idx` (`approverId`, `status`),
  INDEX `leave_approvals_status_dueAt_idx` (`status`, `dueAt`),
  CONSTRAINT `leave_approvals_leaveApplicationId_fkey` FOREIGN KEY (`leaveApplicationId`) REFERENCES `leave_applications` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_approvals_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_approvals_delegatedFromId_fkey` FOREIGN KEY (`delegatedFromId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_approvals_policyVersionId_fkey` FOREIGN KEY (`policyVersionId`) REFERENCES `approval_policies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Public Holidays
CREATE TABLE `public_holidays` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `date` DATE NOT NULL,
  `year` INT NOT NULL,
  `isRecurring` BOOLEAN NOT NULL DEFAULT false,
  `branchId` VARCHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_holidays_date_branchId_key` (`date`, `branchId`),
  INDEX `public_holidays_year_branchId_idx` (`year`, `branchId`),
  INDEX `public_holidays_date_idx` (`date`),
  CONSTRAINT `public_holidays_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Branch Workweeks
CREATE TABLE `branch_workweeks` (
  `id` VARCHAR(36) NOT NULL,
  `branchId` VARCHAR(36) NULL,
  `isSundayWorkday` BOOLEAN NOT NULL DEFAULT false,
  `isMondayWorkday` BOOLEAN NOT NULL DEFAULT true,
  `isTuesdayWorkday` BOOLEAN NOT NULL DEFAULT true,
  `isWednesdayWorkday` BOOLEAN NOT NULL DEFAULT true,
  `isThursdayWorkday` BOOLEAN NOT NULL DEFAULT true,
  `isFridayWorkday` BOOLEAN NOT NULL DEFAULT true,
  `isSaturdayWorkday` BOOLEAN NOT NULL DEFAULT false,
  `effectiveFrom` DATE NOT NULL,
  `effectiveTo` DATE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_workweeks_branchId_effectiveFrom_key` (`branchId`, `effectiveFrom`),
  INDEX `branch_workweeks_branchId_idx` (`branchId`),
  CONSTRAINT `branch_workweeks_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Continue with remaining tables in next message due to length...

