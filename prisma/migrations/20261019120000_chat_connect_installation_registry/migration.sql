-- Additive Chat Connect installation registry.
-- Does not create a tenant table and does not modify User, ChatSession, or chat message rows.
-- The pw-infotech seed records this migration's provisioning time only.
-- Historical registration, authorization, and verified activation are left unknown.

CREATE TABLE `ChatConnectInstallation` (
  `id` VARCHAR(64) NOT NULL,
  `tenantId` VARCHAR(32) NOT NULL,
  `integrationTechnology` VARCHAR(32) NOT NULL,
  `integrationId` VARCHAR(64) NULL,
  `authorizationStatus` VARCHAR(32) NOT NULL,
  `frontendVisibility` VARCHAR(16) NOT NULL,
  `addonVersion` VARCHAR(32) NULL,
  `widgetVersion` VARCHAR(32) NULL,
  `legacyEnvBinding` BOOLEAN NOT NULL DEFAULT false,
  `heartbeatProtocolAdopted` BOOLEAN NOT NULL DEFAULT false,
  `credentialKeyId` VARCHAR(64) NULL,
  `credentialHash` VARCHAR(64) NULL,
  `credentialIssuedAt` DATETIME(3) NULL,
  `credentialRotatedAt` DATETIME(3) NULL,
  `registeredAt` DATETIME(3) NULL,
  `provisionedAt` DATETIME(3) NULL,
  `authorizedAt` DATETIME(3) NULL,
  `activatedAt` DATETIME(3) NULL,
  `lastVerifiedHeartbeatAt` DATETIME(3) NULL,
  `lastAuthenticatedActivityAt` DATETIME(3) NULL,
  `suspendedAt` DATETIME(3) NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `ChatConnectInstallation_credentialKeyId_key` (`credentialKeyId`),
  INDEX `ChatConnectInstallation_tenantId_authorizationStatus_idx` (`tenantId`, `authorizationStatus`),
  INDEX `ChatConnectInstallation_legacyBinding_idx` (`integrationId`, `tenantId`, `legacyEnvBinding`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ChatConnectAuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `installationId` VARCHAR(64) NOT NULL,
  `tenantId` VARCHAR(32) NOT NULL,
  `actorUserId` INTEGER NULL,
  `action` VARCHAR(64) NOT NULL,
  `details` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ChatConnectAuditLog_installationId_createdAt_idx` (`installationId`, `createdAt`),
  INDEX `ChatConnectAuditLog_tenantId_createdAt_idx` (`tenantId`, `createdAt`),
  CONSTRAINT `ChatConnectAuditLog_installationId_fkey`
    FOREIGN KEY (`installationId`) REFERENCES `ChatConnectInstallation`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ChatConnectIdempotencyKey` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `installationId` VARCHAR(64) NOT NULL,
  `action` VARCHAR(32) NOT NULL,
  `clientActionId` VARCHAR(64) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `ChatConnectIdempotency_install_action_key` (`installationId`, `action`, `clientActionId`),
  INDEX `ChatConnectIdempotencyKey_createdAt_idx` (`createdAt`),
  INDEX `ChatConnectIdempotencyKey_action_createdAt_idx` (`action`, `createdAt`),
  CONSTRAINT `ChatConnectIdempotencyKey_installationId_fkey`
    FOREIGN KEY (`installationId`) REFERENCES `ChatConnectInstallation`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Established primewayz-wordpress binding for the existing pw-infotech tenant.
-- The environment credential is not copied. Heartbeat protocol is not adopted.
INSERT INTO `ChatConnectInstallation` (
  `id`,
  `tenantId`,
  `integrationTechnology`,
  `integrationId`,
  `authorizationStatus`,
  `frontendVisibility`,
  `addonVersion`,
  `widgetVersion`,
  `legacyEnvBinding`,
  `heartbeatProtocolAdopted`,
  `credentialKeyId`,
  `credentialHash`,
  `credentialIssuedAt`,
  `credentialRotatedAt`,
  `registeredAt`,
  `provisionedAt`,
  `authorizedAt`,
  `activatedAt`,
  `lastVerifiedHeartbeatAt`,
  `lastAuthenticatedActivityAt`,
  `suspendedAt`,
  `revokedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  'cci_pw_infotech_wordpress',
  'pw-infotech',
  'wordpress',
  'primewayz-wordpress',
  'active',
  'unset',
  NULL,
  NULL,
  true,
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP(3),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `ChatConnectInstallation` AS `existing`
  WHERE `existing`.`id` = 'cci_pw_infotech_wordpress'
);

INSERT INTO `ChatConnectAuditLog` (
  `installationId`,
  `tenantId`,
  `actorUserId`,
  `action`,
  `details`,
  `createdAt`
)
SELECT
  'cci_pw_infotech_wordpress',
  'pw-infotech',
  NULL,
  'provisioned_existing_binding',
  JSON_OBJECT(
    'integrationId', 'primewayz-wordpress',
    'source', 'existing_environment_binding',
    'historicalRegistration', 'unknown',
    'historicalActivation', 'unknown'
  ),
  CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `ChatConnectAuditLog` AS `existing`
  WHERE `existing`.`installationId` = 'cci_pw_infotech_wordpress'
    AND `existing`.`action` = 'provisioned_existing_binding'
);

-- Primewayz UK first-party visitor chat (in-app React LiveChat).
-- Not a connector credential, not a verified heartbeat, and not Connected
-- because this API process is running. Historical dates stay unknown.
-- RentReadBuy and Silver are not seeded.
INSERT INTO `ChatConnectInstallation` (
  `id`,
  `tenantId`,
  `integrationTechnology`,
  `integrationId`,
  `authorizationStatus`,
  `frontendVisibility`,
  `addonVersion`,
  `widgetVersion`,
  `legacyEnvBinding`,
  `heartbeatProtocolAdopted`,
  `credentialKeyId`,
  `credentialHash`,
  `credentialIssuedAt`,
  `credentialRotatedAt`,
  `registeredAt`,
  `provisionedAt`,
  `authorizedAt`,
  `activatedAt`,
  `lastVerifiedHeartbeatAt`,
  `lastAuthenticatedActivityAt`,
  `suspendedAt`,
  `revokedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  'cci_pw_uk_first_party',
  'pw-uk',
  'react',
  NULL,
  'active',
  'unset',
  NULL,
  NULL,
  false,
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP(3),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `ChatConnectInstallation` AS `existing`
  WHERE `existing`.`id` = 'cci_pw_uk_first_party'
);

INSERT INTO `ChatConnectAuditLog` (
  `installationId`,
  `tenantId`,
  `actorUserId`,
  `action`,
  `details`,
  `createdAt`
)
SELECT
  'cci_pw_uk_first_party',
  'pw-uk',
  NULL,
  'provisioned_existing_binding',
  JSON_OBJECT(
    'classification', 'first-party',
    'integrationTechnology', 'react',
    'source', 'live_chat_component',
    'historicalRegistration', 'unknown',
    'historicalActivation', 'unknown',
    'connectionHealth', 'not_inferred'
  ),
  CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `ChatConnectAuditLog` AS `existing`
  WHERE `existing`.`installationId` = 'cci_pw_uk_first_party'
    AND `existing`.`action` = 'provisioned_existing_binding'
);
