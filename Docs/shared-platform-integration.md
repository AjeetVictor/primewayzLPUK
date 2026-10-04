# Shared multi-tenant service platform — client integration contract

This document is the implementation contract for frontends that call the shared Primewayz platform APIs from:

- `https://uk.primewayz.com` (Primewayz UK / `pw-uk`)
- `https://primewayz.com` and `https://www.primewayz.com` (Primewayz Infotech / `pw-infotech`)
- `https://rentreadbuy.com` and `https://www.rentreadbuy.com` (RentReadBuy / `rrb`)
- future client tenants (for example Digiblend, SRH) once registered with real production domains

### Deployment model: one backend, one database

There is exactly one backend: the Primewayz UK Node application at `https://uk.primewayz.com`, using the existing shared remote database. Other properties are frontends that call it from the browser; they have no backend, API deployment or database of their own.

```text
Primewayz UK website ──────────────┐
                                   ├──> Primewayz UK Node backend (uk.primewayz.com) ──> existing shared remote DB
Primewayz.com WordPress (browser) ─┘     same /api/chat/* endpoints
```

`tenantId` / `market` / `sourceSite` / `sourceOrigin` / `sourceChannel` are logical source attribution used for reporting and Admin filtering. They are not infrastructure isolation: a `pw-infotech` conversation is a row in the same database, managed by the same Primewayz UK application and Admin as a `pw-uk` one.

## A. Source identity

Tenant ownership is **server-derived**.

Browsers may send normal transport headers:

- `Origin`
- `Host`
- `Referer` where appropriate

Browsers must **never** send (and the API rejects) body fields that attempt to set:

- `tenantId`
- `market`
- `sourceSite`
- `sourceOrigin`
- `sourceChannel`

Conceptual flow:

```text
Browser Origin → Shared API → trusted origin resolution → Tenant Context
```

`campaignId` remains attribution only and never changes tenant identity.

## B. Supported current tenants

| tenantId | Display name | Market | Trusted origins |
|---|---|---|---|
| `pw-uk` | Primewayz UK | UK | `https://uk.primewayz.com` |
| `pw-infotech` | Primewayz Infotech | IN | `https://primewayz.com`, `https://www.primewayz.com` |
| `rrb` | RentReadBuy | IN | `https://rentreadbuy.com`, `https://www.rentreadbuy.com` |

Inactive future Primewayz markets (`pw-us`, `pw-uae`, `pw-mx`) remain registered but cannot activate via browser input.

Do not invent production domains for Digiblend / SRH until known. Onboard them via tenant registry configuration.

## C. Public APIs

### Capabilities (discover allowed services)

`GET /api/platform/capabilities`

Resolves tenant from `Origin`/`Host` and returns safe capability + scheduling flags.

### Website Audit

`POST /api/v1/website-audits`

Requires tenant capability `audit`. Default CORS allowlist is capability-filtered (RRB is excluded until audit is enabled).

### Forms / leads

- `POST /api/contact`
- `POST /api/digital-systems-review`

Require capability `forms`.

### Chat

- `GET /api/chat/availability`
- `POST /api/chat/session`
- `POST /api/chat/heartbeat`
- `GET /api/chat/:sessionId`
- `POST /api/chat/respond`
- `POST /api/chat/uploads` (may return `501` until configured)
- `POST /api/chat/appointments` (requires `scheduling` + enabled booking config)

Require capability `chat`. Cross-tenant session reuse returns `403`. Full visitor contract, session id rules, limits and error codes: see section J.

`POST /api/chat` is **not** a visitor endpoint. It is the authenticated admin reply endpoint used by the UK admin panel (same origin, admin cookie) and is not exposed through public Chat CORS.

### Scheduling

- `GET /api/scheduling/availability` — public DTO, no secrets
- `POST /api/scheduling/webhooks/calendly` — provider webhook (not browser CORS)

Scheduling is the platform abstraction. Calendly is provider implementation `#1`.

### Conversion / analytics

Client-side UK Calendly widget analytics remain:

- `booking_calendar_open`
- `calendly_widget_view`
- `calendly_event_scheduled`
- `generate_lead`

Do not emit duplicate competing events for the same UK widget booking. Server webhook creates `SchedulingAppointment` records and skips conversion emission when the connection is marked client-analytics-owned (UK default).

## D. Required request / response fields

Capabilities response shape:

