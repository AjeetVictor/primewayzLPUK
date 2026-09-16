-- Additive Scheduling foundation (provider-neutral; Calendly is provider #1).
-- No backfill of historical ownership. OAuth ciphertext columns are nullable and unused until encrypted storage is wired.
-- connectionKey on appointments/webhook events is a logical reference (no FK) so env-backed UK Calendly works without DB seed rows.

CREATE TABLE `SchedulingConnection` (
    `id` VARCHAR(191) NOT NULL,
    `connectionKey` VARCHAR(64) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `provider` ENUM('CALENDLY', 'CAL_COM', 'MICROSOFT_BOOKINGS', 'GOOGLE_CALENDAR', 'CUSTOM') NOT NULL,
    `status` ENUM('active', 'inactive', 'needs_credentials', 'error') NOT NULL DEFAULT 'inactive',
    `providerOrganizationUri` VARCHAR(512) NULL,
    `providerUserUri` VARCHAR(512) NULL,
    `webhookSigningSecretEnv` VARCHAR(128) NULL,
    `credentialEnvPrefix` VARCHAR(128) NULL,
    `clientSideAnalyticsOwned` BOOLEAN NOT NULL DEFAULT false,
    `oauthRefreshCiphertext` TEXT NULL,
    `oauthRefreshIv` VARCHAR(64) NULL,
    `oauthRefreshAuthTag` VARCHAR(64) NULL,
    `oauthTokenKeyVersion` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SchedulingConnection_connectionKey_key`(`connectionKey`),
    INDEX `SchedulingConnection_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `SchedulingConnection_provider_providerOrganizationUri_idx`(`provider`, `providerOrganizationUri`),
    INDEX `SchedulingConnection_provider_providerUserUri_idx`(`provider`, `providerUserUri`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SchedulingEventType` (
    `id` VARCHAR(191) NOT NULL,
    `connectionId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `providerEventTypeUri` VARCHAR(512) NULL,
    `publicBookingUrl` VARCHAR(1024) NULL,
    `metadataJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchedulingEventType_tenantId_active_idx`(`tenantId`, `active`),
    UNIQUE INDEX `SchedulingEventType_connectionId_key_key`(`connectionId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SchedulingAppointment` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `connectionKey` VARCHAR(64) NOT NULL,
    `provider` ENUM('CALENDLY', 'CAL_COM', 'MICROSOFT_BOOKINGS', 'GOOGLE_CALENDAR', 'CUSTOM') NOT NULL,
    `providerEventId` VARCHAR(512) NOT NULL,
    `providerInviteeId` VARCHAR(512) NULL,
    `eventTypeKey` VARCHAR(64) NOT NULL,
    `status` ENUM('scheduled', 'cancelled', 'completed', 'no_show', 'pending') NOT NULL DEFAULT 'pending',
    `scheduledStart` DATETIME(3) NULL,
    `scheduledEnd` DATETIME(3) NULL,
    `inviteeName` VARCHAR(191) NULL,
    `inviteeEmail` VARCHAR(320) NULL,
    `sourceSite` VARCHAR(191) NULL,
    `sourceChannel` VARCHAR(64) NULL,
    `chatSessionId` VARCHAR(64) NULL,
    `conversionEmitted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchedulingAppointment_tenantId_scheduledStart_idx`(`tenantId`, `scheduledStart`),
    INDEX `SchedulingAppointment_chatSessionId_idx`(`chatSessionId`),
    INDEX `SchedulingAppointment_connectionKey_idx`(`connectionKey`),
    UNIQUE INDEX `SchedulingAppointment_provider_providerEventId_key`(`provider`, `providerEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SchedulingWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('CALENDLY', 'CAL_COM', 'MICROSOFT_BOOKINGS', 'GOOGLE_CALENDAR', 'CUSTOM') NOT NULL,
    `providerEventId` VARCHAR(512) NOT NULL,
    `tenantId` VARCHAR(32) NOT NULL,
    `connectionKey` VARCHAR(64) NULL,
    `eventType` VARCHAR(128) NOT NULL,
    `status` ENUM('received', 'processed', 'ignored', 'rejected', 'error') NOT NULL DEFAULT 'received',
    `appointmentId` VARCHAR(191) NULL,
    `errorSummary` VARCHAR(512) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `SchedulingWebhookEvent_tenantId_receivedAt_idx`(`tenantId`, `receivedAt`),
    INDEX `SchedulingWebhookEvent_status_receivedAt_idx`(`status`, `receivedAt`),
    INDEX `SchedulingWebhookEvent_connectionKey_idx`(`connectionKey`),
    UNIQUE INDEX `SchedulingWebhookEvent_provider_providerEventId_key`(`provider`, `providerEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SchedulingEventType`
  ADD CONSTRAINT `SchedulingEventType_connectionId_fkey`
  FOREIGN KEY (`connectionId`) REFERENCES `SchedulingConnection`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SchedulingWebhookEvent`
  ADD CONSTRAINT `SchedulingWebhookEvent_appointmentId_fkey`
  FOREIGN KEY (`appointmentId`) REFERENCES `SchedulingAppointment`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
