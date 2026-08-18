-- Add NDPA consent tracking fields to customers table
ALTER TABLE `customers` 
ADD COLUMN `dataProcessingConsent` BOOLEAN DEFAULT FALSE AFTER `nokAddress`,
ADD COLUMN `dataProcessingConsentDate` DATETIME NULL AFTER `dataProcessingConsent`,
ADD COLUMN `dataProcessingConsentIp` VARCHAR(50) NULL AFTER `dataProcessingConsentDate`,
ADD COLUMN `marketingConsent` BOOLEAN DEFAULT FALSE AFTER `dataProcessingConsentIp`,
ADD COLUMN `marketingConsentDate` DATETIME NULL AFTER `marketingConsent`,
ADD COLUMN `creditBureauConsent` BOOLEAN DEFAULT FALSE AFTER `marketingConsentDate`,
ADD COLUMN `creditBureauConsentDate` DATETIME NULL AFTER `creditBureauConsent`,
ADD COLUMN `thirdPartyDataSharingConsent` BOOLEAN DEFAULT FALSE AFTER `creditBureauConsentDate`,
ADD COLUMN `thirdPartyDataSharingConsentDate` DATETIME NULL AFTER `thirdPartyDataSharingConsent`,
ADD COLUMN `consentVersion` VARCHAR(20) DEFAULT 'v1.0' AFTER `thirdPartyDataSharingConsentDate`;
