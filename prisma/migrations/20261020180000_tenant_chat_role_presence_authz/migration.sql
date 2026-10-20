-- Additive per-tenant chat operator roles on existing UserTenantGrant rows.
-- Does not seed agent access, does not modify ChatSession / messages / presence rows,
-- and does not change User.isPlatformOwner. Default chatRole is none (fail closed for
-- new grants). Application compatibility preserves legitimate existing chat access
-- until a Host sets chatRoleExplicit (see Docs/chat-admin-tenant-presence-phase1.md).

ALTER TABLE `UserTenantGrant`
  ADD COLUMN `chatRole` VARCHAR(16) NOT NULL DEFAULT 'none',
  ADD COLUMN `chatRoleExplicit` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `UserTenantGrant_tenantId_chatRole_idx`
  ON `UserTenantGrant`(`tenantId`, `chatRole`);
