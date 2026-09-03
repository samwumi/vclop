-- AlterTable: Remove old unique constraints and add composite unique constraints
-- This allows users with the same email/username/phone to be recreated after soft deletion

-- Drop existing unique constraints
ALTER TABLE `users` DROP INDEX `users_email_key`;
ALTER TABLE `users` DROP INDEX `users_username_key`;
ALTER TABLE `users` DROP INDEX `users_phone_key`;

-- Add composite unique constraints that include deletedAt
-- This ensures uniqueness only among non-deleted users (deletedAt = NULL)
ALTER TABLE `users` ADD UNIQUE KEY `users_email_deletedAt_key` (`email`, `deletedAt`);
ALTER TABLE `users` ADD UNIQUE KEY `users_username_deletedAt_key` (`username`, `deletedAt`);
ALTER TABLE `users` ADD UNIQUE KEY `users_phone_deletedAt_key` (`phone`, `deletedAt`);
