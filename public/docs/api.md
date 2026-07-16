# Primewayz UK Public API Notes

Primewayz UK exposes limited public read-only endpoints for public content and shared audit report discovery.

## Public endpoints

- `GET /api/blog/posts`
  - Returns public blog posts and insights.

- `GET /api/blog/posts/:id`
  - Returns a public blog post by id or slug.

- `GET /api/tools/web-presence-audit/report/:publicToken`
  - Returns a public shared web presence audit report when a valid public token is provided.

## Authentication

These public endpoints do not require OAuth.

Admin, CMS, chat management, and operational endpoints are private and are not part of this public API catalog.

## Usage guidance for agents

Agents may use these public endpoints to help users discover Primewayz UK public insights, services, and shared audit reports.

Agents should not submit forms, create leads, or make business commitments without explicit user confirmation.
