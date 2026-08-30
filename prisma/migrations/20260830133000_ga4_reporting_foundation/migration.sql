-- SEO Intelligence Phase 3: GA4 aggregate reporting ingestion (additive).

CREATE TABLE `Ga4ConfigurationState` (
    `id` INTEGER NOT NULL,
    `propertyId` VARCHAR(64) NULL,
    `lastSuccessfulSyncAt` DATETIME(3) NULL,
    `lastErrorCode` VARCHAR(191) NULL,
    `lastErrorMessage` TEXT NULL,
    `syncLockToken` VARCHAR(191) NULL,
    `syncLockedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Ga4SyncRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configId` INTEGER NOT NULL DEFAULT 1,
    `trigger` ENUM('MANUAL', 'SCHEDULED') NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED') NOT NULL,
    `dateFrom` DATE NOT NULL,
    `dateTo` DATE NOT NULL,
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
    INDEX `Ga4SyncRun_configId_status_createdAt_idx`(`configId`, `status`, `createdAt`),
    INDEX `Ga4SyncRun_dateFrom_dateTo_idx`(`dateFrom`, `dateTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Ga4PageMetric` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `syncRunId` INTEGER NULL,
    `metricDate` DATE NOT NULL,
    `seoPageId` INTEGER NULL,
    `observedLandingPage` TEXT NOT NULL,
    `observedLandingPageHash` VARCHAR(64) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `medium` VARCHAR(191) NOT NULL,
    `defaultChannelGroup` VARCHAR(191) NOT NULL,
    `sessions` DECIMAL(18, 2) NOT NULL,
    `organicSessions` DECIMAL(18, 2) NOT NULL,
    `engagedSessions` DECIMAL(18, 2) NOT NULL,
    `engagementRate` DECIMAL(12, 8) NOT NULL,
    `averageEngagementTime` DECIMAL(18, 4) NOT NULL,
    `keyEvents` DECIMAL(18, 2) NOT NULL,
    `generateLeadEvents` DECIMAL(18, 2) NOT NULL,
    `contactFormConversions` DECIMAL(18, 2) NOT NULL,
    `bookingConversions` DECIMAL(18, 2) NOT NULL,
    `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Ga4PageMetric_uniq`(`metricDate`, `observedLandingPageHash`, `source`, `medium`, `defaultChannelGroup`),
    INDEX `Ga4PageMetric_metricDate_idx`(`metricDate`),
    INDEX `Ga4PageMetric_observedLandingPageHash_metricDate_idx`(`observedLandingPageHash`, `metricDate`),
    INDEX `Ga4PageMetric_seoPageId_metricDate_idx`(`seoPageId`, `metricDate`),
    INDEX `Ga4PageMetric_syncRunId_idx`(`syncRunId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Ga4SyncRun` ADD CONSTRAINT `Ga4SyncRun_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `Ga4ConfigurationState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Ga4SyncRun` ADD CONSTRAINT `Ga4SyncRun_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Ga4PageMetric` ADD CONSTRAINT `Ga4PageMetric_syncRunId_fkey` FOREIGN KEY (`syncRunId`) REFERENCES `Ga4SyncRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Ga4PageMetric` ADD CONSTRAINT `Ga4PageMetric_seoPageId_fkey` FOREIGN KEY (`seoPageId`) REFERENCES `SeoPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
