-- Create officer_targets table for tracking monthly performance targets
CREATE TABLE IF NOT EXISTS `officer_targets` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `targetMonth` DATE NOT NULL COMMENT 'First day of the target month',
  `disbursementTarget` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Target disbursement amount for the month',
  `customerTarget` INT NOT NULL DEFAULT 0 COMMENT 'Target number of new customers to register',
  `disbursementAchieved` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Actual disbursement amount achieved',
  `customerAchieved` INT NOT NULL DEFAULT 0 COMMENT 'Actual number of customers registered',
  `notes` TEXT NULL COMMENT 'Additional notes or comments',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdById` VARCHAR(36) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `officer_targets_userId_targetMonth_key` (`userId`, `targetMonth`),
  KEY `officer_targets_userId_idx` (`userId`),
  KEY `officer_targets_targetMonth_idx` (`targetMonth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example: Set targets for October 2026
-- INSERT INTO officer_targets (id, userId, targetMonth, disbursementTarget, customerTarget, createdById)
-- VALUES (UUID(), 'officer-user-id', '2026-10-01', 5000000.00, 20, 'admin-user-id');
