-- Add canViewLoans field to UserBranch table for location-based permissions
ALTER TABLE `user_branches` 
ADD COLUMN `canViewLoans` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `grantedById` VARCHAR(36),
ADD COLUMN `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
ADD COLUMN `revokedAt` DATETIME(3),
ADD INDEX `user_branches_canViewLoans_idx`(`canViewLoans`);

-- Update existing records to have canViewLoans = true for backward compatibility
UPDATE `user_branches` SET `canViewLoans` = true WHERE `canViewLoans` = false;
