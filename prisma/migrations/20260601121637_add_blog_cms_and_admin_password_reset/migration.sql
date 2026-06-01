-- AlterTable
ALTER TABLE `User` ADD COLUMN `resetPasswordExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordTokenHash` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `CmsBlogPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `excerpt` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `tags` JSON NOT NULL,
    `date` DATETIME(3) NULL,
    `updatedDate` DATETIME(3) NULL,
    `author` VARCHAR(191) NOT NULL,
    `readTime` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `content` LONGTEXT NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `reviewedById` INTEGER NULL,
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CmsBlogPost_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

