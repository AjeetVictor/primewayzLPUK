-- SEO conversion daily hardening: deterministic bucket key hash and nullable-safe uniqueness.

ALTER TABLE `SeoPageConversionDaily`
    ADD COLUMN `bucketKeyHash` VARCHAR(64) NULL AFTER `seoPageId`;

UPDATE `SeoPageConversionDaily`
SET `bucketKeyHash` = SHA2(
    CONCAT(
        IF(`seoPageId` IS NULL, 'unknown', CAST(`seoPageId` AS CHAR)),
        CHAR(0),
        `attributionModel`,
        CHAR(0),
        LOWER(TRIM(`channelGroup`))
    ),
    256
)
WHERE `bucketKeyHash` IS NULL;

-- Drop duplicate aggregate snapshots; retain the newest complete row per bucket.
DELETE `target`
FROM `SeoPageConversionDaily` AS `target`
INNER JOIN (
    SELECT `id`
    FROM (
        SELECT
            `id`,
            ROW_NUMBER() OVER (
                PARTITION BY `metricDate`, `bucketKeyHash`
                ORDER BY `updatedAt` DESC, `id` DESC
            ) AS `rowNum`
        FROM `SeoPageConversionDaily`
    ) AS `ranked`
    WHERE `rowNum` > 1
) AS `dupes`
    ON `target`.`id` = `dupes`.`id`;

DROP INDEX `SeoPageConversionDaily_uniq` ON `SeoPageConversionDaily`;

ALTER TABLE `SeoPageConversionDaily`
    MODIFY `bucketKeyHash` VARCHAR(64) NOT NULL;

CREATE UNIQUE INDEX `SeoPageConversionDaily_uniq`
    ON `SeoPageConversionDaily`(`metricDate`, `bucketKeyHash`);

CREATE INDEX `SeoPageConversionDaily_bucketKeyHash_metricDate_idx`
    ON `SeoPageConversionDaily`(`bucketKeyHash`, `metricDate`);
