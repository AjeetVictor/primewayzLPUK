-- Shared-platform source context (additive only).
-- Historical rows remain NULL because their tenant provenance cannot be proven solely from row data.
-- All new public writes populate these columns through the trusted source resolver.
--
-- SeoPageConversionDaily.bucketKeyHash is intentionally NOT rewritten here.
-- Pre-tenant hashes used page\0model\0channel; runtime aggregation now prefixes tenant or `legacy`.
-- After deploy, align historical daily rows only via the explicit idempotent rebuild:
--   npm run seo:conversions:rebuild -- --dateFrom=YYYY-MM-DD --dateTo=YYYY-MM-DD
--   npm run seo:conversions:rebuild:write -- --dateFrom=YYYY-MM-DD --dateTo=YYYY-MM-DD
-- Do not run that rebuild automatically on application startup.

ALTER TABLE `FormResponse`
  ADD COLUMN `tenantId` VARCHAR(32) NULL,
  ADD COLUMN `market` VARCHAR(8) NULL,
  ADD COLUMN `sourceSite` VARCHAR(191) NULL,
  ADD COLUMN `sourceOrigin` VARCHAR(255) NULL,
  ADD COLUMN `sourceChannel` VARCHAR(64) NULL,
  ADD COLUMN `campaignId` VARCHAR(191) NULL,
  ADD INDEX `FormResponse_tenantId_createdAt_idx` (`tenantId`, `createdAt`);

ALTER TABLE `ToolLead`
  ADD COLUMN `tenantId` VARCHAR(32) NULL,
  ADD COLUMN `market` VARCHAR(8) NULL,
  ADD COLUMN `sourceSite` VARCHAR(191) NULL,
  ADD COLUMN `sourceOrigin` VARCHAR(255) NULL,
  ADD COLUMN `sourceChannel` VARCHAR(64) NULL,
  ADD COLUMN `campaignId` VARCHAR(191) NULL,
  ADD INDEX `ToolLead_tenantId_createdAt_idx` (`tenantId`, `createdAt`);

ALTER TABLE `DigitalSystemsReviewLead`
  ADD COLUMN `tenantId` VARCHAR(32) NULL,
  ADD COLUMN `market` VARCHAR(8) NULL,
  ADD COLUMN `sourceSite` VARCHAR(191) NULL,
  ADD COLUMN `sourceOrigin` VARCHAR(255) NULL,
  ADD COLUMN `sourceChannel` VARCHAR(64) NULL,
  ADD COLUMN `campaignId` VARCHAR(191) NULL,
  ADD INDEX `DigitalSystemsReviewLead_tenantId_createdAt_idx` (`tenantId`, `createdAt`);

ALTER TABLE `ChatSession`
  ADD COLUMN `tenantId` VARCHAR(32) NULL,
  ADD COLUMN `market` VARCHAR(8) NULL,
  ADD COLUMN `sourceSite` VARCHAR(191) NULL,
  ADD COLUMN `sourceOrigin` VARCHAR(255) NULL,
  ADD COLUMN `sourceChannel` VARCHAR(64) NULL,
  ADD COLUMN `campaignId` VARCHAR(191) NULL,
  ADD INDEX `ChatSession_tenantId_createdAt_idx` (`tenantId`, `createdAt`);

ALTER TABLE `SeoPageConversionDaily`
  ADD COLUMN `tenantId` VARCHAR(32) NULL,
  ADD COLUMN `market` VARCHAR(8) NULL,
  ADD COLUMN `sourceSite` VARCHAR(191) NULL,
  ADD INDEX `SeoPageConversionDaily_tenantId_metricDate_idx` (`tenantId`, `metricDate`);
