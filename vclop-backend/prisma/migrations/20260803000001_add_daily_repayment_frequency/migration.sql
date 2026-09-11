-- Add DAILY to RepaymentFrequency enum
ALTER TABLE `loan_products` MODIFY COLUMN `repaymentFrequency` ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY') NOT NULL DEFAULT 'WEEKLY';