```json
{
  "tenant": {
    "key": "pw-infotech",
    "displayName": "Primewayz Infotech",
    "market": "IN",
    "brand": "Primewayz"
  },
  "capabilities": {
    "audit": true,
    "forms": true,
    "chat": true,
    "conversion": true,
    "scheduling": true
  },
  "scheduling": {
    "enabled": false,
    "provider": null,
    "eventTypeKey": null,
    "publicBookingUrl": null
  }
}
```

RentReadBuy example:

```json
{
  "capabilities": {
    "audit": false,
    "forms": false,
    "chat": true,
    "conversion": false,
    "scheduling": false
  }
}
```

Chat session create requires `sessionId`. Soft appointment create requires `sessionId` and an enabled scheduling configuration for that tenant.

Never expect provider secrets, webhook signing keys, or internal Calendly user/org URIs in public responses.

## E. CORS behaviour

Public Chat and platform capability endpoints derive allowed origins from the **canonical active tenant registry**.

Trusted origins after this patch:

- `https://uk.primewayz.com`
- `https://primewayz.com`
- `https://www.primewayz.com`
- `https://rentreadbuy.com`
- `https://www.rentreadbuy.com`

Unknown Origin → `403`.

Chat CORS is further limited to tenants with capability `chat`.

## F. Common error codes

| Code | Meaning |
|---|---|
| `400` | Validation / forbidden body identity fields (Chat adds `session_id_invalid` and `invalid_input` codes, see J.6) |
| `401` | Admin authentication required (admin endpoints such as `POST /api/chat`) |
| `403` | Unknown origin, cross-tenant ownership, capability disabled, or admin role lacks permission |
| `404` | Missing resource |
| `409` | Reserved for future conflict cases |
| `429` | Rate limited (audit / forms / Chat; Chat returns code `rate_limited` and `Retry-After`) |
| `501` | Feature not configured (for example chat uploads) |
| `503` | Temporary dependency unavailable |

## G. Scheduling behaviour

1. Resolve tenant from Origin.
2. Check `tenantSupportsCapability('scheduling')`.
3. Resolve tenant-owned scheduling configuration (`getSchedulingAvailability`).
4. Expose public booking URL only when enabled.
5. Chat booking CTA / `/api/chat/appointments` follows scheduling availability.
6. RRB: Chat works; booking unavailable.
7. `pw-uk`: existing Calendly discovery URL remains the default public booking URL.
8. `pw-infotech`: capability enabled; booking stays disabled until Infotech connection/event URL is configured via env (does not inherit UK booking).

## H. Notification ownership

Notifications use tenant-specific env keys:

- `pw-uk` → `INTERNAL_NOTIFICATION_EMAIL`
- `pw-infotech` → `PW_INFOTECH_NOTIFICATION_EMAIL`
- `rrb` → `RRB_NOTIFICATION_EMAIL`

If a destination is unset: persist the underlying record and skip notification safely. **Never** fall back to another tenant’s recipient.

## I. Client onboarding checklist

1. Add tenant registry entry (`tenantId`, brand, market, displayName, active).
2. Register trusted origins/domains only with real production hosts.
3. Set capability flags (`audit`, `forms`, `chat`, `conversion`, `scheduling`).
4. Configure notification env key + production recipient.
5. Optionally configure Scheduling connection + event type (Calendly user/org URI + public booking URL).
6. Configure Calendly webhook signing key and ownership URI mapping.
7. Point the client frontend at `/api/platform/capabilities` and Chat endpoints on the shared API host.
8. Confirm Admin entity selector visibility and UK-only module isolation (Autopilot / Blog CMS / Blog Comments remain UK-specific).
9. Add focused platform tests for origin → tenant and cross-tenant 403s.

## J. Visitor Chat API (hardened)

### J.1 API base

```text
https://uk.primewayz.com
```

All tenants (`pw-uk`, `pw-infotech`, `rrb`) call the same host. There is no versioned Chat path; `/api/v1/chat/*` does not exist.

### J.2 Tenant derivation

The tenant is derived server-side from the browser `Origin` header via the tenant registry (`Host` only when `Origin` is absent). For example:

| Origin | tenantId | market | sourceSite | sourceChannel |
|---|---|---|---|---|
| `https://uk.primewayz.com` | `pw-uk` | `UK` | `uk.primewayz.com` | `chat` |
| `https://primewayz.com`, `https://www.primewayz.com` | `pw-infotech` | `IN` | `primewayz.com` | `chat` |

