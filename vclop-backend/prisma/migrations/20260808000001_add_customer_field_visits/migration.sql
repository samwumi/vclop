-- Make loanApplicationId optional so field visits can be linked to a
-- customer directly (KYC verification visit) without a loan application.
ALTER TABLE `field_visits`
  MODIFY `loanApplicationId` VARCHAR(36) NULL;

-- Add customerId so compliance can log visits against a customer profile
ALTER TABLE `field_visits`
  ADD COLUMN `customerId` VARCHAR(36) NULL AFTER `loanApplicationId`;

ALTER TABLE `field_visits`
  ADD INDEX `field_visits_customerId_idx`(`customerId`);
