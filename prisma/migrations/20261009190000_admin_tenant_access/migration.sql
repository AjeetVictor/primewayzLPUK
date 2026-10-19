-- Explicit Host/Owner administrative access scope.
-- No existing user is made a Host/Owner or tenant operator by this migration.
-- Provision reviewed Host/Owner accounts and tenant grants through the controlled
-- post-migration access transition; do not infer broad access from the legacy role column.

ALTER TABLE `User`
  ADD COLUMN `isPlatformOwner` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `User_isPlatformOwner_idx` ON `User`(`isPlatformOwner`);

CREATE TABLE `UserTenantGrant` (
  `userId` INTEGER NOT NULL,
  `tenantId` VARCHAR(32) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`userId`, `tenantId`),
  INDEX `UserTenantGrant_tenantId_userId_idx` (`tenantId`, `userId`),
  CONSTRAINT `UserTenantGrant_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AdminAccessAuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `actorUserId` INTEGER NOT NULL,
  `targetUserId` INTEGER NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `details` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `AdminAccessAuditLog_targetUserId_createdAt_idx` (`targetUserId`, `createdAt`),
  INDEX `AdminAccessAuditLog_actorUserId_createdAt_idx` (`actorUserId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
