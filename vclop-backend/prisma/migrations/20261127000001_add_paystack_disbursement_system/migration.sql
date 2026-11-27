-- CreateTable
CREATE TABLE `disbursement_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `entityType` ENUM('LOAN', 'TRANSPORT', 'EXPENSE', 'STAFF_LOAN', 'SALARY', 'BONUS', 'OTHER') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `recipientType` ENUM('CUSTOMER', 'EMPLOYEE', 'VENDOR', 'OTHER') NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `recipientName` VARCHAR(150) NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'NGN',
    `purpose` VARCHAR(500) NULL,
    `accountNumber` VARCHAR(20) NULL,
    `accountName` VARCHAR(150) NULL,
    `bankCode` VARCHAR(10) NULL,
    `bankName` VARCHAR(100) NULL,
    `paystackTransferCode` VARCHAR(100) NULL,
    `paystackRecipientCode` VARCHAR(100) NULL,
    `paystackReference` VARCHAR(100) NULL,
    `paystackStatus` VARCHAR(50) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `initiatedById` VARCHAR(36) NULL,
    `initiatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `lastRetryAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disbursement_transactions_paystackTransferCode_key`(`paystackTransferCode`),
    UNIQUE INDEX `disbursement_transactions_paystackReference_key`(`paystackReference`),
    INDEX `disbursement_transactions_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `disbursement_transactions_recipientType_recipientId_idx`(`recipientType`, `recipientId`),
    INDEX `disbursement_transactions_status_idx`(`status`),
    INDEX `disbursement_transactions_paystackReference_idx`(`paystackReference`),
    INDEX `disbursement_transactions_initiatedAt_idx`(`initiatedAt`),
    INDEX `disbursement_transactions_initiatedById_fkey`(`initiatedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paystack_transfer_recipients` (
    `id` VARCHAR(36) NOT NULL,
    `ownerType` ENUM('CUSTOMER', 'EMPLOYEE', 'VENDOR', 'OTHER') NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `recipientCode` VARCHAR(100) NOT NULL,
    `accountNumber` VARCHAR(20) NOT NULL,
    `accountName` VARCHAR(150) NOT NULL,
    `bankCode` VARCHAR(10) NOT NULL,
    `bankName` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `paystack_transfer_recipients_recipientCode_key`(`recipientCode`),
    INDEX `paystack_transfer_recipients_ownerType_ownerId_idx`(`ownerType`, `ownerId`),
    INDEX `paystack_transfer_recipients_recipientCode_idx`(`recipientCode`),
    UNIQUE INDEX `paystack_transfer_recipients_ownerType_ownerId_key`(`ownerType`, `ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Add bank fields to users (for employees)
ALTER TABLE `users` 
ADD COLUMN `bankAccountNumber` VARCHAR(20) NULL,
ADD COLUMN `bankCode` VARCHAR(10) NULL,
ADD COLUMN `bankName` VARCHAR(100) NULL;

-- AlterTable: Add disbursement tracking to loan_applications
ALTER TABLE `loan_applications` 
ADD COLUMN `disbursementTransactionId` VARCHAR(36) NULL,
ADD COLUMN `disbursementStatus` VARCHAR(50) NULL DEFAULT 'NOT_INITIATED';

-- AlterTable: Add disbursement tracking to transport_requests
ALTER TABLE `transport_requests` 
ADD COLUMN `disbursementTransactionId` VARCHAR(36) NULL,
ADD COLUMN `reimbursementStatus` VARCHAR(50) NULL DEFAULT 'NOT_INITIATED';

-- AddForeignKey
ALTER TABLE `disbursement_transactions` 
ADD CONSTRAINT `disbursement_transactions_initiatedById_fkey` 
FOREIGN KEY (`initiatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add DISBURSEMENT_MANAGEMENT to PermissionCategory enum
ALTER TABLE `permissions` MODIFY `category` ENUM('USER_MANAGEMENT', 'ROLE_MANAGEMENT', 'PERMISSION_MANAGEMENT', 'BRANCH_MANAGEMENT', 'DEPARTMENT_MANAGEMENT', 'SETTINGS_MANAGEMENT', 'AUDIT_MANAGEMENT', 'DASHBOARD_MANAGEMENT', 'REPORT_MANAGEMENT', 'NOTIFICATION_MANAGEMENT', 'SYSTEM_ADMINISTRATION', 'FORMS_MANAGEMENT', 'CUSTOMER_MANAGEMENT', 'DOCUMENT_MANAGEMENT', 'LOAN_MANAGEMENT', 'VIRTUAL_ACCOUNT_MANAGEMENT', 'RECOVERY', 'DISBURSEMENT_MANAGEMENT') NOT NULL;
