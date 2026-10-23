# Chat widget analytics integration (GA4 / GTM)

Tenant-aware, privacy-conscious analytics for the hosted Primewayz Chat embed (`pw-chat.js`). The widget never loads Google tags itself. It only emits events through the **host website’s** already-approved analytics setup.

## Events

| Event | When | Conversion? |
| ----- | ---- | ----------- |
| `chat_open` | Visitor intentionally opens the widget (not on script load). Once per browser tab session. | No |
| `chat_message_sent` | Visitor message accepted by `POST /api/chat/respond`. Not typing, failures, bot, or admin messages. | No |
| `chat_lead_captured` | Server reports `leadCaptured: true` on `POST /api/chat/session` after a newly persisted contactable email. | Yes |

Payloads are non-PII only (`placement`, optional `route`, `page_type`, `availability_state`, `intent_key`, `failure_reason`). Never name, email, phone, message text, session ids, or tenant ids.

## Host transports (pick one path)

The embed uses the **first** available transport and never both `gtag` and `dataLayer` for the same event:

1. `window.PWSCTrackEvent(eventName, params)` — Site Controls / custom bridge
2. `window.gtag('event', eventName, params)` — direct `gtag.js` or GTM’s `gtag`
3. `window.dataLayer.push({ event: eventName, ...params })` — GTM-only hosts without `gtag`

**Direct gtag.js:** no extra configuration. Ensure the host measurement ID is already configured for these event names if you mark conversions in GA4.

**GTM:** either listen to the custom event names via a Custom Event trigger on `dataLayer`, **or** use a GA4 Configuration tag that exposes `gtag` and map the same event names. Do not fire the same chat event from both a raw `dataLayer` Custom Event tag and a duplicate gtag Event tag.

## Consent

| Signal | Behaviour |
| ------ | --------- |
| Embed config `analyticsEnabled: false` | Never emit |
| `window.__PRIMEWAYZ_ANALYTICS_CONSENT__ === false` | Never emit (UK consent banner / explicit deny) |
| `window.__PRIMEWAYZ_ANALYTICS_CONSENT__ === true` | Emit when a transport exists |
| Flag unset | **Host-owned:** emit only if `PWSCTrackEvent`, `gtag`, or `dataLayer` is already present |

WordPress and other tenant sites that load GA only after their own consent banner do not need the Primewayz UK flag. Sites that must force-off analytics can set the flag to `false` or set `analyticsEnabled: false` in `#pwi-chat-config`.

## Lead capture authority

`chat_lead_captured` is driven by the server flag `leadCaptured` on the public session response. That flag is true only when this request newly persists a non-empty email for a session that previously had none. Returning visitors and repeated saves do not re-convert.

## Versioning

Ship analytics fixes as a new immutable embed semver under `/embed/chat/<version>/pw-chat.js`. Do not rewrite previously published version folders. WordPress Chat Connect should vendor the matching `assets/chat/pw-chat.js` and `BUILD_INFO.json`.

Current analytics-capable embed: **1.3.3** (retains the 1.3.1 GA4/GTM event contract).
