-- GA4 aggregate reporting enhancements: dimension key hash, normalised landing pages, partial sync status.

-- Extend sync status enum with PARTIAL (per-day committed upserts may succeed before failure).
ALTER TABLE `Ga4SyncRun` MODIFY `status` ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED') NOT NULL;

ALTER TABLE `Ga4SyncRun`
    ADD COLUMN `unmatchedPages` INTEGER NOT NULL DEFAULT 0 AFTER `rowsUpserted`;

ALTER TABLE `Ga4SyncRun`
    MODIFY `errorCode` VARCHAR(64) NULL;

ALTER TABLE `Ga4PageMetric`
    ADD COLUMN `normalisedLandingPage` TEXT NULL AFTER `observedLandingPageHash`,
    ADD COLUMN `normalisedLandingPageHash` VARCHAR(64) NULL AFTER `normalisedLandingPage`,
    ADD COLUMN `dimensionKeyHash` VARCHAR(64) NULL AFTER `normalisedLandingPageHash`,
    ADD COLUMN `unclassifiedLeadEvents` INTEGER NULL AFTER `bookingConversions`,
    ADD COLUMN `qaLeadEvents` INTEGER NULL AFTER `unclassifiedLeadEvents`;

-- Backfill normalised fields from observed values for any pre-existing rows.
UPDATE `Ga4PageMetric`
SET
    `normalisedLandingPage` = `observedLandingPage`,
    `normalisedLandingPageHash` = `observedLandingPageHash`,
    `dimensionKeyHash` = SHA2(
        CONCAT(
            COALESCE(`observedLandingPageHash`, ''),
            '\0',
            COALESCE(`defaultChannelGroup`, ''),
            '\0',
            COALESCE(`source`, ''),
            '\0',
            COALESCE(`medium`, '')
        ),
        256
    )
WHERE `dimensionKeyHash` IS NULL;

ALTER TABLE `Ga4PageMetric`
    MODIFY `normalisedLandingPage` TEXT NOT NULL,
    MODIFY `normalisedLandingPageHash` VARCHAR(64) NOT NULL,
    MODIFY `dimensionKeyHash` VARCHAR(64) NOT NULL;

-- Widen integer metrics (drop decimal storage for session counts).
ALTER TABLE `Ga4PageMetric`
    MODIFY `sessions` INTEGER NOT NULL DEFAULT 0,
    MODIFY `organicSessions` INTEGER NOT NULL DEFAULT 0,
    MODIFY `engagedSessions` INTEGER NOT NULL DEFAULT 0,
    MODIFY `engagementRate` DECIMAL(12, 8) NULL,
    MODIFY `averageEngagementTime` DECIMAL(18, 4) NULL,
    MODIFY `keyEvents` INTEGER NOT NULL DEFAULT 0,
    MODIFY `generateLeadEvents` INTEGER NOT NULL DEFAULT 0,
    MODIFY `contactFormConversions` INTEGER NOT NULL DEFAULT 0,
    MODIFY `bookingConversions` INTEGER NOT NULL DEFAULT 0;

DROP INDEX `Ga4PageMetric_uniq` ON `Ga4PageMetric`;

CREATE UNIQUE INDEX `Ga4PageMetric_uniq` ON `Ga4PageMetric`(`metricDate`, `dimensionKeyHash`);

CREATE INDEX `Ga4PageMetric_normalisedLandingPageHash_metricDate_idx`
    ON `Ga4PageMetric`(`normalisedLandingPageHash`, `metricDate`);

CREATE INDEX `Ga4PageMetric_defaultChannelGroup_metricDate_idx`
    ON `Ga4PageMetric`(`defaultChannelGroup`, `metricDate`);
