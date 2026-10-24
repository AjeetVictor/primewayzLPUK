# PW-CHAT-RECOVERY-01 — Primewayz Chat Connect recovery

## Root cause (evidence)

### 1. Broken official `1.3.3` ZIP used Windows backslash entry paths

`releases/primewayz-chat-connect-1.3.3.zip` produced on Windows via `Compress-Archive` stored entries as:

`primewayz-integration\primewayz-integration.php` (byte `0x5C`)

Working `1.3.2` and this recovery package use:

`primewayz-integration/primewayz-integration.php` (byte `0x2F`)

On Linux WordPress hosts, backslash entries do not expand to the canonical `wp-content/plugins/primewayz-integration/` tree. Assets such as `assets/chat/pw-chat.js` are missing from the expected paths, so `PWI_Chat_Loader::enqueue()` returns early when `is_readable()` fails — **the visitor launcher never loads**.

This is the same class of defect previously fixed in `0bb5682` (“normalize Chat Connect 1.3.0 ZIP paths”).

### 2. Manual `v1.3.3` ZIP shipped a hand-patched widget

`releases/primewayz-chat-connect-v1.3.3.zip` (pre-recovery) contained:

- `BUILD_INFO.json` with `"artifactNote": "Standalone WordPress bundle patched from original 1.3.2 widget; not byte-identical with hosted 1.3.3."`
- `gitCommit` still pointing at the 1.3.2 build commit
- Widget SHA-256 `8aea9198…` ≠ hosted immutable 1.3.3 `88b15f11…`

### 3. Grey expanded-header presence dot

Widget 1.3.2 applied equal-specificity CSS where `.pw-chat-status-dot { background: #94A3B8 }` appeared **after** `.pw-chat-tone-*`, so the expanded header stayed grey when Online. Hosted widget **1.3.3** (commit `5330473`) moves tone rules after the status-dot default. Both launcher and header share the same tone classes when human availability is confirmed.

### 4. Duplicate plugin installations

WordPress identity is the **folder** `primewayz-integration` + entry `primewayz-integration.php`, not the display name. Duplicates occur when:

- A ZIP with a different root folder is uploaded (new plugin row), or
- A backslash-path ZIP extracts as a non-canonical tree while the previous folder remains active, or
- An administrator installs a “new” package beside the existing one instead of upgrading in place.

Display-name-only changes do not create a second folder when the ZIP root remains `primewayz-integration/`.

### 5. Metadata drift in the first 1.3.3 packaging attempt

Even when the widget bytes were correct, heartbeat still reported `'widgetVersion' => '1.3.2'`. Recovery sets this to `1.3.3`.

## What this recovery package contains

| Item | Value |
| --- | --- |
| ZIP | `releases/primewayz-chat-connect-v1.3.3.zip` |
| Plugin folder | `primewayz-integration/` (only root) |
| Entry point | `primewayz-integration/primewayz-integration.php` |
| Display name | `Primewayz Chat Connect v1.3.3` |
| Version / `PWI_VERSION` | `1.3.3` |
| Option key | `pwi_settings` (unchanged) |
| Bundled widget | Byte-identical to `embed-releases/chat/1.3.3/pw-chat.js` |
| Asset loading | Local vendored `assets/chat/pw-chat.js` (not remote `/embed`) |
| Tenant (ops) | `pw-infotech` |
| Public siteKey | `primewayz-infotech` (unchanged; not the tenant id) |
| API origin | `https://uk.primewayz.com` |

## Presence colours (confirmed in bundled 1.3.3)

| State | Colour |
| --- | --- |
| Human available | `#16A34A` green |
| Away | `#F59E0B` amber |
| Offline | `#94A3B8` grey |
| Automated assistance | `#0284C7` blue |
| Service failure | `#DC2626` red |

Visitor header copy uses “Team available” (not “online”) when humans are available.

## Safe installation (primewayz.com WordPress)

1. **Backup** the current `wp-content/plugins/primewayz-integration/` folder and note Plugins screen state.
2. In **Plugins**, deactivate any **extra** Chat Connect / Primewayz Integration copies that are **not** in `primewayz-integration/`. Do not delete credentials from `wp-config.php`.
3. Upload `releases/primewayz-chat-connect-v1.3.3.zip` via Plugins → Add New → Upload (or replace the folder in place). WordPress must upgrade the existing `primewayz-integration` slug.
4. Confirm **exactly one** active plugin row whose path is `primewayz-integration/primewayz-integration.php`.
5. Confirm Settings → Primewayz Chat Connect: `chat_mode` is **Live** for public visitors (administrators intentionally see the admin front bar instead of the launcher unless `?pwi_chat_preview=1`).
6. Incognito / logged-out check on https://primewayz.com: launcher visible; open panel; when team is available both dots are green.
7. Diagnostics → send Chat Connect heartbeat; confirm acceptance on the UK Chat Platform installation registry.

## Rollback

1. Deactivate the 1.3.3 package.
2. Re-upload / restore `releases/primewayz-chat-connect-1.3.2.zip` (forward-slash package known working before this recovery).
3. Re-activate `primewayz-integration`. Settings and `wp-config.php` credentials are unchanged by these packages.

## Packaging safeguard

Never use PowerShell `Compress-Archive` for Chat Connect ZIPs on Windows.

```bash
node scripts/package-chat-connect-wordpress.mjs \
  --source path/to/primewayz-integration \
  --out releases/primewayz-chat-connect-v1.3.3.zip

node scripts/verify-chat-connect-zip.mjs \
  releases/primewayz-chat-connect-v1.3.3.zip
```

The verifier rejects backslash entries, multiple plugin roots, hand-patched `artifactNote` widgets, and widgets that are not byte-identical to hosted 1.3.3.

## Verification limitations

- PHP CLI was not available in the recovery build environment; PHP files received structural checks only (`<?php` open tag, balanced braces). Run `php -l` on every `.php` file in a PHP-equipped environment before production install if required by policy.
- No live WordPress runtime (activation, enqueue, or primewayz.com browser) was executed from this repository session. Frontend widget behaviour was covered by central-platform unit tests for embed 1.3.3 / presence.
- Production WordPress, databases, Apache, and PM2 were not modified.
