# Extension Architecture

Plasmo framework, Manifest V3, dual Chrome + Firefox builds.

## Entry Points

| File | Role |
|------|------|
| `src/sidepanel.tsx` | Side-panel entry point (Plasmo auto-detects); thin wrapper around `PanelView`. Declares the `side_panel` (Chrome) / `sidebar_action` (Firefox) entry — there is **no popup**. |
| `src/PanelView.tsx` | Side-panel React UI (Chrome, Edge, Opera, Firefox) |
| `src/content.ts` | Content script injected into every tab; owns all typing simulation logic |
| `src/background.ts` | Service worker; frame targeting + opens the side panel on toolbar click |
| `src/contents/bridge.ts` | MAIN-world content script; exposes `window._typepilot` API when API mode is enabled |
| `src/types.ts` | Shared types, message protocol, and `DEFAULT_SETTINGS` |
| `src/panel.css` | All side-panel styles (Google Fonts, mixer layout, range sliders, themes) |
| `src/lib/version.ts` | `VERSION_TAG` constant shown in side-panel footer |

## Opening the side panel

The extension lives in the browser sidebar, not a toolbar popup, so the panel
stays open while you work — paste text, press Start, keep typing, paste more.

- **Chrome/Edge:** click the TypePilot toolbar icon. The panel toggles open on
  the right (configured in `background.ts` via `chrome.sidePanel.setPanelBehavior`
  with `openPanelOnActionClick`). Because there is no `default_popup`, the click
  is handled by the background service worker rather than showing a popup.
- **Firefox:** open the browser sidebar (sidebar button / `Ctrl+Shift+B`/`Cmd+Shift+B`)
  and pick TypePilot. Firefox has no `chrome.sidePanel`, so the toolbar-icon
  wiring is feature-detected and skipped there.
- The panel targets the currently active tab, so click into the field you want
  typed before pressing Start. The `status` polling uses `GET_STATUS` on the
  active tab while a run is in progress and stops automatically when it returns
  to idle.

## Message Protocol

Side panel → content script via `chrome.tabs.sendMessage`:

```ts
type TypePilotMessage =
  | { type: "START_DRIP"; payload: TypePilotSettings }
  | { type: "RESUME_DRIP"; payload: { text: string } & Partial<TypePilotSettings> }
  | { type: "STOP_DRIP" }
  | { type: "RUN_DIAGNOSTICS" }
  | { type: "GET_STATUS" }
```

Response is always `TypePilotResponse { ok, status, error? }`.

### Stop / Resume

`TypingStatus.resumable` is set when a stopped run kept enough state to continue.
Stop preserves the verified commit position plus any temporary typo/detour
characters still in the editor; `RESUME_DRIP` deletes those strays, re-verifies
the committed prefix against the editor, and continues with the side panel's current
typing knobs. Only the text is part of the resume identity — changing WPM,
breaks, typos, or false starts after Stop does not invalidate the saved
position. Changing the text does. Start always means a fresh run and discards
saved progress. Resume is side-panel-only — the console bridge contract stays
start/stop/test/status.

**Limitation:** Resume prefix verification only works on `default` and `word-online`
harnesses (they read `textContent`). Google Docs uses a canvas renderer so the
prefix cannot be verified — Resume assumes the document was not manually edited.

## Settings

`TypePilotSettings` fields (all in `types.ts`):

| Field | Default | Description |
|-------|---------|-------------|
| `wpm` | 60 | Base typing speed |
| `speedVariance` | 30% | WPM jitter |
| `typoRate` | 3% | Chance of mistype per char |
| `detourRate` | 3% | Chance of false-start word |
| `breakFrequencySeconds` | 55 | Avg seconds between breaks |
| `breakFrequencyVariance` | 30% | Break frequency jitter |
| `breakMinSeconds` | 3 | Minimum break duration |
| `breakMaxSeconds` | 15 | Maximum break duration |

## Panel UI Components

- `MixRow` — labeled slider row with live `--pct` CSS fill
- `PanelView` — main component; manages settings state, theme toggle, animated title, start/stop

## Content Script Key Functions

- `handleMessage` — dispatcher for all incoming messages
- `runTypePilot` — main typing loop
- `typeLiteral` — types a string char-by-char with jitter, typos, detours
- `shouldTakeBreak` / `takeBreak` — pause logic
- `findDocsTarget` — detects Google Docs iframe vs. contenteditable vs. input

## Console API (`window._typepilot`)

When the side panel's **Enable API mode** toggle is on, `contents/bridge.ts` (MAIN-world content script) exposes `window._typepilot` on every open Google Docs tab. `content.ts` (isolated) drives it via `window.postMessage` and gates it via `chrome.storage.local["typepilotApiMode"]`.

| File | Role |
|------|------|
| `src/contents/bridge.ts` | MAIN-world content script. Defines `window._typepilot` with `config`, `start()`, `stop()`, `test()`, `status()`, `version`. |
| `src/content.ts` | Isolated content script. Listens for bridge requests via the `message` event; listens for `chrome.storage.onChanged` to enable/disable the bridge. |

API docs: `meta/api/README.md`, `meta/api/reference.md`.

## Build Outputs

```
build/chrome-mv3-prod/
build/firefox-mv3-prod/
```

Packaged ZIPs (for store submission): `pnpm package`
