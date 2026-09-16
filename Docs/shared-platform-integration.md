# Shared multi-tenant service platform — client integration contract

This document is the implementation contract for frontends that call the shared Primewayz platform APIs from:

- `https://uk.primewayz.com` (Primewayz UK / `pw-uk`)
- `https://primewayz.com` and `https://www.primewayz.com` (Primewayz Infotech / `pw-infotech`)
- `https://rentreadbuy.com` and `https://www.rentreadbuy.com` (RentReadBuy / `rrb`)
- future client tenants (for example Digiblend, SRH) once registered with real production domains

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
- `POST /api/chat`
- `POST /api/chat/respond`
- `POST /api/chat/uploads` (may return `501` until configured)
- `POST /api/chat/appointments` (requires `scheduling` + enabled booking config)

Require capability `chat`. Cross-tenant session reuse returns `403`.

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
| `400` | Validation / forbidden body identity fields |
| `403` | Unknown origin, cross-tenant ownership, or capability disabled |
| `404` | Missing resource |
| `409` | Reserved for future conflict cases |
| `429` | Rate limited (audit / forms) |
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

## Follow-up (not required for this foundation)

**SEO page collector ↔ SchedulingAppointment:** optional analytics/enrichment enhancement only.
`collectSeoPageUrlCandidates` does not currently read `SchedulingAppointment`. Wiring booked-call URLs
into SEO page identity for tenant-scoped conversion enrichment is deferred — it is not required for
correct tenant isolation of Scheduling or Chat.

Future clients must not require `if (client === "digiblend")` branches in Chat/Scheduling core logic.
