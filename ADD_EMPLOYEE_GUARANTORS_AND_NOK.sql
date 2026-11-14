-- Add Employee Guarantors and Next of Kin Tables
-- Run this on Hostinger database

-- Create employee_guarantors table
CREATE TABLE IF NOT EXISTS `employee_guarantors` (
  `id` VARCHAR(36) NOT NULL,
  `employmentPeriodId` VARCHAR(36) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NULL,
  `relationship` VARCHAR(100) NOT NULL,
  `address` VARCHAR(500) NULL,
  `occupation` VARCHAR(150) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `employee_guarantors_employmentPeriodId_idx` (`employmentPeriodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create employee_next_of_kin table
CREATE TABLE IF NOT EXISTS `employee_next_of_kin` (
  `id` VARCHAR(36) NOT NULL,
  `employmentPeriodId` VARCHAR(36) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NULL,
  `relationship` VARCHAR(100) NOT NULL,
  `address` VARCHAR(500) NULL,
  `isPrimary` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `employee_next_of_kin_employmentPeriodId_idx` (`employmentPeriodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables created
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('employee_guarantors', 'employee_next_of_kin')
ORDER BY TABLE_NAME;
