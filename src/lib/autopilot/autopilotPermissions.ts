/**
 * Autopilot capability checks aligned with server.ts role helpers.
 * Settings mutation is intentionally stricter than isSuperAdmin (super_admin only).
 */

export function isSuperAdmin(role?: string): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function isBlogAuthor(role?: string): boolean {
  return (
    isSuperAdmin(role) ||
    role === 'blog_editor' ||
    role === 'editor' ||
    role === 'blog_author'
  );
}

/** Editorial roles: blog_editor / editor, plus admin hierarchy via isSuperAdmin. */
export function isBlogEditor(role?: string): boolean {
  return isSuperAdmin(role) || role === 'blog_editor' || role === 'editor';
}

export function canReadAutopilot(role?: string): boolean {
  return isBlogAuthor(role);
}

export function canContributeTopics(role?: string): boolean {
  return isBlogAuthor(role);
}

export function canEditorialAutopilot(role?: string): boolean {
  return isBlogEditor(role);
}

/** Locked settings require true super_admin — not the broader admin alias. */
export function canManageAutopilotSettings(role?: string): boolean {
  return role === 'super_admin';
}

/** GSC connect / select / sync / disconnect — super_admin only. */
export function canManageGscConnection(role?: string): boolean {
  return role === 'super_admin';
}