Clients must **not** send `tenantId`, `market`, `sourceSite`, `sourceOrigin` or `sourceChannel` in any body. A body containing any of these keys is rejected with `400` (`Source identity fields are controlled by the server.`). Unknown origins receive `403` (`Origin is not allowed.`) from the Chat CORS layer.

Rate limits are also keyed on the server-resolved tenant, never on body input.

### J.3 Session ids

The session id is the visitor's bearer credential for reading a conversation.

- **New sessions** must use a UUID v4 (for example from `crypto.randomUUID()`, or `crypto.getRandomValues()` formatted as UUID v4). Do not use `Math.random()`.
- **Legacy sessions:** short ids created by older UK widget versions keep working for as long as the session already exists server-side and belongs to the resolved tenant.
- **Unknown weak ids:** an id that does not exist and is not a UUID v4 is rejected with `400` and code `session_id_invalid`. Nothing is written.
- Any id longer than 191 characters, empty, or not a string is rejected with `session_id_invalid`.
- An existing session that belongs to another tenant returns `403` (unchanged).

**localStorage behaviour (UK widget, `src/components/LiveChat.tsx`):**

1. The id is stored in `localStorage["chat_session_id"]`. An existing stored value (legacy or UUID) is reused as-is.
2. When no value is stored, a UUID v4 is generated and stored.
3. If the API returns `400` + `session_id_invalid` for the stored id, and that id is not a UUID v4, the widget generates a new UUID v4, replaces the stored value, and retries the same request once.
4. The id is never regenerated for `403`, `429`, `5xx`, network errors, or for legacy ids that still resolve. Strong ids are never rotated, so the retry cannot loop.

### J.4 Visitor endpoints

All endpoints below require tenant capability `chat`. Request bodies are JSON (`Content-Type: application/json`). Source attribution fields (`firstLandingPage`, `currentPageUrl`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `deviceType`, `browser`, `serviceInterest`) are optional on `session` and `heartbeat`.

**`GET /api/platform/capabilities`**

Returns the capabilities response shown in section D.

**`GET /api/chat/availability`**

```json
{
  "status": "online | assistant | away | offline",
  "title": "AI assistant available",
  "subtitle": "Leave a message and we will follow up.",
  "responseExpectation": "We usually respond within one business day.",
  "businessHours": "Mon-Fri, India business hours",
  "canAcceptMessages": true,
  "canBookCall": false,
  "tenantId": "pw-infotech",
  "scheduling": { "enabled": false, "provider": null, "eventTypeKey": null, "publicBookingUrl": null },
  "serverTime": "2026-10-04T10:00:00.000Z",
  "mode": "auto",
  "computedStatus": "assistant",
  "hasActiveAdmin": false,
  "latestAdminSeenAt": null,
  "customMessage": ""
}
```

**`POST /api/chat/heartbeat`**

Request:

```json
{ "sessionId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301", "userName": "", "userEmail": "", "currentPageUrl": "https://primewayz.com/services" }
```

Response (creates the session when the id is a new UUID v4):

```json
{ "ok": true, "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301", "sessionId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301", "status": "new" }
```

When the database is unavailable the same shape is returned with `"unavailable": true`.

**`POST /api/chat/session`**

Request:

```json
{ "sessionId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301", "name": "Sam", "email": "sam@example.com" }
```

Response: same shape as heartbeat. Visitor name, email and attribution are stored but not echoed back.

**`GET /api/chat/:sessionId`**

Returns the visitor-visible message history (internal admin notes are excluded). An unknown UUID v4 returns `[]`.

```json
[
  {
    "id": 101,
    "sessionId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    "sender": "user | bot | admin",
    "text": "Hello",
    "timestamp": "2026-10-04T10:00:00.000Z",
    "answered": false,
    "replyToId": null,
    "replyTo": null,
    "attachments": [],
    "editedAt": null,
    "deletedAt": null
  }
]
```

**`POST /api/chat/respond`**

Request:

```json
{ "sessionId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301", "message": "Hello", "userName": "Sam", "attachmentIds": [] }
```

`attachmentIds` and `replyToId` are optional and may only reference records that already belong to the same session (public uploads currently return `501`, so clients should send `[]` or omit the field).

Response:

```json
{
  "userMessage": { "id": 101, "sender": "user", "text": "Hello", "timestamp": "..." },
  "botMessage": { "id": 102, "sender": "bot", "text": "Thanks for your message...", "timestamp": "..." },
  "availability": { "status": "assistant", "tenantId": "pw-infotech" }
}
```

