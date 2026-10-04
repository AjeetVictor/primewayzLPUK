-- Tenant visitor intelligence for chat operations (additive only).
-- Existing rows keep NULL: no historical phone, OS, location or visitor identity is inferred.
-- Presence is derived at read time from visitorLastSeenAt and is never stored.

ALTER TABLE `ChatSession`
  ADD COLUMN `phone` VARCHAR(32) NULL,
  ADD COLUMN `operatingSystem` VARCHAR(80) NULL,
  ADD COLUMN `country` VARCHAR(80) NULL,
  ADD COLUMN `region` VARCHAR(120) NULL,
  ADD COLUMN `city` VARCHAR(120) NULL,
  ADD COLUMN `visitorId` VARCHAR(64) NULL,
  ADD COLUMN `visitStartedAt` DATETIME(3) NULL,
  ADD INDEX `ChatSession_tenantId_visitorId_idx` (`tenantId`, `visitorId`);
