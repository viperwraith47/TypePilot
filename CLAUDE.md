# TypePilot

Two targets: a Plasmo browser extension and a Next.js marketing website.

## Version Bump
`./bump-version.sh <version>` — syncs version across all 4 version files at once.

## Extension Source (`src/`)
- `src/sidepanel.tsx` — side-panel entry (Plasmo auto-detects `sidepanel.tsx`); wrapper around `PanelView`. Replaces the old toolbar popup — the UI now lives in the browser sidebar.
- `src/PanelView.tsx` — side-panel React UI
- `src/panel.css` — side-panel styles
- `src/content.ts` — content script; handles all typing simulation
- `src/background.ts` — service worker; frame targeting + toggles the side panel on toolbar click (Chrome only)
- `src/types.ts` — shared types and `DEFAULT_SETTINGS`
- `src/lib/github-oauth.ts` — **optional** GitHub OAuth (PKCE) sign-in flow; stores token in `chrome.storage.local`

## Optional GitHub OAuth

TypePilot works fully without signing in. GitHub OAuth is an **opt-in** feature
that lets users authenticate to GitHub from the extension sidebar. It uses the
**PKCE** flow (no client secret required — the extension is a public client).

### Setup

1. Register a GitHub OAuth App at `https://github.com/settings/developers`:
   - Application name: `TypePilot`
   - Homepage URL: `https://typepilot.org`
   - Authorization callback URL:
     - `https://<dev-extension-id>.chromiumapp.org/`
     - `https://<prod-extension-id>.chromiumapp.org/`

   You can find your extension IDs by loading the unpacked build and reading
   `chrome.runtime.id` in the side panel console.

2. Create a `.env` file from `.env.example`:
   ```
   GITHUB_CLIENT_ID=<your-oauth-app-client-id>
   ```
   The client ID is public (PKCE doesn't need the secret), so it's safe to
   commit for the published build.

3. Rebuild: `pnpm build` or `pnpm dev`.

### How it works

`src/lib/github-oauth.ts` handles the full flow:
- Generates a PKCE code verifier/challenge pair
- Launches `chrome.identity.launchWebAuthFlow` with GitHub's authorize URL
- Exchanges the returned code for an access token (PKCE, no secret)
- Fetches and caches the user profile in `chrome.storage.local`
- Provides `githubApi<T>(path)` for authenticated API calls

Dev: `pnpm dev` | Build: `pnpm build` | Firefox: `pnpm build:firefox` | Package (zip): `pnpm package`
→ See `.claude/extension.md`

## Website Routes (Next.js App Router — `website/`)
- `/` → `src/app/page.tsx`
- `/get` → `src/app/get/page.tsx`
- `/privacy` → `src/app/privacy/page.tsx`
- `/license` → `src/app/license/page.tsx`

Dev: `cd website && pnpm dev`
→ See `.claude/website.md`
