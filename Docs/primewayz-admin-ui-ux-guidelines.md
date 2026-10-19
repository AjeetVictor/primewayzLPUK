# Primewayz admin UI and UX guidelines

These guidelines apply to the administration interface, with the Chat Connect release as the first enforced surface: Tenant Management, Chat Connect installations, the tab list that reaches them, and the confirmation dialog those screens use.

The admin application stays on its current stack: React, Tailwind, Radix Tabs, and Radix Dialog through `AppConfirmDialog`. Do not add a second component library for these screens. New governance UI uses the small helpers in `src/components/admin/adminUx.tsx` and the existing `ChatConfirmDialog`.

Target: WCAG 2.2 AA for the release surfaces. Meeting that target in code review is not a conformance claim. Conformance needs an authenticated pass with a screen reader and keyboard at the widths below.

The public marketing pages use their own art direction. Inside the admin dashboard, keep the established zinc dashboard and do not restyle unrelated modules to match a new release.

## Navigation hierarchy

1. **Admin Dashboard** is the page title (`h1`). It names the signed-in workspace, not an individual module.
2. **Administration sections** is the Radix tab list. Chat Leads, Chat History, Tenant Management, and Chat Connect are one **Chat Platform** tab. Inside that workspace, a second navigation lists Overview, Inbox & Leads, History, Team & Presence, Tenants, Sites & Domains, Integrations, Users & Permissions, Audit & Activity, and Settings. Blog, forms, Autopilot, and platform user management stay as their own tabs.
3. Each section has one `h2`. Descriptions sit in that header, in normal sentence case.
4. A record title inside a section is an `h3`. Do not skip from `h2` to an unlabeled table.
5. The dashboard tenant menu filters operational modules that already take `tenantId`. Tenant Management and Chat Connect load the tenants the signed-in operator is allowed to see from their own APIs. Do not silently reuse the dashboard tenant menu to narrow those APIs.
6. The dashboard search box filters forms, leads, and chat records. Hide it on Tenant Management and Chat Connect. Those sections own their own search fields so a query cannot look like it filtered governance records when it did not.

The tab list wraps inside the dashboard width. `w-fit` on a wrapping flex list lets the row grow past a 320px viewport, so the list must be allowed to use the content width and wrap. The active tab uses a white surface, emerald-800 text, and a shadow. Inactive tabs use zinc-600. Every tab shows a visible focus outline.

A sidebar, or a shorter set of grouped menus, is a future information-architecture change. It is not required for this release because every section remains in the tab order.

## Responsive breakpoints and behavior

Use the Tailwind breakpoints already in the app.

| Width | Behavior on governance sections |
| ----- | -------------------------------- |
| Under 1280px (`xl`) | One column. Records are stacked cards with the title first and actions last. Filters stack. |
| 1280px and above | Records are a table with a caption. The table scrolls horizontally if a row is wider than the pane. |
| 320, 375, 768, 1024 | Card layout. No seven-column table. |
| 1440 | Table layout inside the 1200px dashboard column. |

Touch and pointer targets on these sections are at least 44px tall. Page padding stays `px-4` from the dashboard shell. Do not invent a separate mobile admin application.

## Typography scale

The admin inherits the application face, Inter, from `src/index.css`. Do not add a second typeface for these sections.

| Role | Treatment |
| ---- | --------- |
| Page title | `text-3xl` bold, zinc-900 |
| Section title | `text-xl` bold, zinc-900 |
| Record title | `text-base` semibold, zinc-900 |
| Body and help | `text-sm` leading-6, zinc-700 |
| Meta and table headers | `text-xs` semibold, zinc-600, sentence case |

Do not use 10px uppercase tracking for new table headers. zinc-400 on zinc-50 is about 2.6:1 and fails text contrast. Existing modules still use that header style; leave them until those modules are in scope.

## Spacing system

Use the dashboard spacing already on the page: 4px steps from Tailwind (`gap-2`, `gap-3`, `gap-4`, `p-4`, `space-y-6`). Section blocks are separated by `space-y-6`. Related fields inside a form use `gap-4`. Do not mix a new spacing scale.

