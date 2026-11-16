-- Add External Work History table for employees to record their previous jobs from other companies
-- This is different from EmploymentPeriod which tracks employment within THIS company

CREATE TABLE IF NOT EXISTS `employee_work_history` (
  `id` VARCHAR(36) NOT NULL,
  `employmentPeriodId` VARCHAR(36) NOT NULL,
  `companyName` VARCHAR(200) NOT NULL,
  `position` VARCHAR(200) NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE,
  `responsibilities` TEXT,
  `reasonForLeaving` VARCHAR(500),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `employee_work_history_employmentPeriodId_idx`(`employmentPeriodId`),
  INDEX `employee_work_history_startDate_idx`(`startDate`),
  
  CONSTRAINT `employee_work_history_employmentPeriodId_fkey` 
    FOREIGN KEY (`employmentPeriodId`) REFERENCES `employment_periods`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SELECT 'Table created successfully!' AS result;
DESCRIBE employee_work_history;
