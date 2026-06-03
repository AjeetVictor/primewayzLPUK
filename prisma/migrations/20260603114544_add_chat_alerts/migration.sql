CREATE TABLE `ChatAlert` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sessionId` VARCHAR(191) NOT NULL,
  `messageId` INTEGER NOT NULL,
  `alertType` VARCHAR(191) NOT NULL DEFAULT 'unanswered_chat',
  `status` VARCHAR(191) NOT NULL DEFAULT 'logged',
  `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `ChatAlert_messageId_alertType_key`(`messageId`, `alertType`),
  INDEX `ChatAlert_sessionId_idx`(`sessionId`),
  INDEX `ChatAlert_sentAt_idx`(`sentAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