## Accessible colors and contrast

Release surfaces use this set. Text pairs are chosen for at least 4.5:1. Control boundaries that are the only edge of a field use zinc-500 or darker so the boundary stays at least 3:1 on white.

| Name | Hex | Use |
| ---- | --- | --- |
| Page | `#fafafa` zinc-50 | Dashboard background |
| Surface | `#ffffff` | Cards, dialogs, inputs |
| Ink | `#18181b` zinc-900 | Titles and primary buttons |
| Body | `#3f3f46` zinc-700 | Descriptions, help, meta |
| Boundary | `#71717a` zinc-500 | Input and card borders on these sections |
| Active | `#065f46` emerald-800 | Active tab text, positive status text |
| Warning ink | `#451a03` amber-950 | Suspended, stale |
| Danger ink | `#7f1d1d` red-900 | Revoked, errors |
| Warning surface | `#fffbeb` amber-50 | One-time credential panel |

Status color is extra. The status word is always visible. Do not convey authorization, connection, visibility, or entitlement by color alone.

Positive status text is emerald-900 on emerald-50. Warning status text is amber-950 on amber-50. Danger status text is red-900 on red-50. Neutral status text is zinc-800 on zinc-100.

## Buttons and interaction states

Primary actions (`Register installation`, `Save entitlement`) are zinc-900 with white text. Secondary actions are white with a zinc-500 border and zinc-800 text. Destructive actions (`Revoke`) are white with red-800 text and a red-200 border.

Every button has hover, focus-visible, pressed (`active:`), and disabled treatments. Primary hover is zinc-700, secondary hover is zinc-100, danger hover is red-50. Focus is a 2px zinc-900 outline, 2px outside the control. Disabled actions use reduced opacity and `disabled`, and they do not submit. Inactive admin tabs use the same hover, pressed, and focus treatments. The active tab stays white with emerald-800 text.

Dangerous work uses a button, then `ChatConfirmDialog`. Do not call `window.confirm`, `window.alert`, or `window.prompt`.

## Form standards

- Every control has a visible `<label for>` and a matching `id`.
- Help text is in a separate element referenced by `aria-describedby`.
- Required fields say they are required in the help text and set `required` or `aria-required`.
- Invalid fields set `aria-invalid` and move focus to the first invalid control. The error is in the same `aria-describedby` list.
- Server errors use `role="alert"` above the form, in addition to any field error.
- Place the submit button at the end of the form, after the fields it applies to.
- Do not put a one-time secret inside the registration form.

## Table and data-grid standards

These records are tables, not ARIA grids. Operators move with Tab, not with a custom grid keymap.

- Use `<th scope="col">` and a `<caption>`.
- Below 1280px, do not keep the table in the accessibility tree. Render the same records as cards. `hidden` / `xl:block` is enough because `display: none` removes the duplicate from tab order.
- Put actions in the last column, and at the bottom of a card, in the same order: suspend or reactivate, then revoke, then rotate credentials.
- Say how many records are visible, in a polite live region, including when a filter matches nothing.
- Search and filters apply only to records already returned for that operator. They must not request another tenant's data.

## Status presentation

Use `AdminStatus`. The visible label is the accessible name.

| State | Label | Tone |
| ----- | ----- | ---- |
| Entitled, active, connected, visible, open | Those words | Positive |
| Suspended, stale | Those words | Warning |
| Revoked, disconnected, closed | Those words | Danger |
| Registered, unknown, not set, no central record | Those words | Neutral |

Connection health keeps its server meaning. Unknown means no verified heartbeat. Do not relabel it as connected because the API responded.

## Loading, empty, and error states

- The first load announces `role="status"` and does not show the empty state while the request is in flight.
- An empty authorized set says that no records are visible for this account.
- A filter with no matches says that nothing matches the current search. It offers a way to clear the filters.
- A failed load or failed action uses `role="alert"` with the server message when one is provided, otherwise a plain failure sentence, plus **Try again** for a failed load.
- A refresh after a successful action keeps the current list on screen. Do not replace it with the initial loading sentence.

