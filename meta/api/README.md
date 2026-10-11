# TypePilot Console API

When **API mode** is enabled in the extension side panel, the TypePilot extension exposes a global object on every open tab you're typing into — a Google Doc, a Canvas assignment, the Packback editor, or any page with a text box:

```js
window._typepilot
```

This is the same typing engine that powers the side panel's Start / Run Test / Stop buttons, scriptable directly from the page's DevTools console (or by AI agents running in the page).

## Enabling

1. Open the TypePilot side panel.
2. Toggle **Enable API mode** at the bottom of the side panel.
3. The API is now active on every currently-open tab with a text box. No reload required.

Toggling off removes `window._typepilot` from every tab immediately. Any in-flight `start()` Promises reject with `"TypePilot API mode was disabled."`, and the typing engine is stopped if the active run was API-initiated. Side panel-initiated runs are not affected — they keep typing.

## Minimum example

```js
_typepilot.config.text = "Hello from the console.";
await _typepilot.start();
```

After `await _typepilot.start()` resolves, typing is complete and the cursor is positioned at the end of the inserted text.

## Configuring before you start

Every field in `TypePilotSettings` is mutable on `_typepilot.config`:

```js
_typepilot.config.text = "Paste your draft here.";
_typepilot.config.wpm = 90;                  // 20–150
_typepilot.config.speedVariance = 25;        // 0–80 (%)
_typepilot.config.typoRate = 4;              // 0–30 (%)
_typepilot.config.detourRate = 2;            // 0–25 (%)
_typepilot.config.breakFrequencySeconds = 60; // 10–600
_typepilot.config.breakFrequencyVariance = 30; // 0–100 (%)
_typepilot.config.breakMinSeconds = 3;        // 3–60
_typepilot.config.breakMaxSeconds = 12;       // breakMinSeconds–90
```

Values outside their valid range are clamped at `start()` time, never on assignment. See `reference.md` for the exact clamp ranges.

## Methods at a glance

| Method | Returns | Behavior |
|--------|---------|----------|
| `_typepilot.start()` | `Promise<void>` | Begins typing; resolves when typing finishes; rejects on error or cancellation |
| `_typepilot.stop()` | `Promise<void>` | Cancels the active run; resolves once the cancellation is acknowledged |
| `_typepilot.test()` | `Promise<void>` | Runs the input-event diagnostic matrix; resolves when all methods have been tried |
| `_typepilot.status()` | `Promise<{ running: boolean, detail: string }>` | Fetches the current run status |
| `_typepilot.version` | `string` | Extension semver (e.g. `"2.1.0"`) |

For full per-method behavior and edge cases see [reference.md](./reference.md).

## Lifecycle

- With API mode enabled, the bridge is available on any page you're typing into — Google Docs, Canvas, Packback, or any standard textarea or contenteditable field.
- Calling `start()` while another run is in progress stops the previous run before starting the new one — this matches the side panel's Start button behavior.
- Calling `start()` from one place (side panel or API) and then `stop()` from the other works correctly. A side panel-driven stop will reject any pending API-driven `start()` Promise with `"cancelled"`.

## For AI agents

If you're an agent driving TypePilot from the page:

1. Always `await` `start()`. The Promise resolves on natural completion — don't poll `status()` in a loop.
2. Snapshot the text into `config.text` before calling `start()`. The settings object is read at start time, so mutating it mid-run has no effect on the current run.
3. If the cursor isn't in the editable area, typing will fail — on Google Docs with `"The Google Docs cursor was lost. Click back into the document and retry."`, and on other fields with a similar "click back into it" message — surface it to the user.
