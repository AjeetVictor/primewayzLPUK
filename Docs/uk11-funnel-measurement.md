# UK-11 funnel measurement

## Consent

Optional GA4 measurement is off until a visitor opts in. The site does not load the Google tag,
send measurement events, or push optional events to the data layer before consent. Visitors can
accept, reject, manage, or withdraw that choice through the persistent Cookie settings control.
Enquiry forms and the booking calendar remain available without analytics consent.

First-party enquiry attribution retains the original landing route and bounded first/latest UTM
values in session storage so a visitor can complete an enquiry without enabling optional analytics.
UTM values are limited to 160 characters, controls are removed, and obvious email addresses are
dropped. These values are sent with a submitted enquiry as operational campaign context; they are
not sent to GA4 unless consent is active.

## Conversion definitions

- `generate_lead` means one newly confirmed lead submission (contact, capacity request, review,
  saved audit lead, or a deduplicated completed Calendly booking). Contact and capacity retries
  with an existing submission key do not emit another `generate_lead`.
- Existing diagnostic events, such as form-start, form-submit, and Calendly lifecycle events,
  remain distinct from the canonical confirmed-lead event.
- `qualified_lead` and later lifecycle outcomes are operational/reporting classifications and are
  not implied by `generate_lead`. A confirmed enquiry is not necessarily qualified or a sale.

GA4 reports use aggregate page/source/channel metrics and may be incomplete for visitors who
decline analytics. Server-side SEO conversion aggregates use persisted operational records and
first-/last-touch attribution, but do not equal GA4 totals. Calendly completion reporting uses
`calendly_event_scheduled`; UK webhook ownership continues to avoid double-counting the same
booking in the existing scheduling flow.
