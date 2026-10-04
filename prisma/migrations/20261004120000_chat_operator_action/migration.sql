-- Additive: delegated operator write actions (WordPress integration reply / resolve / reopen).
-- Persistent idempotency (integrationId + clientActionId), request correlation and human
-- operator attribution. No changes to ChatSession / ChatMessage; sessionId and messageId are
-- logical references without foreign keys. No message bodies, emails or credentials stored.

-- CreateTable
CREATE TABLE `ChatOperatorAction` (
    `id` VARCHAR(191) NOT NULL,
    `integrationId` VARCHAR(64) NOT NULL,
    `clientActionId` VARCHAR(64) NOT NULL,
    `requestHash` CHAR(64) NOT NULL,
    `requestId` VARCHAR(128) NOT NULL,
    `source` VARCHAR(64) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `actorExternalId` VARCHAR(64) NOT NULL,
    `actorDisplayName` VARCHAR(80) NULL,
    `messageId` INTEGER NULL,
    `fromStatus` VARCHAR(32) NULL,
    `toStatus` VARCHAR(32) NULL,
    `changed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatOperatorAction_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
    INDEX `ChatOperatorAction_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    UNIQUE INDEX `ChatOperatorAction_integrationId_clientActionId_key`(`integrationId`, `clientActionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