When the database is unavailable the response is `200` with offline message stubs and `"unavailable": true`.

**`POST /api/chat/appointments`**

Requires capability `scheduling` and an enabled booking configuration for the tenant (otherwise `403`, `Scheduling is not available for this tenant.`).

Request:

```json
{
  "sessionId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "name": "Sam",
  "email": "sam@example.com",
  "phone": "+44 20 7946 0000",
  "preferredDate": "2026-10-05",
  "preferredTime": "10:30",
  "timezone": "Europe/London",
  "message": "Discuss CRM support"
}
```

Response: `201` with the stored appointment request (`id`, `sessionId`, submitted fields, `timezone`, `status: "pending"`, timestamps). `503` with `"unavailable": true` when the database is unavailable.

### J.5 Input limits

| Field | Endpoint(s) | Limit | Over limit |
|---|---|---|---|
| `message` | respond | 4000 characters, must not be whitespace-only | `400 invalid_input` |
| `userName` / `name` | respond, heartbeat, session, appointments | 200 characters | `400 invalid_input` |
| `userEmail` / `email` | heartbeat, session, appointments | 320 characters (no new format rules) | `400 invalid_input` |
| `phone` | appointments | 40 characters (any format) | `400 invalid_input` |
| `preferredDate`, `preferredTime`, `timezone` | appointments | 64 characters each | `400 invalid_input` |
| appointment `message` | appointments | 4000 characters | `400 invalid_input` |
| `attachmentIds` | respond | array of at most 10 positive integers, same session only | `400 invalid_input` |
| `replyToId` | respond | positive integer, same session, not an internal note | `400 invalid_input` |
| `campaignId` | all visitor POSTs | 191 characters | `400 invalid_input` |
| `currentPageUrl`, `referrer` | heartbeat, session | 2048 characters | truncated |
| `firstLandingPage`, `utm*`, `deviceType`, `browser`, `serviceInterest` | heartbeat, session | 191 characters | truncated |

Non-string values for string fields are rejected (`invalid_input`), except attribution fields, which are ignored when not strings.

### J.6 Error codes

| HTTP | `code` | Meaning |
|---|---|---|
| `400` | `session_id_invalid` | Session id is malformed, or unknown and not a UUID v4. Generate a new UUID v4. |
| `400` | `invalid_input` | A field failed validation. `field` names the offending field. |
| `400` | (none) | `sessionId is required` / `sessionId and message are required`, or forbidden source identity fields in the body |
| `403` | (none) | Unknown origin, cross-tenant session, capability disabled, or scheduling unavailable |
| `429` | `rate_limited` | Too many requests. Honour the `Retry-After` header (seconds). |
| `501` | (none) | `POST /api/chat/uploads` is not configured |
| `503` | (none) | `POST /api/chat/appointments` when the database is unavailable (`"unavailable": true`) |

Error bodies have the shape `{ "error": "...", "code": "...", "field": "..." }` (`code` and `field` only where listed). Chat CORS exposes `Retry-After` to cross-origin clients.

### J.7 Rate limits

Fixed windows, in-memory per server process. Each request counts against a **client** bucket (tenant + client IP) and, where a session id is present, a **session** bucket (tenant + session id). Either bucket being exhausted returns `429 rate_limited`.

| Category | Endpoints | Client bucket (tenant + IP) | Session bucket (tenant + session) |
|---|---|---|---|
| read | `GET /api/chat/:sessionId`, `GET /api/chat/availability` | 240 / minute | 90 / minute (history only) |
| heartbeat | `POST /api/chat/heartbeat` | 60 / minute | 12 / minute |
| message | `POST /api/chat/respond` | 60 / minute | 15 / minute |
| session | `POST /api/chat/session` | 20 / minute | 10 / minute |
| appointment | `POST /api/chat/appointments` | 10 / 15 minutes | 5 / 15 minutes |

These comfortably cover the UK widget cadence (history every 5 seconds while open and 45 seconds while closed, heartbeat every 30 seconds while open, availability every 60 seconds). The admin panel's 3-second conversation refresh uses the authenticated admin route (J.8), not these public buckets.

**Client IP and `TRUST_PROXY`:** the client IP is Express `req.ip`. Behind Apache, production must set `TRUST_PROXY=1` so `req.ip` is the visitor address rather than the proxy. If production runs without it and every request arrives from loopback, the client bucket is skipped (to avoid one shared site-wide bucket) and only session buckets apply. See `.env.example`.

