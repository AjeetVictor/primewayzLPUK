-- Additive Primewayz Chat Platform commercial tenant registry.
-- Does not insert tenants, does not change PLATFORM_TENANTS identities,
-- and does not modify chat sessions, entitlements, or Chat Connect installations.
-- A missing row keeps compile-time behavior. Suspended and archived rows are retained.

CREATE TABLE `PlatformTenantAccount` (
    `tenantId` VARCHAR(32) NOT NULL,
    `displayName` VARCHAR(120) NOT NULL,
    `brand` VARCHAR(64) NOT NULL,
    `market` VARCHAR(16) NOT NULL,
    `organizationName` VARCHAR(160) NOT NULL,
    `primaryContactName` VARCHAR(120) NOT NULL,
    `primaryContactEmail` VARCHAR(320) NOT NULL,
    `lifecycleStatus` VARCHAR(16) NOT NULL,
    `capabilities` JSON NOT NULL,
    `sourceKind` VARCHAR(32) NOT NULL,
    `explicitEntitlement` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `activatedAt` DATETIME(3) NULL,
    `suspendedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tenantId`),
    INDEX `PlatformTenantAccount_lifecycleStatus_updatedAt_idx`(`lifecycleStatus`, `updatedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlatformTenantSite` (
    `id` VARCHAR(64) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `displayName` VARCHAR(120) NOT NULL,
    `technology` VARCHAR(32) NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `activatedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    INDEX `PlatformTenantSite_tenantId_status_idx`(`tenantId`, `status`),
    CONSTRAINT `PlatformTenantSite_tenantId_fkey`
      FOREIGN KEY (`tenantId`) REFERENCES `PlatformTenantAccount`(`tenantId`)
      ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlatformTenantOrigin` (
    `id` VARCHAR(64) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `siteId` VARCHAR(64) NOT NULL,
    `origin` VARCHAR(300) NOT NULL,
    `verificationStatus` VARCHAR(16) NOT NULL,
    `verificationTokenHash` VARCHAR(64) NOT NULL,
    `verifiedMethod` VARCHAR(32) NULL,
    `challengeIssuedAt` DATETIME(3) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `PlatformTenantOrigin_origin_key`(`origin`),
    INDEX `PlatformTenantOrigin_tenantId_verificationStatus_idx`(`tenantId`, `verificationStatus`),
    INDEX `PlatformTenantOrigin_siteId_idx`(`siteId`),
    CONSTRAINT `PlatformTenantOrigin_tenantId_fkey`
      FOREIGN KEY (`tenantId`) REFERENCES `PlatformTenantAccount`(`tenantId`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `PlatformTenantOrigin_siteId_fkey`
      FOREIGN KEY (`siteId`) REFERENCES `PlatformTenantSite`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlatformTenantAudit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` VARCHAR(32) NOT NULL,
    `actorUserId` INTEGER NULL,
    `action` VARCHAR(64) NOT NULL,
    `details` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `PlatformTenantAudit_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `PlatformTenantAudit_createdAt_idx`(`createdAt`),
    CONSTRAINT `PlatformTenantAudit_tenantId_fkey`
      FOREIGN KEY (`tenantId`) REFERENCES `PlatformTenantAccount`(`tenantId`)
      ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlatformTenantSiteInstallation` (
    `siteId` VARCHAR(64) NOT NULL,
    `installationId` VARCHAR(64) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`siteId`, `installationId`),
    UNIQUE INDEX `PlatformTenantSiteInstallation_installationId_key`(`installationId`),
    INDEX `PlatformTenantSiteInstallation_tenantId_idx`(`tenantId`),
    CONSTRAINT `PlatformTenantSiteInstallation_siteId_fkey`
      FOREIGN KEY (`siteId`) REFERENCES `PlatformTenantSite`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `PlatformTenantSiteInstallation_tenantId_fkey`
      FOREIGN KEY (`tenantId`) REFERENCES `PlatformTenantAccount`(`tenantId`)
      ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
