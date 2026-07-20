-- CreateTable
CREATE TABLE `AutopilotTopic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workingTitle` VARCHAR(191) NOT NULL,
    `primaryKeyword` VARCHAR(191) NOT NULL,
    `supportingKeywords` JSON NOT NULL,
    `keywordVariants` JSON NOT NULL,
    `userProblem` TEXT NOT NULL,
    `audience` VARCHAR(191) NOT NULL,
    `market` VARCHAR(191) NOT NULL DEFAULT 'United Kingdom',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en-GB',
    `location` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `proposedSlug` VARCHAR(191) NULL,
    `primaryCategory` VARCHAR(191) NULL,
    `secondaryCategories` JSON NOT NULL,
    `topicStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED',
    `decisionStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_READY',
    `briefStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `draftStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `mediaStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_REQUIRED',
    `publishingStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_READY',
    `performanceStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_TRACKED',
    `searchIntent` JSON NULL,
    `serpEvidence` JSON NULL,
    `businessAlignment` JSON NULL,
    `contentArchitecture` JSON NULL,
    `riskAssessment` JSON NULL,
    `categoryRecommendation` JSON NULL,
    `scoreBreakdown` JSON NULL,
    `aiMetadata` JSON NULL,
    `serviceRelevance` DECIMAL(5, 1) NULL,
    `businessValue` DECIMAL(5, 1) NULL,
    `buyerIntent` DECIMAL(5, 1) NULL,
    `topicalAuthorityFit` DECIMAL(5, 1) NULL,
    `contentGap` DECIMAL(5, 1) NULL,
    `differentiationPotential` DECIMAL(5, 1) NULL,
    `rankingFeasibility` DECIMAL(5, 1) NULL,
    `evidenceConfidence` DECIMAL(5, 1) NULL,
    `internalLinkOpportunity` DECIMAL(5, 1) NULL,
    `commercialPageSupport` DECIMAL(5, 1) NULL,
    `cannibalisationPenalty` DECIMAL(5, 1) NULL,
    `unsupportedClaimRiskPenalty` DECIMAL(5, 1) NULL,
    `rawScore` DECIMAL(5, 1) NULL,
    `totalScore` DECIMAL(5, 1) NULL,
    `scoringVersion` VARCHAR(191) NULL,
    `assignedToId` INTEGER NULL,
    `createdById` INTEGER NULL,
    `updatedById` INTEGER NULL,
    `decidedById` INTEGER NULL,
    `decidedAt` DATETIME(3) NULL,
    `decisionRationale` TEXT NULL,
    `mergeIntoTopicId` INTEGER NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutopilotTopic_proposedSlug_idx`(`proposedSlug`),
    INDEX `AutopilotTopic_topicStatus_idx`(`topicStatus`),
    INDEX `AutopilotTopic_decisionStatus_idx`(`decisionStatus`),
    INDEX `AutopilotTopic_primaryCategory_idx`(`primaryCategory`),
    INDEX `AutopilotTopic_totalScore_idx`(`totalScore`),
    INDEX `AutopilotTopic_assignedToId_idx`(`assignedToId`),
    INDEX `AutopilotTopic_updatedAt_idx`(`updatedAt`),
    INDEX `AutopilotTopic_archivedAt_idx`(`archivedAt`),
    INDEX `AutopilotTopic_topicStatus_decisionStatus_updatedAt_idx`(`topicStatus`, `decisionStatus`, `updatedAt`),
    INDEX `AutopilotTopic_decisionStatus_totalScore_idx`(`decisionStatus`, `totalScore`),
    INDEX `AutopilotTopic_mergeIntoTopicId_idx`(`mergeIntoTopicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutopilotActivityLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `actorType` VARCHAR(191) NOT NULL,
    `actorId` INTEGER NULL,
    `actorDisplayName` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL,
    `previousValue` JSON NULL,
    `newValue` JSON NULL,
    `metadata` JSON NULL,
    `reason` TEXT NULL,
    `correlationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AutopilotActivityLog_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    INDEX `AutopilotActivityLog_eventType_createdAt_idx`(`eventType`, `createdAt`),
    INDEX `AutopilotActivityLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `AutopilotActivityLog_correlationId_idx`(`correlationId`),
    INDEX `AutopilotActivityLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutopilotWorkflowRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workflowType` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'queued',
    `currentStep` VARCHAR(191) NULL,
    `totalSteps` INTEGER NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `attempt` INTEGER NOT NULL DEFAULT 1,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `providerMetadata` JSON NULL,
    `inputHash` VARCHAR(191) NULL,
    `correlationId` VARCHAR(191) NULL,
    `createdById` INTEGER NULL,
    `retryOfRunId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutopilotWorkflowRun_workflowType_entityType_entityId_inputH_idx`(`workflowType`, `entityType`, `entityId`, `inputHash`),
    INDEX `AutopilotWorkflowRun_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `AutopilotWorkflowRun_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    INDEX `AutopilotWorkflowRun_correlationId_idx`(`correlationId`),
    INDEX `AutopilotWorkflowRun_retryOfRunId_idx`(`retryOfRunId`),
    INDEX `AutopilotWorkflowRun_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutopilotSetting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `description` TEXT NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AutopilotSetting_key_key`(`key`),
    INDEX `AutopilotSetting_updatedById_idx`(`updatedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_decidedById_fkey` FOREIGN KEY (`decidedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_mergeIntoTopicId_fkey` FOREIGN KEY (`mergeIntoTopicId`) REFERENCES `AutopilotTopic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotActivityLog` ADD CONSTRAINT `AutopilotActivityLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotWorkflowRun` ADD CONSTRAINT `AutopilotWorkflowRun_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotWorkflowRun` ADD CONSTRAINT `AutopilotWorkflowRun_retryOfRunId_fkey` FOREIGN KEY (`retryOfRunId`) REFERENCES `AutopilotWorkflowRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutopilotSetting` ADD CONSTRAINT `AutopilotSetting_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed locked foundation setting: automatic publishing remains disabled.
-- Uses INSERT IGNORE so re-runs on a fresh empty table stay deterministic and never flip an existing value to true.
INSERT IGNORE INTO `AutopilotSetting` (`key`, `value`, `description`, `isLocked`, `createdAt`, `updatedAt`)
VALUES (
  'autoPublishEnabled',
  CAST('false' AS JSON),
  'Article Autopilot publishing requires human approval. Automatic publishing is disabled and this setting is locked for the foundation phase.',
  true,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
);