## Dialog and confirmation behavior

`AppConfirmDialog` is the only confirmation surface. Radix Dialog supplies the modal, the focus trap, Escape, and return of focus to the control that opened it.

- The first focused control is **Cancel**, including for suspend, revoke, rotate, and entitlement changes.
- Escape and the backdrop call cancel. They do nothing while the confirm action is running.
- The confirm button uses `aria-disabled` while the request runs and ignores a second activation. The label changes to “Please wait…”.
- Suspend, revoke, reactivate, and credential rotation each need an explicit confirm. The dialog names the installation and states that tenant chat entitlement is unchanged.
- An entitlement change names the tenant, the new status, and the reason that will be stored. Entitled uses the default button. Suspended uses warning. Revoked uses danger.
- The dialog does not change who is allowed to call the API. Host/Owner remains a server decision. The screen hides the form when `canManage` is false.

## Focus management

- Focus outlines stay visible. Do not use `outline-none` on these controls unless a `focus-visible` outline replaces it.
- When a one-time credential appears, move focus to that region.
- When the operator confirms they have stored it, clear it from component state and return focus to the section title.
- When a form is invalid, move focus to the first invalid field.
- The section title can take programmatic focus (`tabIndex={-1}`) without being in the normal tab order.

## Keyboard interaction

- Tabs keep the Radix keyboard model: Tab enters the list, arrows move between sections, Enter or Space activates.
- Dialogs keep Radix keyboard behavior: Tab cycles inside the dialog, Escape cancels when the request is not running.
- Record actions are buttons in source order. Do not add arrow-key roving for a record list.
- Search fields are `type="search"` and can be cleared from the keyboard.

## Mobile usability

- Stack filters, form fields, dialog buttons, and record actions.
- Do not rely on horizontal scrolling to reach Tenant Management or Chat Connect.
- Do not put the only copy of a credential in a single line that cannot wrap. The credential field wraps and can be selected.
- Icon-only controls need a text name. The mobile inbox send and sign-out controls are named.

## Component reuse conventions

| Need | Use |
| ---- | --- |
| Section title and description | `AdminPageIntro` |
| Loading sentence | `AdminLoading` |
| Empty result | `AdminEmpty` |
| Failed request | `AdminError` |
| Status word | `AdminStatus` |
| Labeled field | `AdminField` |
| Control, primary, secondary, danger classes | exports from `adminUx.tsx` |
| Confirm suspend, revoke, rotate, entitlement | `ChatConfirmDialog` |
| Modal behavior | `AppConfirmDialog` backed by Radix Dialog |

Do not duplicate these patterns inside a third governance screen. Do not restyle Autopilot, blog, forms, or user management as part of a Chat Connect change.

## One-time credentials

- Show the credential once, in a readonly field labeled “Installation credential”.
- Tell the operator, in a live region, that a credential is ready. Do not put the secret in that live region.
- Offer **Copy credential**. If the clipboard is refused, leave the field selected and say to copy it manually.
- **I have stored this credential** removes it from component state. It is not written to `localStorage` or `sessionStorage`.
- `autoComplete="off"` and no `name` attribute, so the browser is not asked to store it as a login secret.
- Registration, suspension, and revocation still do not print the secret into an error message.

## Release notes for this pass

Fixed before release: native confirm dialogs, suspend without confirmation, loading treated as empty, governance tables at phone width, unlabeled fields, color-only or low-contrast status text, credential panel without a name or focused disclosure, tab list that could overflow a narrow viewport, and reply failures that were not alerts.

Left for a later admin pass: uppercase zinc-400 headers and faint focus rings in modules outside this release, a grouped navigation if the tab list becomes too long, dashboard search that still filters only some sections, and a full screen-reader pass on chat history. Those are not blockers for the installation registry and entitlement release.
