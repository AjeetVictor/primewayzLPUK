-- SEO conversion daily hardening: deterministic bucket key hash and nullable-safe uniqueness.

ALTER TABLE `SeoPageConversionDaily`
    ADD COLUMN `bucketKeyHash` VARCHAR(64) NULL AFTER `seoPageId`;

UPDATE `SeoPageConversionDaily`
SET `bucketKeyHash` = SHA2(
    CONCAT(
        IF(`seoPageId` IS NULL, 'unknown', CAST(`seoPageId` AS CHAR)),
        '\0',
        `attributionModel`,
        '\0',
        LOWER(TRIM(`channelGroup`))
    ),
    256
)
WHERE `bucketKeyHash` IS NULL;

-- Consolidate duplicate buckets (e.g. multiple NULL seoPageId rows for the same day/model/channel).
CREATE TEMPORARY TABLE `_SeoConversionDupSurvivors` AS
SELECT
    MIN(`id`) AS `survivorId`,
    `metricDate`,
    `bucketKeyHash`,
    SUM(`chatsInitiated`) AS `chatsInitiated`,
    SUM(`qualifiedChats`) AS `qualifiedChats`,
    SUM(`contactForms`) AS `contactForms`,
    SUM(`reviewRequests`) AS `reviewRequests`,
    SUM(`bookingRequests`) AS `bookingRequests`,
    SUM(`bookingsCompleted`) AS `bookingsCompleted`,
    SUM(`qualifiedLeads`) AS `qualifiedLeads`,
    SUM(`proposals`) AS `proposals`,
    SUM(`wonOpportunities`) AS `wonOpportunities`,
    SUM(`attributedValueMinor`) AS `attributedValueMinor`,
    MAX(`currency`) AS `currency`,
    SUM(`unknownAttributionCount`) AS `unknownAttributionCount`
FROM `SeoPageConversionDaily`
GROUP BY `metricDate`, `bucketKeyHash`
HAVING COUNT(*) > 1;

UPDATE `SeoPageConversionDaily` AS `target`
INNER JOIN `_SeoConversionDupSurvivors` AS `merged`
    ON `target`.`id` = `merged`.`survivorId`
SET
    `target`.`chatsInitiated` = `merged`.`chatsInitiated`,
    `target`.`qualifiedChats` = `merged`.`qualifiedChats`,
    `target`.`contactForms` = `merged`.`contactForms`,
    `target`.`reviewRequests` = `merged`.`reviewRequests`,
    `target`.`bookingRequests` = `merged`.`bookingRequests`,
    `target`.`bookingsCompleted` = `merged`.`bookingsCompleted`,
    `target`.`qualifiedLeads` = `merged`.`qualifiedLeads`,
    `target`.`proposals` = `merged`.`proposals`,
    `target`.`wonOpportunities` = `merged`.`wonOpportunities`,
    `target`.`attributedValueMinor` = `merged`.`attributedValueMinor`,
    `target`.`currency` = `merged`.`currency`,
    `target`.`unknownAttributionCount` = `merged`.`unknownAttributionCount`;

DELETE `target`
FROM `SeoPageConversionDaily` AS `target`
INNER JOIN (
    SELECT
        `metricDate`,
        `bucketKeyHash`,
        MIN(`id`) AS `survivorId`
    FROM `SeoPageConversionDaily`
    GROUP BY `metricDate`, `bucketKeyHash`
    HAVING COUNT(*) > 1
) AS `dupes`
    ON `target`.`metricDate` = `dupes`.`metricDate`
    AND `target`.`bucketKeyHash` = `dupes`.`bucketKeyHash`
    AND `target`.`id` <> `dupes`.`survivorId`;

DROP TEMPORARY TABLE `_SeoConversionDupSurvivors`;

DROP INDEX `SeoPageConversionDaily_uniq` ON `SeoPageConversionDaily`;

ALTER TABLE `SeoPageConversionDaily`
    MODIFY `bucketKeyHash` VARCHAR(64) NOT NULL;

CREATE UNIQUE INDEX `SeoPageConversionDaily_uniq`
    ON `SeoPageConversionDaily`(`metricDate`, `bucketKeyHash`);

CREATE INDEX `SeoPageConversionDaily_bucketKeyHash_metricDate_idx`
    ON `SeoPageConversionDaily`(`bucketKeyHash`, `metricDate`);
