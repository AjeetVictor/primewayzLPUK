-- Article Autopilot Phase 2A.1: validated GSC identity and property onboarding.
-- Additive only: nullable columns and indexes. No DROP / TRUNCATE / DELETE.

-- AlterTable GscConnection
ALTER TABLE `GscConnection` ADD COLUMN `requestedSiteUrl` VARCHAR(512) NULL,
    ADD COLUMN `expectedEmail` VARCHAR(320) NULL,
    ADD COLUMN `googleSubject` VARCHAR(255) NULL,
    ADD COLUMN `authorisedEmail` VARCHAR(320) NULL,
    ADD COLUMN `authorisedEmailVerified` BOOLEAN NULL,
    ADD COLUMN `identityValidatedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `GscConnection_googleSubject_idx` ON `GscConnection`(`googleSubject`);

-- CreateIndex
CREATE INDEX `GscConnection_authorisedEmail_idx` ON `GscConnection`(`authorisedEmail`);

-- AlterTable GscOAuthState
ALTER TABLE `GscOAuthState` ADD COLUMN `requestedSiteUrl` VARCHAR(512) NULL,
    ADD COLUMN `expectedEmail` VARCHAR(320) NULL;
