# Tenant access provisioning matrix

Complete and approve this matrix before deployment. Use account identifiers and business roles only; never add passwords, reset tokens, API keys, or other credentials. This file is a review template and does not authorize any live change.

| Account identifier | Operational role | Platform Host/Owner | Approved tenant grants | Business justification | Approver | Status |
|---|---|---:|---|---|---|---|
| _exact account email or immutable user ID_ | _e.g. platform owner_ | _yes/no_ | _pw-uk, pw-infotech, rrb, or none_ | _why this scope is required_ | _named reviewer_ | _pending/approved_ |

## Review rules

- Host/Owner is reserved for platform-wide user/grant administration and all-tenant audit access.
- A tenant administrator receives only explicit active tenant IDs and does not inherit Host authority.
- Blog authorship remains a content role and is reviewed separately from platform ownership.
- Multi-tenant grants require a documented cross-tenant operational need.
- Unknown/inactive tenants are invalid.
- Every row needs human approval; legacy admin or super_admin labels are not evidence of entitlement.