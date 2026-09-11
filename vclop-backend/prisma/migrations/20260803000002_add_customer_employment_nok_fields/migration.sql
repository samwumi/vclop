-- Add employment and next-of-kin fields to customers table
ALTER TABLE `customers`
  ADD COLUMN `employerName`    VARCHAR(200)     NULL AFTER `businessAddress`,
  ADD COLUMN `employmentType`  VARCHAR(50)      NULL AFTER `employerName`,
  ADD COLUMN `jobTitle`        VARCHAR(100)     NULL AFTER `employmentType`,
  ADD COLUMN `monthlyIncome`   DECIMAL(15, 2)   NULL AFTER `jobTitle`,
  ADD COLUMN `employerPhone`   VARCHAR(20)      NULL AFTER `monthlyIncome`,
  ADD COLUMN `employerAddress` VARCHAR(500)     NULL AFTER `employerPhone`,
  ADD COLUMN `nokName`         VARCHAR(200)     NULL AFTER `employerAddress`,
  ADD COLUMN `nokRelationship` VARCHAR(100)     NULL AFTER `nokName`,
  ADD COLUMN `nokPhone`        VARCHAR(20)      NULL AFTER `nokRelationship`,
  ADD COLUMN `nokAddress`      VARCHAR(500)     NULL AFTER `nokPhone`;