### J.8 Admin chat endpoints (not public)

Visitor tenant resolution answers "which property did this visitor come from?" (Origin / Host, sections J.2–J.4). Admin authority answers "which conversations may this administrator operate on?" and never uses the admin page's Origin to pick a tenant. Admin chat routes read the tenant from the stored `ChatSession` and check it against the Admin entity selector (`tenantId` query: `pw-uk`, `pw-infotech`, `rrb` or `all`; defaults to `pw-uk` like every other admin list).

| Route | Purpose |
|---|---|
| `GET /api/admin/chats?tenantId=` | Messages for the selected entity |
| `GET /api/admin/sessions?tenantId=` | Conversations for the selected entity |
| `GET /api/admin/sessions/:sessionId/messages?tenantId=` | Full history of one conversation (including internal notes); used for the Admin 3-second refresh |
| `POST /api/chat?tenantId=` | Admin reply / internal note |

All require a valid admin session cookie and an operations role (`401` when not authenticated, `403` when the role lacks permission). Session-specific routes return `404` (`chat_session_not_found`) for unknown sessions and `403` (`tenant_scope_mismatch`) when the session is outside the selected entity. Legacy sessions without a tenant are reachable only under `all`. An unknown or inactive `tenantId` filter returns `400` (`invalid_tenant_filter`).

`POST /api/chat` accepts only `sender: "admin"` (`403`, code `sender_not_allowed`, otherwise), replies only to an existing session (it never creates one), and `replyToId` / `attachmentIds` must belong to that same session (`400`). Admin viewing and replying never write the session's `tenantId`, `market`, `sourceSite`, `sourceOrigin` or `sourceChannel`; a `pw-infotech` conversation stays `pw-infotech`.

**Request-origin protection for admin writes.** `primewayz.com` and `uk.primewayz.com` are same-site, so the `SameSite=Lax` admin cookie can accompany requests started on a primewayz.com page. Every `POST` / `PUT` / `PATCH` / `DELETE` under `/api/admin/*`, plus `POST /api/chat`, must therefore originate from the Primewayz UK admin application, otherwise `403` (`admin_origin_rejected`):

1. If `Origin` is present it must be a trusted admin origin: the `pw-uk` registry origin (`https://uk.primewayz.com`) or the origin of `SITE_URL`; in non-production also `http(s)://localhost:<port>` / `127.0.0.1:<port>`. `Origin: null` and every other Primewayz property are rejected.
2. Without `Origin`, `Sec-Fetch-Site` must be `same-origin` or `none` when present.
3. Without either, a present `Referer` must be a trusted admin origin.
4. With none of these headers the request is not browser-initiated cross-site traffic (curl, server scripts); it is allowed through to normal admin authentication.

The Admin UI calls same-origin relative URLs, and current browsers always send `Origin` on same-origin `POST` / `PATCH` / `DELETE`, so legitimate admin writes take path 1. `Host` and `X-Forwarded-Host` are never used to derive the expected origin. `GET` admin reads are unaffected (they are not exposed through CORS). Visitor `/api/chat/*` routes are governed only by public Chat CORS.

### J.9 WordPress visitor widget (public path)

```text
Primewayz.com WordPress (visitor browser)
    -> https://uk.primewayz.com/api/chat/*   (the shared Primewayz UK API, sections J.1 to J.7)
    -> Primewayz UK Node backend
    -> existing shared remote database
```

No separate Primewayz Infotech backend, API deployment or database is involved; the WordPress site is only another frontend.

- The browser calls the API directly with `fetch(..., { credentials: 'omit' })`.
- No API secret is embedded in the browser or the WordPress page.
- The server derives `pw-infotech` from the `Origin` header; the widget never sends tenant fields.
- New sessions use UUID v4 ids stored in the visitor's browser.

The WordPress Admin dashboard uses a different, server-to-server path (section K).

## K. WordPress operational chat integration (server-to-server)

### K.1 Three separate paths

| Path | Caller | Authority | Capabilities |
|---|---|---|---|
| Public visitor integration | Visitor browser on primewayz.com loading `pw-chat.js` | `Origin` resolves `pw-infotech` (J.2); no secrets | Visitor chat via `/api/platform/capabilities` and `/api/chat/*` |
| WordPress operational integration | Primewayz Integration plugin PHP (wp-admin), server-to-server | Bearer integration credential bound to `pw-infotech` | Read-only: dashboard, conversation, diagnostics |
| Full Primewayz UK Admin | Primewayz staff in `https://uk.primewayz.com/admin` | Admin cookie plus operations role (J.8) | Full management: replies, notes, status, presence, all tenants |

