-- AlterTable: add customerCount to transport_requests
ALTER TABLE `transport_requests` ADD COLUMN `customerCount` INTEGER NOT NULL DEFAULT 1;
