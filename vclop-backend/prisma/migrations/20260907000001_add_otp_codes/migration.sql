-- CreateTable
CREATE TABLE `otp_codes` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `type` ENUM('PASSWORD_CHANGE', 'EMAIL_VERIFICATION', 'TWO_FACTOR_AUTH') NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_codes_userId_idx`(`userId`),
    INDEX `otp_codes_email_idx`(`email`),
    INDEX `otp_codes_code_idx`(`code`),
    INDEX `otp_codes_type_idx`(`type`),
    INDEX `otp_codes_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `otp_codes` ADD CONSTRAINT `otp_codes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
