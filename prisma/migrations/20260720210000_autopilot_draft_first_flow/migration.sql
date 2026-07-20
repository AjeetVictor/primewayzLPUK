-- Article Autopilot: additive draft-first workflow foundation.
-- This migration preserves all legacy status fields, research snapshots, audit logs and topic data.

-- AddColumn
ALTER TABLE `AutopilotTopic`
    ADD COLUMN `queueStatus` ENUM('GENERATING', 'READY_FOR_REVIEW', 'NEEDS_ATTENTION', 'SCHEDULED', 'PUBLISHED', 'REJECTED') NOT NULL DEFAULT 'GENERATING',
    ADD COLUMN `pipelineStage` ENUM('QUEUED', 'PLANNING', 'RESEARCHING', 'CHECKING_OVERLAP', 'BUILDING_BRIEF', 'WRITING', 'GENERATING_METADATA', 'AUTO_REVIEWING', 'SANITISING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    ADD COLUMN `reviewVerdict` ENUM('NOT_REVIEWED', 'PASS', 'PASS_WITH_WARNINGS', 'FAIL') NOT NULL DEFAULT 'NOT_REVIEWED',
    ADD COLUMN `humanReviewStatus` ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `qualityScore` DECIMAL(5, 1) NULL,
    ADD COLUMN `factualScore` DECIMAL(5, 1) NULL,
    ADD COLUMN `brandVoiceScore` DECIMAL(5, 1) NULL,
    ADD COLUMN `originalityScore` DECIMAL(5, 1) NULL,
    ADD COLUMN `reviewIssues` JSON NULL,
    ADD COLUMN `sourceEvidenceJson` JSON NULL,
    ADD COLUMN `autoReviewJson` JSON NULL,
    ADD COLUMN `validatorNotes` TEXT NULL,
    ADD COLUMN `approvedById` INTEGER NULL,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedById` INTEGER NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectionReason` TEXT NULL,
    ADD COLUMN `attemptCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastError` TEXT NULL,
    ADD COLUMN `lockedAt` DATETIME(3) NULL,
    ADD COLUMN `lockedBy` VARCHAR(191) NULL,
    ADD COLUMN `modelName` VARCHAR(191) NULL,
    ADD COLUMN `promptVersion` VARCHAR(191) NULL,
    ADD COLUMN `generationVersion` VARCHAR(191) NULL,
    ADD COLUMN `scheduledFor` DATETIME(3) NULL,
    ADD COLUMN `publishedUrl` TEXT NULL,
    ADD COLUMN `currentVersionId` INTEGER NULL,
    ADD COLUMN `approvedVersionId` INTEGER NULL,
    ADD COLUMN `publishedVersionId` INTEGER NULL;

-- Preserve the meaning of legacy terminal decisions without making any item publishable.
UPDATE `AutopilotTopic`
SET
    `queueStatus` = CASE
        WHEN `topicStatus` = 'REJECTED' OR `decisionStatus` = 'REJECTED' THEN 'REJECTED'
        ELSE 'GENERATING'
    END,
    `humanReviewStatus` = CASE
        WHEN `decisionStatus` = 'APPROVED' THEN 'APPROVED'
        WHEN `decisionStatus` = 'REJECTED' THEN 'REJECTED'
        WHEN `decisionStatus` = 'PENDING_REVIEW' THEN 'IN_REVIEW'
        ELSE 'PENDING'
    END,
    `approvedById` = CASE WHEN `decisionStatus` = 'APPROVED' THEN `decidedById` ELSE NULL END,
    `approvedAt` = CASE WHEN `decisionStatus` = 'APPROVED' THEN `decidedAt` ELSE NULL END;

-- CreateTable
CREATE TABLE `AutopilotContentVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `source` ENUM('GENERATED', 'EDITED', 'REGENERATED', 'IMPORTED') NOT NULL DEFAULT 'GENERATED',
    `status` ENUM('DRAFT', 'APPROVED', 'PUBLISHED', 'SUPERSEDED') NOT NULL DEFAULT 'DRAFT',
    `title` VARCHAR(191) NOT NULL,
    `proposedSlug` VARCHAR(191) NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `metadataJson` JSON NULL,
    `schemaJson` JSON NULL,
    `internalLinksJson` JSON NULL,
    `sourceEvidenceJson` JSON NULL,
    `autoReviewJson` JSON NULL,
    `changeSummary` TEXT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AutopilotContentVersion_topicId_version_key`(`topicId`, `version`),
    INDEX `AutopilotContentVersion_topicId_status_createdAt_idx`(`topicId`, `status`, `createdAt`),
    INDEX `AutopilotContentVersion_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddIndex
CREATE UNIQUE INDEX `AutopilotTopic_currentVersionId_key` ON `AutopilotTopic`(`currentVersionId`);
CREATE UNIQUE INDEX `AutopilotTopic_approvedVersionId_key` ON `AutopilotTopic`(`approvedVersionId`);
CREATE UNIQUE INDEX `AutopilotTopic_publishedVersionId_key` ON `AutopilotTopic`(`publishedVersionId`);
CREATE INDEX `AutopilotTopic_queueStatus_updatedAt_idx` ON `AutopilotTopic`(`queueStatus`, `updatedAt`);
CREATE INDEX `AutopilotTopic_pipelineStage_updatedAt_idx` ON `AutopilotTopic`(`pipelineStage`, `updatedAt`);
CREATE INDEX `AutopilotTopic_humanReviewStatus_queueStatus_updatedAt_idx` ON `AutopilotTopic`(`humanReviewStatus`, `queueStatus`, `updatedAt`);
CREATE INDEX `AutopilotTopic_scheduledFor_idx` ON `AutopilotTopic`(`scheduledFor`);
CREATE INDEX `AutopilotTopic_approvedById_idx` ON `AutopilotTopic`(`approvedById`);
CREATE INDEX `AutopilotTopic_rejectedById_idx` ON `AutopilotTopic`(`rejectedById`);

-- AddForeignKey
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AutopilotContentVersion` ADD CONSTRAINT `AutopilotContentVersion_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `AutopilotTopic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AutopilotContentVersion` ADD CONSTRAINT `AutopilotContentVersion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_currentVersionId_fkey` FOREIGN KEY (`currentVersionId`) REFERENCES `AutopilotContentVersion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_approvedVersionId_fkey` FOREIGN KEY (`approvedVersionId`) REFERENCES `AutopilotContentVersion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AutopilotTopic` ADD CONSTRAINT `AutopilotTopic_publishedVersionId_fkey` FOREIGN KEY (`publishedVersionId`) REFERENCES `AutopilotContentVersion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
