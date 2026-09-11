-- CreateTable: user_branches (multi-branch assignments for compliance/accounting staff)
CREATE TABLE `user_branches` (
  `id`        VARCHAR(36)  NOT NULL,
  `userId`    VARCHAR(36)  NOT NULL,
  `branchId`  VARCHAR(36)  NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `user_branches_userId_branchId_key` (`userId`, `branchId`),
  KEY `user_branches_userId_idx`   (`userId`),
  KEY `user_branches_branchId_idx` (`branchId`),

  CONSTRAINT `user_branches_userId_fkey`   FOREIGN KEY (`userId`)   REFERENCES `users`(`id`)    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_branches_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