```text
wp-admin browser
    -> Primewayz Integration PHP (holds the credential)
    -> HTTPS POST https://uk.primewayz.com/api/integrations/wordpress/chat
    -> existing UK chat services
    -> shared database
```

The wp-admin browser never calls the UK API for this path and never receives the credential. There is one plugin, one endpoint, one backend and one database. The plugin must not reuse the `primewayz_admin_token` cookie or Admin login credentials.

### K.2 Endpoint and authentication

```http
POST /api/integrations/wordpress/chat
Authorization: Bearer <WORDPRESS_CHAT_INTEGRATION_TOKEN>
Content-Type: application/json
X-Request-ID: <optional, 8 to 128 chars of A-Z a-z 0-9 . _ : ->
```

- The credential is read only from the `Authorization` header. Any query string is rejected (`400`), so the credential can never be sent in a URL.
- Server-side registry (`src/lib/integrations/integrationRegistry.ts`): credential maps to integration `primewayz-wordpress`, tenant `pw-infotech`, scopes `chat:dashboard`, `chat:read`, `chat:diagnostics`. There are no write scopes.
- Comparison is constant time (SHA-256 digests with `timingSafeEqual`). Secrets shorter than 32 characters, or unset, disable the integration; every call then returns `401` (fail closed).
- The credential never appears in responses or logs, and it does not impersonate any Admin user.
- No CORS headers are emitted. The endpoint is not intended for browsers; CORS is not the security boundary.
- Other HTTP methods return `405` with `Allow: POST`.

### K.3 Request contract

```json
{ "action": "dashboard" }
{ "action": "conversation", "sessionId": "<string, 1 to 191 chars>" }
{ "action": "diagnostics" }
```

- Unknown actions, write-style actions (`reply`, `assign`, `delete`, ...) and any extra field return `400 invalid_request`.
- `tenantId`, `tenant`, `tenantKey`, `market`, `sourceSite`, `sourceOrigin` and `sourceChannel` return `400 tenant_override_rejected`. The tenant comes only from the credential binding.

### K.4 Response envelope

Every response carries `Cache-Control: no-store`, `Pragma: no-cache` and `X-Request-ID`. The same request id is in the body and in the server log. Timestamps are UTC ISO 8601 (`2026-10-04T08:15:00.000Z`); WordPress converts for display.

```json
{
  "ok": true,
  "apiVersion": "1",
  "requestId": "...",
  "tenant": { "key": "pw-infotech", "market": "IN", "displayName": "Primewayz Infotech" },
  "generatedAt": "2026-10-04T09:00:00.000Z",
  "data": {}
}
```

```json
{
  "ok": false,
  "apiVersion": "1",
  "requestId": "...",
  "error": { "code": "integration_unauthorized", "message": "Missing or invalid integration credential." }
}
```

### K.5 Error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `invalid_request` | Malformed JSON, unknown action, unsupported field, bad `sessionId`, query string present |
| 400 | `tenant_override_rejected` | Body tried to supply tenant / source fields |
| 401 | `integration_unauthorized` | Missing, malformed or unknown credential (`WWW-Authenticate: Bearer`) |
| 403 | `integration_forbidden` | Valid credential without the scope for this action |
| 404 | `conversation_not_found` | Unknown session, or a session owned by another tenant or legacy (indistinguishable) |
| 405 | `method_not_allowed` | Not POST |
| 413 | `invalid_request` | Body too large |
| 429 | `rate_limited` | Limit exceeded; honour `Retry-After` (seconds) |
| 503 | `tenant_unavailable` | Bound tenant inactive |
| 503 | `database_unavailable` | Database unreachable |
| 503 | `chat_service_unavailable` | Other data-layer failure |
| 500 | `internal_error` | Unexpected failure (no stack traces or internals) |

An empty tenant returns `200` with `recentConversations: []` and `attention.count: 0`. A failure never looks like "zero conversations".

### K.6 `dashboard`

