-- Free digital systems review leads (separate from chat sessions).
-- chatSessionId is optional attribution linkage only — no FK to ChatSession.
-- submissionId provides client-side idempotency.
-- Column widths match prisma/schema.prisma explicit @db types.
CREATE TABLE `DigitalSystemsReviewLead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `workEmail` VARCHAR(191) NOT NULL,
    `company` VARCHAR(120) NOT NULL,
    `website` VARCHAR(255) NULL,
    `serviceArea` VARCHAR(100) NOT NULL,
    `context` TEXT NOT NULL,
    `preferredNextStep` VARCHAR(100) NOT NULL,
    `consentAt` DATETIME(3) NOT NULL,
    `firstTouchAttribution` JSON NULL,
    `latestTouchAttribution` JSON NULL,
    `landingPage` VARCHAR(500) NULL,
    `referrer` TEXT NULL,
    `sourceLocation` VARCHAR(80) NULL,
    `chatSessionId` VARCHAR(64) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'new',
    `notificationStatus` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `notificationErrorCode` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DigitalSystemsReviewLead_submissionId_key`(`submissionId`),
    INDEX `DigitalSystemsReviewLead_createdAt_idx`(`createdAt`),
    INDEX `DigitalSystemsReviewLead_sourceLocation_idx`(`sourceLocation`),
    INDEX `DigitalSystemsReviewLead_workEmail_idx`(`workEmail`),
    INDEX `DigitalSystemsReviewLead_status_idx`(`status`),
    INDEX `DigitalSystemsReviewLead_notificationStatus_idx`(`notificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
