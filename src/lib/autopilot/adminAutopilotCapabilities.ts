/**
 * Frontend Autopilot capability helpers.
 * Mirror server rules for UI visibility only — never treat as security enforcement.
 */

import {
  canContributeTopics,
  canEditorialAutopilot,
  canManageAutopilotSettings,
  canReadAutopilot,
} from './autopilotPermissions.ts';

export type AutopilotUiCapabilities = {
  canRead: boolean;
  canContribute: boolean;
  canEditorial: boolean;
  canManageSettings: boolean;
};

export function getAutopilotUiCapabilities(role?: string): AutopilotUiCapabilities {
  return {
    canRead: canReadAutopilot(role),
    canContribute: canContributeTopics(role),
    canEditorial: canEditorialAutopilot(role),
    /** Phase 1D intentionally exposes no settings-edit UI. */
    canManageSettings: false,
  };
}

/** True when the Autopilot admin tab should appear. */
export function canShowAutopilotTab(role?: string): boolean {
  return canReadAutopilot(role);
}

export function assertNoSettingsEditCapabilityExposed(role?: string): boolean {
  const caps = getAutopilotUiCapabilities(role);
  // Even super_admin must not get settings-edit controls in Phase 1D UI.
  return caps.canManageSettings === false && canManageAutopilotSettings(role) === (role === 'super_admin');
}
