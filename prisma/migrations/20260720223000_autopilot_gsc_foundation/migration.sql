-- Article Autopilot Phase 2A: Google Search Console connection and metrics foundation.
-- Additive only: create enums, tables, indexes, and foreign keys.

-- CreateTable
CREATE TABLE `GscConnection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('CONNECTED_UNCONFIGURED', 'ACTIVE', 'NEEDS_REAUTHENTICATION', 'DISCONNECTED', 'ERROR') NOT NULL,
    `siteUrl` VARCHAR(191) NULL,
    `permissionLevel` VARCHAR(191) NULL,
    `refreshTokenCiphertext` TEXT NOT NULL,
    `refreshTokenIv` VARCHAR(191) NOT NULL,
    `refreshTokenAuthTag` VARCHAR(191) NOT NULL,
    `tokenKeyVersion` INTEGER NOT NULL DEFAULT 1,
    `scope` VARCHAR(191) NOT NULL,
    `connectedById` INTEGER NULL,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastValidatedAt` DATETIME(3) NULL,
    `lastSuccessfulSyncAt` DATETIME(3) NULL,
    `lastErrorCode` VARCHAR(191) NULL,
    `lastErrorMessage` TEXT NULL,
    `syncLockToken` VARCHAR(191) NULL,
    `syncLockedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GscConnection_siteUrl_key`(`siteUrl`),
    INDEX `GscConnection_status_isActive_idx`(`status`, `isActive`),
    INDEX `GscConnection_lastSuccessfulSyncAt_idx`(`lastSuccessfulSyncAt`),
    INDEX `GscConnection_connectedById_idx`(`connectedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GscOAuthState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nonceHash` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GscOAuthState_nonceHash_key`(`nonceHash`),
    INDEX `GscOAuthState_userId_idx`(`userId`),
    INDEX `GscOAuthState_expiresAt_idx`(`expiresAt`),
    INDEX `GscOAuthState_consumedAt_idx`(`consumedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GscSyncRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `connectionId` INTEGER NOT NULL,
    `trigger` ENUM('MANUAL', 'SCHEDULED', 'RECONCILIATION') NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED') NOT NULL,
    `dateFrom` DATE NOT NULL,
    `dateTo` DATE NOT NULL,
    `searchType` VARCHAR(191) NOT NULL DEFAULT 'web',
    `dataState` VARCHAR(191) NOT NULL DEFAULT 'final',
    `requestsMade` INTEGER NOT NULL DEFAULT 0,
    `daysProcessed` INTEGER NOT NULL DEFAULT 0,
    `rowsFetched` INTEGER NOT NULL DEFAULT 0,
    `rowsUpserted` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `requestedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GscSyncRun_connectionId_status_createdAt_idx`(`connectionId`, `status`, `createdAt`),
    INDEX `GscSyncRun_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `GscSyncRun_dateFrom_dateTo_idx`(`dateFrom`, `dateTo`),
    INDEX `GscSyncRun_requestedById_idx`(`requestedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GscQueryPageMetric` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `connectionId` INTEGER NOT NULL,
    `metricDate` DATE NOT NULL,
    `rawQuery` TEXT NOT NULL,
    `normalisedQuery` TEXT NOT NULL,
    `queryHash` VARCHAR(191) NOT NULL,
    `page` TEXT NOT NULL,
    `pageHash` VARCHAR(191) NOT NULL,
    `searchType` VARCHAR(191) NOT NULL DEFAULT 'web',
    `clicks` DECIMAL(18, 2) NOT NULL,
    `impressions` DECIMAL(18, 2) NOT NULL,
    `ctr` DECIMAL(12, 8) NOT NULL,
    `position` DECIMAL(12, 4) NOT NULL,
    `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GscQueryPageMetric_connectionId_metricDate_idx`(`connectionId`, `metricDate`),
    INDEX `GscQueryPageMetric_queryHash_metricDate_idx`(`queryHash`, `metricDate`),
    INDEX `GscQueryPageMetric_pageHash_metricDate_idx`(`pageHash`, `metricDate`),
    UNIQUE INDEX `GscQueryPageMetric_uniq`(`connectionId`, `metricDate`, `queryHash`, `pageHash`, `searchType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GscConnection` ADD CONSTRAINT `GscConnection_connectedById_fkey` FOREIGN KEY (`connectedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GscOAuthState` ADD CONSTRAINT `GscOAuthState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GscSyncRun` ADD CONSTRAINT `GscSyncRun_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `GscConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GscSyncRun` ADD CONSTRAINT `GscSyncRun_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GscQueryPageMetric` ADD CONSTRAINT `GscQueryPageMetric_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `GscConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
