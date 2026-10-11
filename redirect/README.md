# redirect

Standalone Vercel project for TypePilot subdomain redirects. All routing is declared in `vercel.json` — no runtime, no build step.

## Subdomain map

| Subdomain | Destination | Status |
|---|---|---|
| `extension.typepilot.org` | Auto-detected by `User-Agent`: Firefox AMO, Edge Add-ons, or Chrome Web Store (default) | 301 |
| `chrome.typepilot.org` | Chrome Web Store listing | 301 |
| `edge.typepilot.org` | Microsoft Edge Add-ons listing | 301 |
| `firefox.typepilot.org` | Firefox AMO listing | 301 |
| `privacy.typepilot.org` | `typepilot.org/privacy` | 301 |
| `gh.typepilot.org`, `github.typepilot.org` | `github.com/viperwraith47/typepilot` | 301 |
| `support.typepilot.org`, `contact.typepilot.org` | `github.com/viperwraith47/typepilot/issues/new` | 301 |

Every destination carries `?utm_source=<originating-subdomain>.typepilot.org` for attribution.

## Browser detection

`extension.typepilot.org` matches the visitor's `User-Agent` header:

1. Contains `Firefox` → Firefox AMO
2. Contains `Edg/` → Edge Add-ons
3. Fallback (Chrome and everything else) → Chrome Web Store

Edge's UA also contains `Chrome`, so the Edge rule **must** be evaluated before the Chrome fallback in `vercel.json`. Vercel evaluates redirects top-down.

## Files

- `vercel.json` — redirect rules and status codes
- `public/index.html` — minimal static fallback (served only on unmatched routes)

## DNS

Each subdomain needs a CNAME / ALIAS pointing to this Vercel project (or use a wildcard ALIAS on `typepilot.org` and let Vercel route by `host`). Add the subdomains under Project Settings → Domains.
