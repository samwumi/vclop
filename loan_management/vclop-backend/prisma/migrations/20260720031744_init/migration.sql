-- CreateTable
CREATE TABLE `branches` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(500) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    `postalCode` VARCHAR(20) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(150) NULL,
    `managerName` VARCHAR(150) NULL,
    `isHeadOffice` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `branches_code_key`(`code`),
    INDEX `branches_code_idx`(`code`),
    INDEX `branches_isActive_idx`(`isActive`),
    INDEX `branches_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `parentId` VARCHAR(36) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `departments_code_key`(`code`),
    INDEX `departments_parentId_idx`(`parentId`),
    INDEX `departments_isActive_idx`(`isActive`),
    INDEX `departments_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `category` ENUM('USER_MANAGEMENT', 'ROLE_MANAGEMENT', 'PERMISSION_MANAGEMENT', 'BRANCH_MANAGEMENT', 'DEPARTMENT_MANAGEMENT', 'SETTINGS_MANAGEMENT', 'AUDIT_MANAGEMENT', 'DASHBOARD_MANAGEMENT', 'REPORT_MANAGEMENT', 'NOTIFICATION_MANAGEMENT', 'SYSTEM_ADMINISTRATION', 'FORMS_MANAGEMENT', 'CUSTOMER_MANAGEMENT', 'DOCUMENT_MANAGEMENT', 'LOAN_MANAGEMENT', 'VIRTUAL_ACCOUNT_MANAGEMENT') NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_code_idx`(`code`),
    INDEX `permissions_category_idx`(`category`),
    INDEX `permissions_module_idx`(`module`),
    INDEX `permissions_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    INDEX `roles_code_idx`(`code`),
    INDEX `roles_isActive_idx`(`isActive`),
    INDEX `roles_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(36) NOT NULL,
    `roleId` VARCHAR(36) NOT NULL,
    `permissionId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,

    INDEX `role_permissions_roleId_idx`(`roleId`),
    INDEX `role_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `employeeId` VARCHAR(30) NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `username` VARCHAR(50) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(80) NOT NULL,
    `middleName` VARCHAR(80) NULL,
    `lastName` VARCHAR(80) NOT NULL,
    `suffix` VARCHAR(20) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `dateOfBirth` DATE NULL,
    `avatarPath` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'LOCKED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `departmentId` VARCHAR(36) NULL,
    `branchId` VARCHAR(36) NULL,
    `supervisorId` VARCHAR(36) NULL,
    `jobTitle` VARCHAR(100) NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `phoneVerifiedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(45) NULL,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(255) NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
    `locale` VARCHAR(10) NOT NULL DEFAULT 'en-PH',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,

    UNIQUE INDEX `users_employeeId_key`(`employeeId`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_employeeId_idx`(`employeeId`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_departmentId_idx`(`departmentId`),
    INDEX `users_branchId_idx`(`branchId`),
    INDEX `users_supervisorId_idx`(`supervisorId`),
    INDEX `users_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `roleId` VARCHAR(36) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedById` VARCHAR(36) NULL,
    `expiresAt` DATETIME(3) NULL,

    INDEX `user_roles_userId_idx`(`userId`),
    INDEX `user_roles_roleId_idx`(`roleId`),
    UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permissions` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `permissionId` VARCHAR(36) NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT true,
    `reason` VARCHAR(500) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedById` VARCHAR(36) NULL,
    `expiresAt` DATETIME(3) NULL,

    INDEX `user_permissions_userId_idx`(`userId`),
    INDEX `user_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `user_permissions_userId_permissionId_key`(`userId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `type` ENUM('REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFICATION', 'PHONE_VERIFICATION') NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `hashedToken` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tokens_token_key`(`token`),
    INDEX `tokens_userId_idx`(`userId`),
    INDEX `tokens_type_idx`(`type`),
    INDEX `tokens_hashedToken_idx`(`hashedToken`),
    INDEX `tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `defaultValue` TEXT NULL,
    `type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'EMAIL', 'URL', 'PHONE', 'COLOR', 'TEXTAREA') NOT NULL DEFAULT 'STRING',
    `scope` ENUM('SYSTEM', 'BRANCH', 'USER') NOT NULL DEFAULT 'SYSTEM',
    `branchId` VARCHAR(36) NULL,
    `label` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `group` VARCHAR(50) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isReadonly` BOOLEAN NOT NULL DEFAULT false,
    `isEncrypted` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `validationRules` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedById` VARCHAR(36) NULL,

    INDEX `settings_key_idx`(`key`),
    INDEX `settings_scope_idx`(`scope`),
    INDEX `settings_group_idx`(`group`),
    INDEX `settings_branchId_idx`(`branchId`),
    UNIQUE INDEX `settings_key_scope_branchId_key`(`key`, `scope`, `branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `userEmail` VARCHAR(150) NULL,
    `userFullName` VARCHAR(200) NULL,
    `action` ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'SUBMIT', 'CANCEL', 'RESTORE', 'LOCK', 'UNLOCK', 'SYSTEM') NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `subModule` VARCHAR(50) NULL,
    `entityId` VARCHAR(36) NULL,
    `entityType` VARCHAR(100) NULL,
    `description` VARCHAR(1000) NULL,
    `oldValues` JSON NULL,
    `newValues` JSON NULL,
    `changedFields` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `browser` VARCHAR(100) NULL,
    `os` VARCHAR(100) NULL,
    `device` VARCHAR(100) NULL,
    `branchId` VARCHAR(36) NULL,
    `requestId` VARCHAR(36) NULL,
    `duration` INTEGER NULL,
    `statusCode` INTEGER NULL,
    `isSuccess` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` VARCHAR(1000) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_module_idx`(`module`),
    INDEX `audit_logs_entityId_idx`(`entityId`),
    INDEX `audit_logs_entityType_idx`(`entityType`),
    INDEX `audit_logs_branchId_idx`(`branchId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_isSuccess_idx`(`isSuccess`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `widgets` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `type` ENUM('STAT_CARD', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART', 'DONUT_CHART', 'TABLE', 'LIST', 'CALENDAR', 'MAP', 'CUSTOM') NOT NULL,
    `size` ENUM('SMALL', 'MEDIUM', 'LARGE', 'WIDE', 'FULL') NOT NULL DEFAULT 'MEDIUM',
    `component` VARCHAR(100) NOT NULL,
    `dataEndpoint` VARCHAR(255) NULL,
    `refreshInterval` INTEGER NULL,
    `requiredPermission` VARCHAR(100) NULL,
    `defaultConfig` JSON NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `widgets_code_key`(`code`),
    INDEX `widgets_code_idx`(`code`),
    INDEX `widgets_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_layouts` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dashboard_layouts_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboard_layout_items` (
    `id` VARCHAR(36) NOT NULL,
    `layoutId` VARCHAR(36) NOT NULL,
    `widgetId` VARCHAR(36) NOT NULL,
    `posX` INTEGER NOT NULL DEFAULT 0,
    `posY` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NOT NULL DEFAULT 2,
    `height` INTEGER NOT NULL DEFAULT 1,
    `config` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dashboard_layout_items_layoutId_idx`(`layoutId`),
    INDEX `dashboard_layout_items_widgetId_idx`(`widgetId`),
    UNIQUE INDEX `dashboard_layout_items_layoutId_widgetId_key`(`layoutId`, `widgetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH') NOT NULL,
    `subject` VARCHAR(255) NULL,
    `bodyHtml` LONGTEXT NULL,
    `bodyText` TEXT NULL,
    `variables` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_templates_code_key`(`code`),
    INDEX `notification_templates_event_idx`(`event`),
    INDEX `notification_templates_channel_idx`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_logs` (
    `id` VARCHAR(36) NOT NULL,
    `recipientId` VARCHAR(36) NULL,
    `recipientRef` VARCHAR(200) NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH') NOT NULL,
    `templateCode` VARCHAR(100) NULL,
    `event` VARCHAR(100) NULL,
    `subject` VARCHAR(255) NULL,
    `body` TEXT NULL,
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notification_logs_recipientId_idx`(`recipientId`),
    INDEX `notification_logs_channel_idx`(`channel`),
    INDEX `notification_logs_status_idx`(`status`),
    INDEX `notification_logs_event_idx`(`event`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `event` VARCHAR(100) NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'PUSH') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notification_preferences_userId_idx`(`userId`),
    INDEX `notification_preferences_event_idx`(`event`),
    UNIQUE INDEX `notification_preferences_userId_event_channel_key`(`userId`, `event`, `channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_templates` (
    `id` VARCHAR(36) NOT NULL,
    `entityType` ENUM('CUSTOMER', 'LOAN', 'BUSINESS', 'GUARANTOR', 'COLLATERAL') NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `form_templates_code_key`(`code`),
    INDEX `form_templates_entityType_idx`(`entityType`),
    INDEX `form_templates_isActive_idx`(`isActive`),
    INDEX `form_templates_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_sections` (
    `id` VARCHAR(36) NOT NULL,
    `formTemplateId` VARCHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `form_sections_formTemplateId_idx`(`formTemplateId`),
    INDEX `form_sections_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_fields` (
    `id` VARCHAR(36) NOT NULL,
    `sectionId` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `label` VARCHAR(150) NOT NULL,
    `type` ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'MONEY', 'DATE', 'PHONE', 'EMAIL', 'BVN', 'NIN', 'FILE_UPLOAD', 'PHOTO_UPLOAD', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'MULTI_SELECT', 'SWITCH', 'ADDRESS', 'GPS', 'HIDDEN', 'FORMULA') NOT NULL,
    `placeholder` VARCHAR(200) NULL,
    `helpText` VARCHAR(500) NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `defaultValue` JSON NULL,
    `options` JSON NULL,
    `validation` JSON NULL,
    `visibilityRule` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `form_fields_sectionId_idx`(`sectionId`),
    INDEX `form_fields_sortOrder_idx`(`sortOrder`),
    UNIQUE INDEX `form_fields_sectionId_code_key`(`sectionId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_submissions` (
    `id` VARCHAR(36) NOT NULL,
    `formTemplateId` VARCHAR(36) NOT NULL,
    `entityType` ENUM('CUSTOMER', 'LOAN', 'BUSINESS', 'GUARANTOR', 'COLLATERAL') NOT NULL,
    `entityId` VARCHAR(36) NOT NULL,
    `submittedById` VARCHAR(36) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isComplete` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `form_submissions_formTemplateId_idx`(`formTemplateId`),
    INDEX `form_submissions_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_field_values` (
    `id` VARCHAR(36) NOT NULL,
    `submissionId` VARCHAR(36) NOT NULL,
    `fieldId` VARCHAR(36) NOT NULL,
    `value` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `form_field_values_submissionId_idx`(`submissionId`),
    INDEX `form_field_values_fieldId_idx`(`fieldId`),
    UNIQUE INDEX `form_field_values_submissionId_fieldId_key`(`submissionId`, `fieldId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_types` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `appliesTo` ENUM('INDIVIDUAL', 'BUSINESS') NULL,
    `isRequiredDefault` BOOLEAN NOT NULL DEFAULT false,
    `expiryApplicable` BOOLEAN NOT NULL DEFAULT false,
    `allowedMimeTypes` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `document_types_code_key`(`code`),
    INDEX `document_types_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(36) NOT NULL,
    `customerNumber` VARCHAR(20) NOT NULL,
    `type` ENUM('INDIVIDUAL', 'BUSINESS') NOT NULL DEFAULT 'INDIVIDUAL',
    `status` ENUM('PROSPECT', 'REGISTERED', 'KYC_PENDING', 'KYC_VERIFIED', 'ELIGIBLE', 'INELIGIBLE', 'BLACKLISTED') NOT NULL DEFAULT 'PROSPECT',
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `middleName` VARCHAR(100) NULL,
    `businessName` VARCHAR(200) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `alternatePhone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `bvn` VARCHAR(11) NULL,
    `nin` VARCHAR(11) NULL,
    `residentialAddress` VARCHAR(500) NULL,
    `businessAddress` VARCHAR(500) NULL,
    `gpsLat` DOUBLE NULL,
    `gpsLng` DOUBLE NULL,
    `branchId` VARCHAR(36) NULL,
    `assignedOfficerId` VARCHAR(36) NULL,
    `profileCompletion` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `customers_customerNumber_key`(`customerNumber`),
    UNIQUE INDEX `customers_phone_key`(`phone`),
    UNIQUE INDEX `customers_email_key`(`email`),
    UNIQUE INDEX `customers_bvn_key`(`bvn`),
    UNIQUE INDEX `customers_nin_key`(`nin`),
    INDEX `customers_status_idx`(`status`),
    INDEX `customers_branchId_idx`(`branchId`),
    INDEX `customers_assignedOfficerId_idx`(`assignedOfficerId`),
    INDEX `customers_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_documents` (
    `id` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `documentTypeId` VARCHAR(36) NOT NULL,
    `fileKey` VARCHAR(500) NOT NULL,
    `fileUrl` VARCHAR(1000) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` VARCHAR(500) NULL,
    `expiryDate` DATETIME(3) NULL,
    `uploadedById` VARCHAR(36) NULL,
    `verifiedById` VARCHAR(36) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customer_documents_customerId_idx`(`customerId`),
    INDEX `customer_documents_documentTypeId_idx`(`documentTypeId`),
    INDEX `customer_documents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_products` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `minAmount` DECIMAL(14, 2) NOT NULL,
    `maxAmount` DECIMAL(14, 2) NOT NULL,
    `minTenureDays` INTEGER NOT NULL,
    `maxTenureDays` INTEGER NOT NULL,
    `interestType` ENUM('FLAT', 'REDUCING_BALANCE') NOT NULL,
    `interestRate` DECIMAL(6, 3) NOT NULL,
    `repaymentFrequency` ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY') NOT NULL,
    `gracePeriodDays` INTEGER NOT NULL DEFAULT 0,
    `lateFeeAmount` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `penaltyRate` DECIMAL(6, 3) NOT NULL DEFAULT 0,
    `processingFeeRate` DECIMAL(6, 3) NOT NULL DEFAULT 0,
    `insuranceRate` DECIMAL(6, 3) NOT NULL DEFAULT 0,
    `requiresGuarantor` BOOLEAN NOT NULL DEFAULT false,
    `requiresCollateral` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `loan_products_code_key`(`code`),
    INDEX `loan_products_isActive_idx`(`isActive`),
    INDEX `loan_products_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_product_document_requirements` (
    `id` VARCHAR(36) NOT NULL,
    `loanProductId` VARCHAR(36) NOT NULL,
    `documentTypeId` VARCHAR(36) NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `loan_product_document_requirements_loanProductId_documentTyp_key`(`loanProductId`, `documentTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_applications` (
    `id` VARCHAR(36) NOT NULL,
    `applicationNumber` VARCHAR(20) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `loanProductId` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `tenureDays` INTEGER NOT NULL,
    `purpose` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `submittedById` VARCHAR(36) NULL,
    `submittedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(36) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` VARCHAR(500) NULL,
    `rejectionReason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `loan_applications_applicationNumber_key`(`applicationNumber`),
    INDEX `loan_applications_customerId_idx`(`customerId`),
    INDEX `loan_applications_loanProductId_idx`(`loanProductId`),
    INDEX `loan_applications_status_idx`(`status`),
    INDEX `loan_applications_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guarantors` (
    `id` VARCHAR(36) NOT NULL,
    `loanApplicationId` VARCHAR(36) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `relationship` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `guarantors_loanApplicationId_idx`(`loanApplicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collaterals` (
    `id` VARCHAR(36) NOT NULL,
    `loanApplicationId` VARCHAR(36) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `estimatedValue` DECIMAL(14, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `collaterals_loanApplicationId_idx`(`loanApplicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loans` (
    `id` VARCHAR(36) NOT NULL,
    `loanNumber` VARCHAR(20) NOT NULL,
    `loanApplicationId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `loanProductId` VARCHAR(36) NOT NULL,
    `principal` DECIMAL(14, 2) NOT NULL,
    `interestRate` DECIMAL(6, 3) NOT NULL,
    `interestType` ENUM('FLAT', 'REDUCING_BALANCE') NOT NULL,
    `tenureDays` INTEGER NOT NULL,
    `totalRepayable` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF') NOT NULL DEFAULT 'ACTIVE',
    `disbursedById` VARCHAR(36) NULL,
    `disbursedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loans_loanNumber_key`(`loanNumber`),
    UNIQUE INDEX `loans_loanApplicationId_key`(`loanApplicationId`),
    INDEX `loans_customerId_idx`(`customerId`),
    INDEX `loans_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repayment_installments` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `principalDue` DECIMAL(14, 2) NOT NULL,
    `interestDue` DECIMAL(14, 2) NOT NULL,
    `totalDue` DECIMAL(14, 2) NOT NULL,
    `amountPaid` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,

    INDEX `repayment_installments_loanId_idx`(`loanId`),
    INDEX `repayment_installments_status_idx`(`status`),
    UNIQUE INDEX `repayment_installments_loanId_installmentNumber_key`(`loanId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repayment_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `receiptNumber` VARCHAR(20) NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `method` VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    `reference` VARCHAR(100) NULL,
    `notes` VARCHAR(500) NULL,
    `recordedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `repayment_transactions_receiptNumber_key`(`receiptNumber`),
    INDEX `repayment_transactions_loanId_idx`(`loanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `virtual_accounts` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `provider` ENUM('LOCAL', 'PAYSTACK', 'PROVIDUS', 'MONNIFY', 'FLUTTERWAVE', 'WEMA') NOT NULL,
    `providerCustomerId` VARCHAR(100) NULL,
    `providerAccountId` VARCHAR(100) NULL,
    `accountNumber` VARCHAR(20) NOT NULL,
    `accountName` VARCHAR(150) NOT NULL,
    `bankName` VARCHAR(100) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `virtual_accounts_loanId_key`(`loanId`),
    UNIQUE INDEX `virtual_accounts_accountNumber_key`(`accountNumber`),
    INDEX `virtual_accounts_customerId_idx`(`customerId`),
    INDEX `virtual_accounts_accountNumber_idx`(`accountNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `virtual_account_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `virtualAccountId` VARCHAR(36) NULL,
    `targetAccountNumber` VARCHAR(20) NOT NULL,
    `provider` ENUM('LOCAL', 'PAYSTACK', 'PROVIDUS', 'MONNIFY', 'FLUTTERWAVE', 'WEMA') NOT NULL,
    `providerReference` VARCHAR(150) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'NGN',
    `payerName` VARCHAR(150) NULL,
    `payerAccountNumber` VARCHAR(20) NULL,
    `narration` VARCHAR(500) NULL,
    `status` ENUM('MATCHED', 'UNMATCHED', 'RECONCILED') NOT NULL DEFAULT 'UNMATCHED',
    `repaymentTransactionId` VARCHAR(36) NULL,
    `receivedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `virtual_account_transactions_providerReference_key`(`providerReference`),
    INDEX `virtual_account_transactions_virtualAccountId_idx`(`virtualAccountId`),
    INDEX `virtual_account_transactions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_layouts` ADD CONSTRAINT `dashboard_layouts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_layout_items` ADD CONSTRAINT `dashboard_layout_items_layoutId_fkey` FOREIGN KEY (`layoutId`) REFERENCES `dashboard_layouts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_layout_items` ADD CONSTRAINT `dashboard_layout_items_widgetId_fkey` FOREIGN KEY (`widgetId`) REFERENCES `widgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_sections` ADD CONSTRAINT `form_sections_formTemplateId_fkey` FOREIGN KEY (`formTemplateId`) REFERENCES `form_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_fields` ADD CONSTRAINT `form_fields_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `form_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_formTemplateId_fkey` FOREIGN KEY (`formTemplateId`) REFERENCES `form_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_field_values` ADD CONSTRAINT `form_field_values_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `form_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_field_values` ADD CONSTRAINT `form_field_values_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `form_fields`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_documents` ADD CONSTRAINT `customer_documents_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_documents` ADD CONSTRAINT `customer_documents_documentTypeId_fkey` FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_product_document_requirements` ADD CONSTRAINT `loan_product_document_requirements_loanProductId_fkey` FOREIGN KEY (`loanProductId`) REFERENCES `loan_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_product_document_requirements` ADD CONSTRAINT `loan_product_document_requirements_documentTypeId_fkey` FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_applications` ADD CONSTRAINT `loan_applications_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_applications` ADD CONSTRAINT `loan_applications_loanProductId_fkey` FOREIGN KEY (`loanProductId`) REFERENCES `loan_products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guarantors` ADD CONSTRAINT `guarantors_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collaterals` ADD CONSTRAINT `collaterals_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loans` ADD CONSTRAINT `loans_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repayment_installments` ADD CONSTRAINT `repayment_installments_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repayment_transactions` ADD CONSTRAINT `repayment_transactions_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `virtual_accounts` ADD CONSTRAINT `virtual_accounts_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `virtual_account_transactions` ADD CONSTRAINT `virtual_account_transactions_virtualAccountId_fkey` FOREIGN KEY (`virtualAccountId`) REFERENCES `virtual_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
