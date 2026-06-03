CREATE TABLE `LeadSummaryEmail` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `dateKey` VARCHAR(191) NOT NULL,
  `summaryType` VARCHAR(191) NOT NULL DEFAULT 'daily_lead_summary',
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `sentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `LeadSummaryEmail_dateKey_summaryType_key`(`dateKey`, `summaryType`),
  INDEX `LeadSummaryEmail_dateKey_idx`(`dateKey`),
  INDEX `LeadSummaryEmail_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
