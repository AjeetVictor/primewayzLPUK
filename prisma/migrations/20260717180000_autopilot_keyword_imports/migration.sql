-- CreateTable
CREATE TABLE `AutopilotKeywordImportBatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceName` VARCHAR(191) NULL,
    `originalFileName` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'previewed',
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `validRows` INTEGER NOT NULL DEFAULT 0,
    `invalidRows` INTEGER NOT NULL DEFAULT 0,
    `duplicateRows` INTEGER NOT NULL DEFAULT 0,
    `createdTopicCount` INTEGER NOT NULL DEFAULT 0,
    `columnMapping` JSON NULL,
    `importOptions` JSON NULL,
    `summary` JSON NULL,
    `errorSummary` JSON NULL,
    `createdById` INTEGER NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutopilotKeywordImportBatch_status_idx`(`status`),
    INDEX `AutopilotKeywordImportBatch_sourceType_idx`(`sourceType`),
    INDEX `AutopilotKeywordImportBatch_createdById_idx`(`createdById`),
    INDEX `AutopilotKeywordImportBatch_createdAt_idx`(`createdAt`),
    INDEX `AutopilotKeywordImportBatch_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `AutopilotKeywordImportBatch_sourceType_createdAt_idx`(`sourceType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutopilotKeywordCandidate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `normalisedKeyword` VARCHAR(191) NOT NULL,
    `sourceRowNumber` INTEGER NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceData` JSON NULL,
    `impressions` INTEGER NULL,
    `clicks` INTEGER NULL,
    `ctr` DECIMAL(10, 6) NULL,
    `averagePosition` DECIMAL(10, 4) NULL,
    `searchVolume` INTEGER NULL,
    `keywordDifficulty` DECIMAL(5, 2) NULL,
    `currentUrl` TEXT NULL,
    `country` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `duplicateReason` TEXT NULL,
    `duplicateOfCandidateId` INTEGER NULL,
    `matchedTopicId` INTEGER NULL,
    `convertedTopicId` INTEGER NULL,
    `reviewNotes` TEXT NULL,
    `reviewedById` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `convertedById` INTEGER NULL,
    `convertedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutopilotKeywordCandidate_batchId_idx`(`batchId`),
    INDEX `AutopilotKeywordCandidate_status_idx`(`status`),
    INDEX `AutopilotKeywordCandidate_normalisedKeyword_idx`(`normalisedKeyword`),
    INDEX `AutopilotKeywordCandidate_sourceType_idx`(`sourceType`),
    INDEX `AutopilotKeywordCandidate_convertedTopicId_idx`(`convertedTopicId`),
    INDEX `AutopilotKeywordCandidate_matchedTopicId_idx`(`matchedTopicId`),
    INDEX `AutopilotKeywordCandidate_duplicateOfCandidateId_idx`(`duplicateOfCandidateId`),
    INDEX `AutopilotKeywordCandidate_createdAt_idx`(`createdAt`),
    INDEX `AutopilotKeywordCandidate_batchId_status_idx`(`batchId`, `status`),
    INDEX `AutopilotKeywordCandidate_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `AutopilotKeywordCandidate_normalisedKeyword_status_idx`(`normalisedKeyword`, `status`),
    INDEX `AutopilotKeywordCandidate_impressions_idx`(`impressions`),
    INDEX `AutopilotKeywordCandidate_clicks_idx`(`clicks`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordImportBatch` ADD CONSTRAINT `AutopilotKeywordImportBatch_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordCandidate` ADD CONSTRAINT `AutopilotKeywordCandidate_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `AutopilotKeywordImportBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordCandidate` ADD CONSTRAINT `AutopilotKeywordCandidate_duplicateOfCandidateId_fkey` FOREIGN KEY (`duplicateOfCandidateId`) REFERENCES `AutopilotKeywordCandidate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordCandidate` ADD CONSTRAINT `AutopilotKeywordCandidate_matchedTopicId_fkey` FOREIGN KEY (`matchedTopicId`) REFERENCES `AutopilotTopic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordCandidate` ADD CONSTRAINT `AutopilotKeywordCandidate_convertedTopicId_fkey` FOREIGN KEY (`convertedTopicId`) REFERENCES `AutopilotTopic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordCandidate` ADD CONSTRAINT `AutopilotKeywordCandidate_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotKeywordCandidate` ADD CONSTRAINT `AutopilotKeywordCandidate_convertedById_fkey` FOREIGN KEY (`convertedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
