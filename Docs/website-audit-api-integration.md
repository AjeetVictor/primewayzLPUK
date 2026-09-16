# Primewayz UK website audit API

Primewayz UK owns and executes the audit. Primewayz Infotech (`primewayz.com`) may provide the user interface and call this API from the browser.

## Endpoint

`POST https://uk.primewayz.com/api/v1/website-audits`

```json
{
  "websiteUrl": "https://example.co.uk",
  "businessName": "Example Ltd",
  "businessType": "Professional services",
  "targetCountry": "United Kingdom",
  "location": "London",
  "phone": "+44 20 0000 0000",
  "email": "hello@example.co.uk"
}
```

The first four properties are required. `location`, `phone`, and `email` are optional. The response contains `apiVersion`, `provider`, and the complete `report` object.

## Browser integration

```ts
const response = await fetch('https://uk.primewayz.com/api/v1/website-audits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form),
});

const payload = await response.json();
if (!response.ok) throw new Error(payload.error || 'Audit failed');
renderAuditReport(payload.report);
```

Production allows `https://primewayz.com` and `https://www.primewayz.com` by default. Override this with the comma-separated `AUDIT_API_ALLOWED_ORIGINS` environment variable when a preview domain is required.

`AUDIT_API_TOKEN` is optional and intended only for a trusted server-to-server proxy. Do not place it in browser JavaScript. Browser calls are protected by the exact origin allowlist and endpoint rate limit.

## Behaviour and safety

- 10 audit requests per client IP per 15 minutes; excess requests receive `429` and `Retry-After`.
- Private/internal IPs, local hostnames, unsupported protocols, unsafe redirects, oversized responses, and slow fetches remain blocked by the shared Primewayz UK audit engine.
- Search rankings, Google Business Profile, competitor data, keyword demand, and conversion accuracy are marked as external verification required and are not fabricated.
- `400` means invalid input, `401` invalid optional API credentials, `403` disallowed browser origin, and `500` an unexpected audit failure.
