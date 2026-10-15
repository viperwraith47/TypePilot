# TypePilot

A cross-browser extension (Chrome / Edge / Firefox) that types pasted text into any website — Google Docs, Canvas, the Packback editor, and virtually any `<textarea>`, `<input>`, or `[contenteditable]` field — with believable human cadence:

- adjustable typing speed (20–150 WPM)
- keyboard-neighbor typos that get auto-corrected
- occasional false-start words pulled from nearby context and fully deleted
- configurable short breaks at sentence boundaries
- diagnostics mode for verifying typing event paths

Built with [Plasmo](https://docs.plasmo.com/) + React + TypeScript.

## Brand Name Clarification

**TypePilot** is an independent, noncommercial open-source project created and maintained by Tanush Kulkarni. It is **not affiliated with, endorsed by, or connected to** Dripwriter, LLC or the commercial service at dripwriter.com.

Any reference to "Dripwriter" in this project's documentation describes that separate product solely for the purpose of identification and comparison.

## Develop

```bash
pnpm install
pnpm dev               # Chrome MV3 development (HMR) → build/chrome-mv3-dev
pnpm dev:firefox       # Firefox MV3 development     → build/firefox-mv3-dev
```

Load the development build as an **unpacked extension**:
- Chrome / Edge: `chrome://extensions` → enable Developer mode → Load unpacked → `build/chrome-mv3-dev`
- Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `build/firefox-mv3-dev/manifest.json`

## Build & package

```bash
pnpm build             # Chrome MV3 production  → build/chrome-mv3-prod
pnpm build:firefox     # Firefox MV3 production → build/firefox-mv3-prod
pnpm package           # Zips both into build/chrome-mv3-prod.zip and build/firefox-mv3-prod.zip
```

The packaged `*.zip` files in `build/` are tracked in git; the unpacked `build/<target>/` directories are not.

## Usage

1. Open any page with a text box — a Google Doc, a Canvas assignment, the Packback editor, or any standard textarea / contenteditable field.
2. Click where the typing should begin.
3. Open the TypePilot sidebar from the toolbar — click the extension icon in Chrome, or the browser sidebar button in Firefox.
4. Paste your text, tune the cadence, and press **Start**.
5. Press **Stop** at any time, or **Run Test** to verify which typing event paths work. The sidebar stays open, so paste the next chunk and keep typing without reopening anything.

## Marketing site

A Next.js marketing site lives in [`website/`](./website) and deploys to `typepilot.org`.

## Inspirations

This project was originally conceived and created by **Alexey Fedorov**, whose vision for a privacy-first, human-like typing simulator laid the foundation for what TypePilot is today. His pioneering work on the Dripwriter Origin concept — and the early prototype that evolved into this extension — continues to inspire the project's direction.

We're grateful for his contributions and the thoughtful decisions that shaped TypePilot's core architecture.

## License

[TypePilot License](./LICENSE) — noncommercial use is permitted; commercial use requires a separate license.
