-- Additive central tenant presence policy + operational events (WS-1).
-- Does not seed policies, rewrite ChatPresenceSetting / AdminPresence, or activate Option 1.
-- Absence of a TenantPresencePolicy row preserves legacy_forced_online behaviour.

CREATE TABLE `TenantPresencePolicy` (
    `tenantId` VARCHAR(32) NOT NULL,
    `policy` ENUM('legacy_forced_online', 'heartbeat_required_online') NOT NULL DEFAULT 'legacy_forced_online',
    `reason` VARCHAR(512) NOT NULL,
    `updatedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tenantId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantPresencePolicyAudit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` VARCHAR(32) NOT NULL,
    `actorUserId` INTEGER NULL,
    `policy` ENUM('legacy_forced_online', 'heartbeat_required_online') NOT NULL,
    `reason` VARCHAR(512) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `TenantPresencePolicyAudit_tenantId_createdAt_idx` (`tenantId`, `createdAt`),
    CONSTRAINT `TenantPresencePolicyAudit_tenantId_fkey`
      FOREIGN KEY (`tenantId`) REFERENCES `TenantPresencePolicy`(`tenantId`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantPresenceEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` VARCHAR(32) NOT NULL,
    `eventType` VARCHAR(64) NOT NULL,
    `actorRef` VARCHAR(64) NULL,
    `actorUserId` INTEGER NULL,
    `correlationId` VARCHAR(64) NULL,
    `dedupeKey` VARCHAR(128) NOT NULL,
    `details` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `TenantPresenceEvent_tenant_type_dedupe_key` (`tenantId`, `eventType`, `dedupeKey`),
    INDEX `TenantPresenceEvent_tenantId_createdAt_idx` (`tenantId`, `createdAt`),
    INDEX `TenantPresenceEvent_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantPresenceIdempotencyKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` VARCHAR(32) NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `clientActionId` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `TenantPresenceIdempotency_tenant_action_key` (`tenantId`, `action`, `clientActionId`),
    INDEX `TenantPresenceIdempotencyKey_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
