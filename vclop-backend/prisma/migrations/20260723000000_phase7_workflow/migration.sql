-- VCLOP Phase 7: configurable approval workflow and operational lending records.
ALTER TABLE `loan_applications` MODIFY `status` ENUM('DRAFT', 'SUBMITTED', 'COMPLIANCE_REVIEW', 'AWAITING_INFORMATION', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED', 'DISBURSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

CREATE TABLE `workflow_definitions` (
  `id` VARCHAR(36) NOT NULL, `code` VARCHAR(100) NOT NULL, `name` VARCHAR(150) NOT NULL, `entityType` VARCHAR(100) NOT NULL, `description` VARCHAR(500) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true, `version` INTEGER NOT NULL DEFAULT 1, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `workflow_definitions_code_key`(`code`), INDEX `workflow_definitions_entityType_isActive_idx`(`entityType`, `isActive`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workflow_stages` (
  `id` VARCHAR(36) NOT NULL, `workflowDefinitionId` VARCHAR(36) NOT NULL, `code` VARCHAR(100) NOT NULL, `name` VARCHAR(150) NOT NULL, `description` VARCHAR(500) NULL,
  `sortOrder` INTEGER NOT NULL, `requiredPermission` VARCHAR(100) NULL, `departmentCode` VARCHAR(50) NULL, `slaHours` INTEGER NULL, `isInitial` BOOLEAN NOT NULL DEFAULT false,
  `isTerminal` BOOLEAN NOT NULL DEFAULT false, `allowedActions` JSON NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `workflow_stages_workflowDefinitionId_code_key`(`workflowDefinitionId`, `code`), INDEX `workflow_stages_workflowDefinitionId_sortOrder_idx`(`workflowDefinitionId`, `sortOrder`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workflow_transitions` (
  `id` VARCHAR(36) NOT NULL, `fromStageId` VARCHAR(36) NOT NULL, `toStageId` VARCHAR(36) NOT NULL,
  `action` ENUM('APPROVE', 'REJECT', 'RETURN', 'REQUEST_INFORMATION', 'ESCALATE', 'COMPLETE') NOT NULL, `name` VARCHAR(150) NULL, `requiresReason` BOOLEAN NOT NULL DEFAULT false, `conditions` JSON NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `workflow_transitions_fromStageId_toStageId_action_key`(`fromStageId`, `toStageId`, `action`), INDEX `workflow_transitions_fromStageId_action_idx`(`fromStageId`, `action`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workflow_instances` (
  `id` VARCHAR(36) NOT NULL, `workflowDefinitionId` VARCHAR(36) NOT NULL, `entityType` VARCHAR(100) NOT NULL, `entityId` VARCHAR(36) NOT NULL, `currentStageCode` VARCHAR(100) NOT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING', `startedById` VARCHAR(36) NULL, `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `completedAt` DATETIME(3) NULL, `metadata` JSON NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `workflow_instances_workflowDefinitionId_entityId_key`(`workflowDefinitionId`, `entityId`), INDEX `workflow_instances_entityType_entityId_idx`(`entityType`, `entityId`), INDEX `workflow_instances_currentStageCode_status_idx`(`currentStageCode`, `status`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workflow_tasks` (
  `id` VARCHAR(36) NOT NULL, `workflowInstanceId` VARCHAR(36) NOT NULL, `stageId` VARCHAR(36) NOT NULL, `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  `assignedToId` VARCHAR(36) NULL, `assignedAt` DATETIME(3) NULL, `dueAt` DATETIME(3) NULL, `completedById` VARCHAR(36) NULL, `completedAt` DATETIME(3) NULL,
  `action` ENUM('APPROVE', 'REJECT', 'RETURN', 'REQUEST_INFORMATION', 'ESCALATE', 'COMPLETE') NULL, `reason` VARCHAR(1000) NULL, `notes` TEXT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  INDEX `workflow_tasks_workflowInstanceId_status_idx`(`workflowInstanceId`, `status`), INDEX `workflow_tasks_assignedToId_status_idx`(`assignedToId`, `status`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `compliance_assessments` (
  `id` VARCHAR(36) NOT NULL, `loanApplicationId` VARCHAR(36) NOT NULL, `assignedToId` VARCHAR(36) NULL, `bankStatementNotes` TEXT NULL, `incomeAssessment` TEXT NULL, `affordabilityScore` DECIMAL(7,2) NULL, `cashFlowAssessment` TEXT NULL, `creditBureauResult` JSON NULL,
  `bvnVerifiedAt` DATETIME(3) NULL, `ninVerifiedAt` DATETIME(3) NULL, `phoneVerifiedAt` DATETIME(3) NULL, `employerVerifiedAt` DATETIME(3) NULL, `businessVerifiedAt` DATETIME(3) NULL, `residenceVerifiedAt` DATETIME(3) NULL, `riskScore` DECIMAL(7,2) NULL,
  `recommendation` ENUM('APPROVE', 'REJECT', 'RETURN', 'REQUEST_INFORMATION', 'ESCALATE', 'COMPLETE') NULL, `recommendationNotes` TEXT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `compliance_assessments_loanApplicationId_key`(`loanApplicationId`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `field_visits` (
  `id` VARCHAR(36) NOT NULL, `loanApplicationId` VARCHAR(36) NOT NULL, `visitType` VARCHAR(50) NOT NULL, `conductedById` VARCHAR(36) NULL, `latitude` DECIMAL(10,8) NULL, `longitude` DECIMAL(11,8) NULL, `arrivedAt` DATETIME(3) NULL, `completedAt` DATETIME(3) NULL, `findings` TEXT NULL, `photos` JSON NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  INDEX `field_visits_loanApplicationId_idx`(`loanApplicationId`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `transport_requests` (
  `id` VARCHAR(36) NOT NULL, `loanApplicationId` VARCHAR(36) NOT NULL, `requestedById` VARCHAR(36) NOT NULL, `purpose` VARCHAR(500) NOT NULL, `location` VARCHAR(500) NOT NULL, `distanceKm` DECIMAL(10,2) NULL, `estimatedCost` DECIMAL(14,2) NULL, `suggestedAmount` DECIMAL(14,2) NULL, `approvedAmount` DECIMAL(14,2) NULL,
  `status` ENUM('PENDING', 'OPERATIONS_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', `reviewedById` VARCHAR(36) NULL, `reviewedAt` DATETIME(3) NULL, `paidById` VARCHAR(36) NULL, `paidAt` DATETIME(3) NULL, `reason` VARCHAR(1000) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  INDEX `transport_requests_loanApplicationId_status_idx`(`loanApplicationId`, `status`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `collection_cases` (
  `id` VARCHAR(36) NOT NULL, `loanId` VARCHAR(36) NOT NULL, `assignedToId` VARCHAR(36) NULL, `status` ENUM('OPEN', 'PROMISE_TO_PAY', 'BROKEN_PROMISE', 'LEGAL', 'RESOLVED', 'WRITTEN_OFF') NOT NULL DEFAULT 'OPEN', `nextActionAt` DATETIME(3) NULL, `promiseAmount` DECIMAL(14,2) NULL, `promiseDate` DATETIME(3) NULL, `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `resolvedAt` DATETIME(3) NULL, `writeOffReason` VARCHAR(1000) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `collection_cases_loanId_key`(`loanId`), INDEX `collection_cases_assignedToId_status_idx`(`assignedToId`, `status`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `collection_activities` (
  `id` VARCHAR(36) NOT NULL, `collectionCaseId` VARCHAR(36) NOT NULL, `activityType` VARCHAR(50) NOT NULL, `note` TEXT NOT NULL, `performedById` VARCHAR(36) NULL, `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `nextActionAt` DATETIME(3) NULL, `metadata` JSON NULL,
  INDEX `collection_activities_collectionCaseId_occurredAt_idx`(`collectionCaseId`, `occurredAt`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `workflow_stages` ADD CONSTRAINT `workflow_stages_workflowDefinitionId_fkey` FOREIGN KEY (`workflowDefinitionId`) REFERENCES `workflow_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `workflow_transitions` ADD CONSTRAINT `workflow_transitions_fromStageId_fkey` FOREIGN KEY (`fromStageId`) REFERENCES `workflow_stages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `workflow_transitions` ADD CONSTRAINT `workflow_transitions_toStageId_fkey` FOREIGN KEY (`toStageId`) REFERENCES `workflow_stages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `workflow_instances` ADD CONSTRAINT `workflow_instances_workflowDefinitionId_fkey` FOREIGN KEY (`workflowDefinitionId`) REFERENCES `workflow_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `workflow_tasks` ADD CONSTRAINT `workflow_tasks_workflowInstanceId_fkey` FOREIGN KEY (`workflowInstanceId`) REFERENCES `workflow_instances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `workflow_tasks` ADD CONSTRAINT `workflow_tasks_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `workflow_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `collection_activities` ADD CONSTRAINT `collection_activities_collectionCaseId_fkey` FOREIGN KEY (`collectionCaseId`) REFERENCES `collection_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
