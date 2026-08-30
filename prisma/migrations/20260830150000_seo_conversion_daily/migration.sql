-- SEO Intelligence Phase 4: daily conversion evidence aggregates (no PII).

CREATE TABLE `SeoPageConversionDaily` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `metricDate` DATE NOT NULL,
    `seoPageId` INTEGER NULL,
    `attributionModel` ENUM('first_touch', 'last_touch') NOT NULL,
    `channelGroup` VARCHAR(64) NOT NULL,
    `chatsInitiated` INTEGER NOT NULL DEFAULT 0,
    `qualifiedChats` INTEGER NOT NULL DEFAULT 0,
    `contactForms` INTEGER NOT NULL DEFAULT 0,
    `reviewRequests` INTEGER NOT NULL DEFAULT 0,
    `bookingRequests` INTEGER NOT NULL DEFAULT 0,
    `bookingsCompleted` INTEGER NOT NULL DEFAULT 0,
    `qualifiedLeads` INTEGER NOT NULL DEFAULT 0,
    `proposals` INTEGER NOT NULL DEFAULT 0,
    `wonOpportunities` INTEGER NOT NULL DEFAULT 0,
    `attributedValueMinor` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(8) NOT NULL DEFAULT 'GBP',
    `unknownAttributionCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `SeoPageConversionDaily_uniq`(`metricDate`, `seoPageId`, `attributionModel`, `channelGroup`),
    INDEX `SeoPageConversionDaily_metricDate_idx`(`metricDate`),
    INDEX `SeoPageConversionDaily_seoPageId_metricDate_idx`(`seoPageId`, `metricDate`),
    INDEX `SeoPageConversionDaily_channelGroup_metricDate_idx`(`channelGroup`, `metricDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SeoPageConversionDaily` ADD CONSTRAINT `SeoPageConversionDaily_seoPageId_fkey` FOREIGN KEY (`seoPageId`) REFERENCES `SeoPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
