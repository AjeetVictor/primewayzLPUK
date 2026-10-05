-- Tenant-scoped team presence.
-- Legacy ChatPresenceSetting / AdminPresence rows were written by the UK Admin and are
-- assigned to pw-uk only. They are not duplicated to pw-infotech or rrb, so those tenants
-- start with no presence rows and resolve to default (auto, no active admin).
-- IDs and timestamps are preserved.

-- 1. Add tenantId as nullable.
ALTER TABLE `ChatPresenceSetting` ADD COLUMN `tenantId` VARCHAR(32) NULL;
ALTER TABLE `AdminPresence` ADD COLUMN `tenantId` VARCHAR(32) NULL;

-- 2. Backfill legacy rows to pw-uk.
UPDATE `ChatPresenceSetting` SET `tenantId` = 'pw-uk' WHERE `tenantId` IS NULL;
UPDATE `AdminPresence` SET `tenantId` = 'pw-uk' WHERE `tenantId` IS NULL;

-- 3. Make tenantId required.
ALTER TABLE `ChatPresenceSetting` MODIFY `tenantId` VARCHAR(32) NOT NULL;
ALTER TABLE `AdminPresence` MODIFY `tenantId` VARCHAR(32) NOT NULL;

-- 4. Replace the global userId uniqueness with per-tenant uniqueness.
CREATE UNIQUE INDEX `AdminPresence_tenantId_userId_key` ON `AdminPresence`(`tenantId`, `userId`);
DROP INDEX `AdminPresence_userId_key` ON `AdminPresence`;

-- 5. Tenant + latest lookup indexes.
CREATE INDEX `ChatPresenceSetting_tenantId_updatedAt_idx` ON `ChatPresenceSetting`(`tenantId`, `updatedAt`);
CREATE INDEX `AdminPresence_tenantId_lastSeenAt_idx` ON `AdminPresence`(`tenantId`, `lastSeenAt`);
