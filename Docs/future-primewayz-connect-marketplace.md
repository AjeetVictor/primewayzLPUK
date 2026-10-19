# Future Primewayz Connect Marketplace — Design Considerations

This note records how a later marketplace can sit on the Chat Connect installation registry. It does not add a catalogue, billing, licensing, downloads, or a marketplace UI.

The commercial tenant registry is the customer and site boundary a marketplace would attach to. Installation authorization, verified origins, and tenant lifecycle stay the gates. Marketplace billing is a separate grant and is not implied by an active installation or an entitled chat tenant.

## Three separate concepts

**Tenant.** A tenant is a brand and data boundary already registered in `PLATFORM_TENANTS` (for example `pw-uk`, `pw-infotech`, `rrb-silver-campaign`). The installation registry stores that tenant key. It does not create another tenant table, and an installation cannot invent or rename a tenant. Tenant activation stays on the registry and its environment gate. Central chat entitlement is a separate Host/Owner record (`TenantChatEntitlement`). It is not installation authorization, and it is not connector health.

**Add-on product definition.** A product definition would describe something Primewayz offers: a name, a technology family, and the lifecycle contract that every installation of that product follows. WordPress, React, and Shopify connectors could later share one product definition and the same registration, activation, heartbeat, suspension, and revocation rules. This phase stores only the technology string on each installation (`wordpress`). It does not store a product catalogue.

**Add-on installation.** An installation is one deployment of a connector, or one first-party chat surface, for one tenant. A tenant may have several installations. Each installation has its own identifier, credential, authorization status, frontend visibility, and connection health. The seeded `cci_pw_infotech_wordpress` row is the existing Primewayz Infotech WordPress binding. The seeded `cci_pw_uk_first_party` row is the existing Primewayz UK React LiveChat surface. Neither row is a second tenant. RentReadBuy is not seeded.

## What can be shared later

Technology-specific connectors (WordPress today; React, Shopify, or others later) can share:

- the installation record and its authorization states
- one-time credential issuance, rotation, and revocation
- activation that is separate from tenant activation
- the five-minute heartbeat and the derived connection states
- Host/Owner administration and tenant-scoped read access

Each connector keeps its own server-side transport. The WordPress operational chat API remains the existing bearer integration and does not become a marketplace download.

## Explicitly out of scope

Marketplace UI, add-on catalogue management, billing, subscriptions, licensing, self-service downloads, and marketplace publishing or discovery are not part of this registry.
