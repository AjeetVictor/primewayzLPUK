import type { RequestHandler } from 'express';
import {
  listAuthorizedAdminTenantOptions,
  type AdminTenantPrincipal,
} from './adminTenantAccess.ts';

/**
 * Read-only list of tenants the signed-in administrator may filter or grant.
 * Mounted behind requireAdmin. This is not a tenant-management API.
 */
export function createAdminTenantOptionsHandler(): RequestHandler {
  return (req, res) => {
    const principal = (req as { adminUser?: AdminTenantPrincipal }).adminUser;
    if (!principal) {
      res.status(401).json({
        error: 'Authenticated admin access is required.',
        code: 'admin_access_required',
      });
      return;
    }
    res.json({ options: listAuthorizedAdminTenantOptions(principal) });
  };
}
