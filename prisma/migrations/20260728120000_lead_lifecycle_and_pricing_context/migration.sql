-- Lead lifecycle, commercial context and attribution fields for DigitalSystemsReviewLead
ALTER TABLE `DigitalSystemsReviewLead`
  ADD COLUMN `selectedPlanSlug` VARCHAR(64) NULL,
  ADD COLUMN `selectedPlanName` VARCHAR(120) NULL,
  ADD COLUMN `displayedPrice` VARCHAR(32) NULL,
  ADD COLUMN `billingPeriod` VARCHAR(32) NULL,
  ADD COLUMN `pricingPolicyVersion` VARCHAR(32) NULL,
  ADD COLUMN `displayedPriceAtSelection` VARCHAR(32) NULL,
  ADD COLUMN `serviceInterest` VARCHAR(100) NULL,
  ADD COLUMN `journeyType` VARCHAR(64) NULL,
  ADD COLUMN `sourcePagePath` VARCHAR(500) NULL,
  ADD COLUMN `pageLocation` VARCHAR(500) NULL,
  ADD COLUMN `sourceSection` VARCHAR(80) NULL,
  ADD COLUMN `recommendedNextStepCommercial` VARCHAR(120) NULL,
  ADD COLUMN `firstTouchSource` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchMedium` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchCampaign` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchContent` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchTerm` VARCHAR(191) NULL,
  ADD COLUMN `latestTouchSource` VARCHAR(191) NULL,
  ADD COLUMN `latestTouchMedium` VARCHAR(191) NULL,
  ADD COLUMN `latestTouchCampaign` VARCHAR(191) NULL,
  ADD COLUMN `latestTouchContent` VARCHAR(191) NULL,
  ADD COLUMN `latestTouchTerm` VARCHAR(191) NULL,
  ADD COLUMN `journeyReference` VARCHAR(64) NULL,
  ADD COLUMN `sessionReference` VARCHAR(64) NULL,
  ADD COLUMN `leadOwnerId` INT NULL,
  ADD COLUMN `statusUpdatedAt` DATETIME(3) NULL,
  ADD COLUMN `validatedAt` DATETIME(3) NULL,
  ADD COLUMN `assignedAt` DATETIME(3) NULL,
  ADD COLUMN `firstContactedAt` DATETIME(3) NULL,
  ADD COLUMN `qualifiedAt` DATETIME(3) NULL,
  ADD COLUMN `proposalSentAt` DATETIME(3) NULL,
  ADD COLUMN `wonAt` DATETIME(3) NULL,
  ADD COLUMN `lostAt` DATETIME(3) NULL,
  ADD COLUMN `nurtureAt` DATETIME(3) NULL,
  ADD COLUMN `slaDueAt` DATETIME(3) NULL,
  ADD COLUMN `slaBreachedAt` DATETIME(3) NULL,
  ADD COLUMN `followUpAt` DATETIME(3) NULL,
  ADD COLUMN `lastContactedAt` DATETIME(3) NULL,
  ADD COLUMN `outcome` VARCHAR(32) NULL,
  ADD COLUMN `lostReason` VARCHAR(64) NULL,
  ADD COLUMN `nurtureReason` VARCHAR(64) NULL,
  ADD COLUMN `validationScore` INT NULL,
  ADD COLUMN `validationFlags` JSON NULL,
  ADD COLUMN `validationOutcome` VARCHAR(32) NULL,
  ADD COLUMN `duplicateOfLeadId` INT NULL,
  ADD COLUMN `duplicateConfidence` VARCHAR(16) NULL,
  ADD COLUMN `proposalValueMinor` INT NULL,
  ADD COLUMN `proposalCurrency` VARCHAR(8) NULL,
  ADD COLUMN `normalisedWorkEmail` VARCHAR(191) NULL,
  ADD COLUMN `normalisedCompanyDomain` VARCHAR(191) NULL,
  ADD COLUMN `statusHistory` JSON NULL,
  ADD COLUMN `followUpNote` TEXT NULL,
  ADD COLUMN `followUpReason` VARCHAR(64) NULL;

CREATE INDEX `DigitalSystemsReviewLead_selectedPlanSlug_idx` ON `DigitalSystemsReviewLead`(`selectedPlanSlug`);
CREATE INDEX `DigitalSystemsReviewLead_journeyType_idx` ON `DigitalSystemsReviewLead`(`journeyType`);
CREATE INDEX `DigitalSystemsReviewLead_serviceInterest_idx` ON `DigitalSystemsReviewLead`(`serviceInterest`);
CREATE INDEX `DigitalSystemsReviewLead_leadOwnerId_idx` ON `DigitalSystemsReviewLead`(`leadOwnerId`);
CREATE INDEX `DigitalSystemsReviewLead_followUpAt_idx` ON `DigitalSystemsReviewLead`(`followUpAt`);
CREATE INDEX `DigitalSystemsReviewLead_slaDueAt_idx` ON `DigitalSystemsReviewLead`(`slaDueAt`);
CREATE INDEX `DigitalSystemsReviewLead_normalisedWorkEmail_idx` ON `DigitalSystemsReviewLead`(`normalisedWorkEmail`);
CREATE INDEX `DigitalSystemsReviewLead_normalisedCompanyDomain_idx` ON `DigitalSystemsReviewLead`(`normalisedCompanyDomain`);
CREATE INDEX `DigitalSystemsReviewLead_journeyReference_idx` ON `DigitalSystemsReviewLead`(`journeyReference`);
CREATE INDEX `DigitalSystemsReviewLead_validationOutcome_idx` ON `DigitalSystemsReviewLead`(`validationOutcome`);
CREATE INDEX `DigitalSystemsReviewLead_duplicateOfLeadId_idx` ON `DigitalSystemsReviewLead`(`duplicateOfLeadId`);

-- Commercial context for contact form submissions
ALTER TABLE `FormResponse`
  ADD COLUMN `commercialContext` JSON NULL,
  ADD COLUMN `leadStatus` VARCHAR(32) NULL DEFAULT 'new';

-- Lead nurture segment tracking (no auto-send)
CREATE TABLE `LeadNurtureRecord` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `leadId` INT NOT NULL,
  `leadType` VARCHAR(32) NOT NULL DEFAULT 'digital_systems_review',
  `segment` VARCHAR(64) NOT NULL,
  `currentLeadStatus` VARCHAR(32) NULL,
  `recommendedNextStep` VARCHAR(120) NULL,
  `nextFollowUpDate` DATETIME(3) NULL,
  `ownerId` INT NULL,
  `lawfulBasisNote` VARCHAR(255) NULL,
  `lastContactDate` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `LeadNurtureRecord_leadId_idx`(`leadId`),
  INDEX `LeadNurtureRecord_segment_idx`(`segment`),
  INDEX `LeadNurtureRecord_nextFollowUpDate_idx`(`nextFollowUpDate`),
  INDEX `LeadNurtureRecord_ownerId_idx`(`ownerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Internal pricing content backlog (not auto-published)
CREATE TABLE `PricingContentBacklogItem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(120) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `targetService` VARCHAR(100) NULL,
  `searchIntent` VARCHAR(64) NULL,
  `internalLinksJson` JSON NULL,
  `suggestedCta` VARCHAR(120) NULL,
  `pricingPolicyVersion` VARCHAR(32) NOT NULL,
  `requiresCommercialReview` BOOLEAN NOT NULL DEFAULT true,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `overlapNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `PricingContentBacklogItem_slug_key`(`slug`),
  INDEX `PricingContentBacklogItem_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
