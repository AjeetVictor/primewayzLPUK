-- Phase 1: Chat lead-handling system (backward-compatible additive migration)

-- ChatSession: conversation status + source tracking
ALTER TABLE `ChatSession`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'new',
  ADD COLUMN `firstLandingPage` VARCHAR(191) NULL,
  ADD COLUMN `currentPageUrl` TEXT NULL,
  ADD COLUMN `referrer` TEXT NULL,
  ADD COLUMN `utmSource` VARCHAR(191) NULL,
  ADD COLUMN `utmMedium` VARCHAR(191) NULL,
  ADD COLUMN `utmCampaign` VARCHAR(191) NULL,
  ADD COLUMN `utmContent` VARCHAR(191) NULL,
  ADD COLUMN `deviceType` VARCHAR(191) NULL,
  ADD COLUMN `browser` VARCHAR(191) NULL,
  ADD COLUMN `serviceInterest` VARCHAR(191) NULL,
  ADD COLUMN `closedAt` DATETIME(3) NULL,
  ADD COLUMN `closedById` INTEGER NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

CREATE INDEX `ChatSession_status_idx` ON `ChatSession`(`status`);
CREATE INDEX `ChatSession_createdAt_idx` ON `ChatSession`(`createdAt`);

-- ChatMessage: internal notes, soft delete, edit support
ALTER TABLE `ChatMessage`
  ADD COLUMN `isInternalNote` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `deletedBy` INTEGER NULL,
  ADD COLUMN `editedAt` DATETIME(3) NULL,
  MODIFY COLUMN `text` TEXT NOT NULL;

CREATE INDEX `ChatMessage_sessionId_timestamp_idx` ON `ChatMessage`(`sessionId`, `timestamp`);
CREATE INDEX `ChatMessage_sender_answered_idx` ON `ChatMessage`(`sender`, `answered`);

-- Backfill conversation status from existing message history
UPDATE `ChatSession` cs
SET `status` = (
  SELECT CASE
    WHEN lm.sender = 'admin' THEN 'admin_replied'
    WHEN lm.sender = 'bot' THEN 'bot_replied'
    WHEN lm.sender = 'user' THEN 'admin_needed'
    ELSE 'new'
  END
  FROM (
    SELECT cm.sender
    FROM `ChatMessage` cm
    WHERE cm.sessionId = cs.id
    ORDER BY cm.timestamp DESC
    LIMIT 1
  ) lm
)
WHERE EXISTS (
  SELECT 1 FROM `ChatMessage` cm2 WHERE cm2.sessionId = cs.id
);
