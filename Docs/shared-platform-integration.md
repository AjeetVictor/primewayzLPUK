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

### J.9 Future WordPress integration (later phase)

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
- The WordPress plugin itself is a later phase and is not part of this API hardening.

## Follow-up (not required for this foundation)

**SEO page collector ↔ SchedulingAppointment:** optional analytics/enrichment enhancement only.
`collectSeoPageUrlCandidates` does not currently read `SchedulingAppointment`. Wiring booked-call URLs
into SEO page identity for tenant-scoped conversion enrichment is deferred — it is not required for
correct tenant isolation of Scheduling or Chat.

Future clients must not require `if (client === "digiblend")` branches in Chat/Scheduling core logic.
