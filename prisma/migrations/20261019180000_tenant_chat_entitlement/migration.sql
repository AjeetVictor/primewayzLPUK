-- Additive central tenant chat entitlement.
-- Does not create a tenant, does not seed an entitlement, and does not modify
-- ChatSession, chat messages, users, or Chat Connect installation rows.
-- Absence of a row preserves existing tenant chat behavior.

CREATE TABLE `TenantChatEntitlement` (
    `tenantId` VARCHAR(32) NOT NULL,
    `status` ENUM('entitled', 'suspended', 'revoked') NOT NULL,
    `reason` VARCHAR(512) NOT NULL,
    `updatedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tenantId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantChatEntitlementAudit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` VARCHAR(32) NOT NULL,
    `actorUserId` INTEGER NULL,
    `status` ENUM('entitled', 'suspended', 'revoked') NOT NULL,
    `reason` VARCHAR(512) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `TenantChatEntitlementAudit_tenantId_createdAt_idx` (`tenantId`, `createdAt`),
    CONSTRAINT `TenantChatEntitlementAudit_tenantId_fkey`
      FOREIGN KEY (`tenantId`) REFERENCES `TenantChatEntitlement`(`tenantId`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
