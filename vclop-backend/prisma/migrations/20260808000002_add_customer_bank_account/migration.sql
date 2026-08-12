-- Customer bank account details — used for Paystack DVA BVN validation
ALTER TABLE `customers`
  ADD COLUMN `bankAccountNumber` VARCHAR(20) NULL AFTER `nin`,
  ADD COLUMN `bankCode`          VARCHAR(10) NULL AFTER `bankAccountNumber`;
