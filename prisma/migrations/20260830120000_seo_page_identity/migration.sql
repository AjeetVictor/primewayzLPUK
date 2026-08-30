-- SEO Intelligence Phase 2: canonical page identity (additive).
-- Creates SeoPage and SeoPageAlias tables for cross-source URL matching.

-- CreateTable
CREATE TABLE `SeoPage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `canonicalUrl` VARCHAR(2048) NOT NULL,
    `canonicalUrlHash` VARCHAR(64) NOT NULL,
    `host` VARCHAR(255) NOT NULL,
    `path` VARCHAR(2048) NOT NULL,
    `pageType` VARCHAR(64) NULL,
    `serviceArea` VARCHAR(100) NULL,
    `cmsEntityType` VARCHAR(64) NULL,
    `cmsEntityId` VARCHAR(191) NULL,
    `title` VARCHAR(512) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SeoPage_canonicalUrl_key`(`canonicalUrl`),
    UNIQUE INDEX `SeoPage_canonicalUrlHash_key`(`canonicalUrlHash`),
    INDEX `SeoPage_host_path_idx`(`host`, `path`(191)),
    INDEX `SeoPage_pageType_idx`(`pageType`),
    INDEX `SeoPage_serviceArea_idx`(`serviceArea`),
    INDEX `SeoPage_cmsEntityType_cmsEntityId_idx`(`cmsEntityType`, `cmsEntityId`),
    INDEX `SeoPage_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeoPageAlias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seoPageId` INTEGER NOT NULL,
    `source` ENUM('GSC', 'GA4', 'CHAT', 'LEAD', 'CMS', 'INDEXING', 'GITHUB', 'MANUAL', 'SYSTEM') NOT NULL,
    `observedUrl` TEXT NOT NULL,
    `observedUrlHash` VARCHAR(64) NOT NULL,
    `normalisedUrl` TEXT NOT NULL,
    `normalisedUrlHash` VARCHAR(64) NOT NULL,
    `firstSeenAt` DATETIME(3) NOT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SeoPageAlias_source_observedUrlHash_key`(`source`, `observedUrlHash`),
    INDEX `SeoPageAlias_seoPageId_idx`(`seoPageId`),
    INDEX `SeoPageAlias_normalisedUrlHash_idx`(`normalisedUrlHash`),
    INDEX `SeoPageAlias_source_idx`(`source`),
    INDEX `SeoPageAlias_source_lastSeenAt_idx`(`source`, `lastSeenAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SeoPageAlias` ADD CONSTRAINT `SeoPageAlias_seoPageId_fkey` FOREIGN KEY (`seoPageId`) REFERENCES `SeoPage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
