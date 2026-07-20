-- CreateTable
CREATE TABLE `AutopilotResearchSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `query` VARCHAR(191) NULL,
    `market` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `searchIntent` JSON NULL,
    `serpEvidence` JSON NULL,
    `businessAlignment` JSON NULL,
    `contentArchitecture` JSON NULL,
    `riskAssessment` JSON NULL,
    `overlapAnalysis` JSON NULL,
    `clusterHints` JSON NULL,
    `internalLinkHints` JSON NULL,
    `researchNotes` TEXT NULL,
    `evidenceQuality` VARCHAR(191) NOT NULL DEFAULT 'not_assessed',
    `evidenceCompleteness` DECIMAL(5, 1) NULL,
    `createdById` INTEGER NULL,
    `updatedById` INTEGER NULL,
    `confirmedById` INTEGER NULL,
    `confirmedAt` DATETIME(3) NULL,
    `supersededAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutopilotResearchSnapshot_topicId_status_createdAt_idx`(`topicId`, `status`, `createdAt`),
    INDEX `AutopilotResearchSnapshot_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `AutopilotResearchSnapshot_createdById_idx`(`createdById`),
    INDEX `AutopilotResearchSnapshot_confirmedById_idx`(`confirmedById`),
    INDEX `AutopilotResearchSnapshot_confirmedAt_idx`(`confirmedAt`),
    UNIQUE INDEX `AutopilotResearchSnapshot_topicId_version_key`(`topicId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AutopilotResearchSnapshot` ADD CONSTRAINT `AutopilotResearchSnapshot_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `AutopilotTopic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotResearchSnapshot` ADD CONSTRAINT `AutopilotResearchSnapshot_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotResearchSnapshot` ADD CONSTRAINT `AutopilotResearchSnapshot_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotResearchSnapshot` ADD CONSTRAINT `AutopilotResearchSnapshot_confirmedById_fkey` FOREIGN KEY (`confirmedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
