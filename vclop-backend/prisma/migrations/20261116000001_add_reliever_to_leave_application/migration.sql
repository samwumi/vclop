-- Add reliever field to leave_applications table
ALTER TABLE `leave_applications` ADD COLUMN `relieverId` VARCHAR(36) NULL AFTER `emergencyPhone`;

-- Add foreign key constraint
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_relieverId_fkey` FOREIGN KEY (`relieverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX `leave_applications_relieverId_idx` ON `leave_applications`(`relieverId`);