```json
{
  "service": { "status": "healthy", "chatEnabled": true, "canAcceptMessages": true },
  "team": {
    "presenceScope": "platform",
    "status": "available",
    "mode": "auto",
    "teamMemberRecentlyActive": true,
    "canAcceptMessages": true
  },
  "attention": { "count": 2 },
  "recentConversations": [
    {
      "sessionId": "...",
      "visitorLabel": "Gaurav",
      "intent": "website-development",
      "originatingPage": "/services/web",
      "lastMessagePreview": "Need a new website",
      "lastActor": "assistant",
      "lastActivityAt": "2026-10-04T08:00:00.000Z",
      "status": "waiting_for_team",
      "needsAttention": true,
      "messageCount": 2
    }
  ],
  "limits": { "recentConversations": 20, "transcriptMessages": 100 },
  "fullAdmin": {
    "url": "https://uk.primewayz.com/admin",
    "mobileUrl": "https://uk.primewayz.com/admin/chat",
    "tenantPreselected": false
  }
}
```

- `recentConversations`: the 20 `pw-infotech` conversations with the most recent visible (non-internal) message, newest first. Sessions with no messages (heartbeat only) are not conversations and are not listed. No transcripts.
- `service.status`: `healthy` when the database answered, the tenant is active, the chat capability is enabled and chat can accept messages; `degraded` when the tenant's chat capability is disabled or presence mode is `offline`. If the database fails the action returns `503` instead (unavailable).
- `fullAdmin`: the Admin UI does not support deep links to the Chats tab or a preselected entity (the entity selector defaults to Primewayz UK and only `?tab=autopilot|conversion` is read). `tenantPreselected: false` tells WordPress to instruct staff to choose "Primewayz Infotech" in the Admin selector.

**Presence is platform-wide.** `ChatPresenceSetting` and `AdminPresence` have no tenant column, so `team` describes Primewayz team availability across all entities, flagged `presenceScope: "platform"`. Label it "Primewayz team availability", not "Primewayz Infotech admin online". `team.status`: `available` (an Admin heartbeat in the last 5 minutes in auto mode, or mode forced online), `not_online` (auto mode, no recent heartbeat), `away`, `offline` (modes set in UK Admin).

**Actors.** `user` maps to `visitor`, `bot` maps to `assistant`, `admin` maps to `team`. The assistant reply is a canned acknowledgement, not LLM output; nothing is labelled AI. Messages with any other sender are omitted.

**Needs attention** (`src/lib/chat/chatOperationalSemantics.ts`, one rule for both `attention.count` and each row): the session status is not `closed` or `spam`, and the session has at least one visitor message with `answered = false`, `isInternalNote = false` and `deletedAt = null`. Visitor messages are only marked answered when a team member posts a non-internal reply in UK Admin, so the canned assistant acknowledgement and internal notes do not clear attention. `attention.count` covers every `pw-infotech` conversation, not only the 20 listed.

**Status** (one operational enum):

| `status` | Rule |
|---|---|
| `waiting_for_team` | `needsAttention` is true |
| `closed` | Stored status `closed` or `spam` |
| `team_replied` | Latest visible message is from the team |
| `assistant_replied` | Latest visible message is the assistant and nothing is waiting |
| `open` | Anything else (for example no messages yet) |

### K.7 `conversation`

```json
{
  "conversation": {
    "sessionId": "...",
    "visitorLabel": "Visitor • 3FA9C2",
    "intent": null,
    "originatingPage": "/contact",
    "lastMessagePreview": "...",
    "lastActor": "team",
    "lastActivityAt": "2026-10-04T08:15:00.000Z",
    "status": "team_replied",
    "needsAttention": false
  },
  "messages": [
    { "id": 123, "actor": "visitor", "text": "...", "createdAt": "...", "edited": false, "deleted": false, "replyToId": null }
  ],
  "hasMore": false,
  "messageLimit": 100
}
```

- Only sessions owned by `pw-infotech` are returned; anything else is `404 conversation_not_found`.
- Latest 100 visible messages, oldest first; `hasMore: true` when older messages exist. Full history stays in UK Admin.
- Internal notes are never returned. A reply that quotes an internal note has `replyToId: null`.
- Deleted messages return `text: "Message deleted"`, `deleted: true`. `edited` is true for edited, non-deleted messages.
- Attachments are omitted in Phase 1 (no file paths or URLs).
- `text` is the stored plain text. WordPress must escape it on output (`esc_html`).

### K.8 `diagnostics`

