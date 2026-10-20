-- Additive conversation lifecycle.
-- Archive and restore set ChatSession.archivedAt and keep messages, attachments, leads and appointments.
-- Permanent deletion removes message rows and attachment rows, clears appointment message text,
-- and writes ChatLifecycleAudit with counts only. Message text is not copied into the audit table.
-- Session name, email and phone stay on the tombstone when a lead was captured.
-- ChatOperatorAction rows are unchanged by this migration and already store no message bodies.

ALTER TABLE `ChatSession`
    ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `archivedById` INTEGER NULL,
    ADD COLUMN `purgedAt` DATETIME(3) NULL;

CREATE INDEX `ChatSession_tenantId_archivedAt_idx` ON `ChatSession`(`tenantId`, `archivedAt`);
CREATE INDEX `ChatSession_tenantId_purgedAt_idx` ON `ChatSession`(`tenantId`, `purgedAt`);

CREATE TABLE `ChatLifecycleAudit` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `actorKind` VARCHAR(32) NOT NULL,
    `actorId` VARCHAR(64) NOT NULL,
    `messageCount` INTEGER NULL,
    `attachmentCount` INTEGER NULL,
    `appointmentCount` INTEGER NULL,
    `leadRetained` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatLifecycleAudit_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `ChatLifecycleAudit_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
