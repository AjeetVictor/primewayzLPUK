# Primewayz Chat Platform — Architecture

This note describes the layers that already exist and the two layers that are planned. Voice and agentic automation are not implemented.

The layers stay separate. A change in one layer does not rename or replace another.

## Tenant identity and entitlements

A tenant is a brand and data boundary in `PLATFORM_TENANTS`. Examples already registered are `pw-uk`, `pw-infotech`, `rrb`, and `rrb-silver-campaign`. The registry is the tenant list. Chat Connect does not create a second tenant table.

Activation is the registry `active` flag plus an optional environment gate. `rrb-silver-campaign` stays off unless `RRB_SILVER_CAMPAIGN_ENABLED` is exactly `true`. That gate remains authoritative.

`TenantChatEntitlement` is the central chat grant for one tenant. The Host/Owner is the only role that can change it. The statuses are entitled, suspended, and revoked. Each change stores the actor, tenant, status, timestamp, and reason.

Rules for effective chat:

- An unknown tenant is denied.
- An inactive tenant, including a closed environment gate, is denied.
- A compile-time capability map with chat off is denied. Entitled does not override that map.
- No entitlement row keeps the tenant’s existing chat behavior.
- Suspended or revoked denies chat.
- If the entitlement store cannot be read, chat is denied. The platform does not treat a failed read as “no row”.

Entitlement is not installation authorization and it is not connector health.

## Connector installations

`ChatConnectInstallation` is one deployment of a connector, or the first-party Primewayz UK chat surface, for one tenant. A tenant may have several installations. Each installation has its own identifier, credential, authorization status (`registered`, `active`, `suspended`, `revoked`), frontend visibility, and derived connection health.

Supported connector technologies are the explicit list `wordpress`, `shopify`, and `custom`. They share one registration, activation, and heartbeat route. There is no technology-specific route. The credential is bound to the installation, and the installation’s tenant wins over any tenant field in the request.

`react` is the first-party Primewayz UK LiveChat surface. It is not open for connector registration.

Suspending an installation does not suspend the tenant’s chat entitlement. Suspending the entitlement does not change an installation’s authorization status.

The existing WordPress operational chat API remains the server-to-server transport for the `wordpress` technology. Shopify and custom installations use the shared connector lifecycle. They do not gain a separate message API in this phase.

## Conversation channels

Visitor chat is the public `/api/chat` channel. Tenant identity comes from the registered Origin or Host, never from the request body. Public capabilities, visitor-chat authorization, and public chat CORS all use the same effective entitlement decision.

The WordPress operational API is a different channel. It is credential-bound to its tenant, has no browser CORS, and uses the same entitlement decision. Diagnostics always run. Dashboard and conversation reads stay available when the stored status is suspended or revoked, and they report chat as disabled. Delegated reply, resolve, and reopen are refused. If the entitlement store cannot be read, dashboard, conversation, and delegated writes are refused, and diagnostics report the service unavailable.

Admin replies and the other authenticated admin chat mutations use that same decision. They are not visitor chat. Admin conversation history stays readable. Host/Owner entitlement management is a separate route and is not closed by a suspended chat grant.

A stored session with no tenant id is a pre-tenant Primewayz UK conversation. Replies and other admin chat mutations on that session use the Primewayz UK entitlement, using the same owner the visitor guard already accepts. The stored tenant id stays null. The session stays outside a single-tenant admin filter. Its history stays readable when chat is entitled, suspended, revoked, or the entitlement store cannot be read. A tenant id in the request body does not choose the entitlement.

## Human response handling

People answer through the admin inbox and through delegated WordPress reply, resolve, and reopen actions. Those writes use the shared conversation store and stay inside the session’s tenant. A suspended or revoked entitlement stops new messages and the other admin chat mutations. It does not rewrite transcripts or session ownership. Public visitor history stays on the closed visitor channel. Authorised admin history, and WordPress dashboard and conversation reads, remain.

## Future real-time voice

Real-time voice is planned as another conversation channel on the same tenant boundary. It is not implemented. It will need its own session and media path. It must not be implied by a chat entitlement row, a connector heartbeat, or the current visitor widget.

## Future AI agents and business workflow automation

AI agents and business workflow automation are planned as a layer that can propose or carry work for a tenant. They are not implemented. They must not be inferred from the offline bot acknowledgement, quick replies, or an entitled chat status. A later design has to define a separate grant, a human handoff, and a tenant data boundary before any agent can act.

## Compatibility in this phase

Primewayz UK and Primewayz Infotech keep working while they have no entitlement row, because that is the existing-behavior path. Silver stays disabled until its environment gate is exactly `true`, even if a Host/Owner later marks it entitled. Existing public response shapes stay in place: capabilities still return the same object, with `chat` set false when the effective decision denies chat; visitor denial reuses the existing capability error; a failed entitlement read returns 503 rather than a successful chat session.