```json
{
  "status": "healthy",
  "api": { "status": "ok", "version": "1" },
  "authentication": { "valid": true, "integrationId": "primewayz-wordpress", "scopes": ["chat:dashboard", "chat:read", "chat:diagnostics"] },
  "tenantBinding": { "tenantId": "pw-infotech", "valid": true, "active": true },
  "chat": { "enabled": true, "canAcceptMessages": true },
  "team": { "presenceScope": "platform", "status": "available", "mode": "auto", "teamMemberRecentlyActive": true, "canAcceptMessages": true },
  "database": { "status": "reachable" },
  "fullAdmin": { "url": "https://uk.primewayz.com/admin", "mobileUrl": "https://uk.primewayz.com/admin/chat", "tenantPreselected": false }
}
```

Diagnostics returns `200` once the credential is valid, even if the database is down; then `status: "unavailable"`, `database.status: "unreachable"` and `team: null`. An invalid credential is always `401`. No hostnames, connection strings, environment variables, file paths or stack traces are returned.

### K.9 PII rules

Never returned by any action: visitor email, phone, IP address, user agent / browser, device, referrer, UTM values, query strings of landing pages, internal notes, internal database ids other than message ids, tenant attribution fields, attachment paths.

- `visitorLabel`: the visitor's name, unless empty or containing `@`; otherwise `Visitor • ` plus a 6-character hash of the session id (not reversible).
- `originatingPage`: path only (first landing page, else current page).
- `lastMessagePreview`: plain text, single line, at most 200 characters, `Message deleted` for deleted messages.
- `sessionId` is returned so WordPress can request the transcript; WordPress should not display it in full.

### K.10 Rate limits

In-memory per process, keyed by integration id (not by client IP, because the WordPress server IP is shared):

| Bucket | Limit |
|---|---|
| All authenticated calls of the integration | 240 per minute |
| `dashboard` | 60 per minute |
| `conversation` | 120 per minute |
| `diagnostics` | 30 per minute |
| Invalid credentials, per client IP | 30 per minute |

A valid credential is never blocked by the invalid-credential bucket. Exceeding a limit returns `429 rate_limited` with `Retry-After`. Suggested WordPress polling: dashboard no more often than every 15 to 30 seconds while the page is visible.

### K.11 Audit logging

One line per request: `[wp-chat-integration] {"requestId","integrationId","tenantId","action","status","code","durationMs","sessionRef"}`. `sessionRef` is the 6-character session hash for `conversation`. Tokens, message text, names, email and phone are never logged.

### K.12 Credential configuration and rotation

The credential lives in the UK backend environment (`WORDPRESS_CHAT_INTEGRATION_TOKEN`) and in WordPress server-side configuration only (for example a `wp-config.php` constant or an option never printed to the page). It must never be rendered into HTML, localized scripts or REST responses in WordPress.

Rotation:

1. Generate a new secret (at least 32 characters), for example `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
2. On the UK backend, move the current value to `WORDPRESS_CHAT_INTEGRATION_TOKEN_PREVIOUS` and set the new value as `WORDPRESS_CHAT_INTEGRATION_TOKEN`. Both are accepted during the overlap.
3. Restart the UK Node process.
4. Update the WordPress server-side configuration to the new secret.
5. Call `diagnostics` from WordPress and confirm `authentication.valid: true`.
6. Remove `WORDPRESS_CHAT_INTEGRATION_TOKEN_PREVIOUS` and restart again. The old secret now returns `401`.

For an emergency revocation, clear both variables and restart; every call returns `401` until a new secret is configured.

### K.13 Query strategy

`dashboard` runs a fixed set of queries regardless of volume: one `GROUP BY sessionId` over visible messages for the tenant (latest activity, limited to 20), one tenant-wide attention `COUNT`, then batched lookups for the selected sessions only (session details, latest message per session, unanswered-visitor counts, visible message counts), plus two `findFirst` presence reads. `conversation` runs an ownership lookup, a tenant-scoped session read, one bounded message read (101 rows) and one unanswered count. No action writes to the database.

## Follow-up (not required for this foundation)

**SEO page collector ↔ SchedulingAppointment:** optional analytics/enrichment enhancement only.
`collectSeoPageUrlCandidates` does not currently read `SchedulingAppointment`. Wiring booked-call URLs
into SEO page identity for tenant-scoped conversion enrichment is deferred — it is not required for
correct tenant isolation of Scheduling or Chat.

Future clients must not require `if (client === "digiblend")` branches in Chat/Scheduling core logic.
