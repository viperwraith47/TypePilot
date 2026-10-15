import { useCallback, useEffect, useRef, useState } from "react";

import {
  API_MODE_STORAGE_KEY,
  DEFAULT_SETTINGS,
  type TypePilotMessage,
  type TypePilotResponse,
  type TypePilotSettings,
  type TargetFrameResponse,
  type TypingStatus
} from "./types";
import { VERSION_TAG } from "~/lib/version";

type StatusState = "idle" | "running" | "error" | "done";

function stateForStatus(status: TypingStatus, settled: StatusState): StatusState {
  if (status.failed) return "error";
  return status.running ? "running" : settled;
}

const TITLE = "TypePilot";
const THEME_KEY = "typepilotTheme";
const STORAGE_KEY = "typepilotSettings";

type SettingsTab = "speed" | "breaks" | "mistakes";

function MixRow({ id, label, unit, min, max, step = 1, value, onChange }: {
  id: string; label: string; unit: string;
  min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mix-row">
      <span className="mr-label">{label}</span>
      <div className="mr-track-wrap">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => {
            const v = Number(e.target.value);
            onChange(v);
            const pct = (v - min) / (max - min) * 100;
            e.target.style.setProperty("--pct", `${pct}%`);
          }}
          ref={el => {
            if (el) {
              const pct = (value - min) / (max - min) * 100;
              el.style.setProperty("--pct", `${pct}%`);
            }
          }}
          id={id}
        />
      </div>
      <span className="mr-val"><span>{value}</span><em>{unit}</em></span>
    </div>
  );
}

export default function PanelView() {
  const [settings, setSettings] = useState<TypePilotSettings>(DEFAULT_SETTINGS);
  const [statusDetail, setStatusDetail] = useState<string>(
    "Idle. Click into any text box, then press Start."
  );
  const [statusState, setStatusState] = useState<StatusState>("idle");
  const [resumable, setResumable] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const loaded = useRef(false);
  const themeLoaded = useRef(false);
  const [apiMode, setApiMode] = useState<boolean>(false);
  const apiModeLoaded = useRef(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("speed");
  const [textExpanded, setTextExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = (await chrome.storage.local.get({ typepilotSettings: DEFAULT_SETTINGS })) as {
        typepilotSettings?: Partial<TypePilotSettings>;
      };

      const merged: TypePilotSettings = {
        ...DEFAULT_SETTINGS,
        ...stored.typepilotSettings
      };

      if (merged.breakMaxSeconds < merged.breakMinSeconds) {
        merged.breakMaxSeconds = merged.breakMinSeconds;
      }

      if (cancelled) return;
      setSettings(merged);
      loaded.current = true;

      void refreshStatus();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    void chrome.storage.local.set({ [STORAGE_KEY]: settings });
  }, [settings]);

  useEffect(() => {
    chrome.storage.local.get({ [THEME_KEY]: "dark" }).then(r => {
      setTheme((r[THEME_KEY] as "dark" | "light") || "dark");
      themeLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    if (!themeLoaded.current) return;
    void chrome.storage.local.set({ [THEME_KEY]: theme });
  }, [theme]);

  useEffect(() => {
    chrome.storage.local.get({ [API_MODE_STORAGE_KEY]: false }).then(r => {
      setApiMode(Boolean(r[API_MODE_STORAGE_KEY]));
      apiModeLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!apiModeLoaded.current) return;
    void chrome.storage.local.set({ [API_MODE_STORAGE_KEY]: apiMode });
  }, [apiMode]);

  const sendToActiveTab = useCallback(
    async (
      message: TypePilotMessage,
      reportErrors = true
    ): Promise<TypePilotResponse | null> => {
      const fail = (detail: string) => {
        if (!reportErrors) return;
        setStatusDetail(detail);
        setStatusState("error");
      };

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        fail("No active tab to type into.");
        return null;
      }

      const isDocs = tab.url?.startsWith("https://docs.google.com/document/");
      let frameId: number | undefined = isDocs ? 0 : undefined;

      if (!isDocs) {
        const res = (await chrome.runtime.sendMessage({
          type: "GET_TARGET_FRAME",
          tabId: tab.id
        })) as TargetFrameResponse | undefined;

        if (res?.frameId == null) {
          fail("Click into a text box on the page, then press Start.");
          return null;
        }
        frameId = res.frameId;
      }

      try {
        return (await chrome.tabs.sendMessage(
          tab.id,
          message,
          frameId != null ? { frameId } : undefined
        )) as TypePilotResponse;
      } catch {
        fail("Reload the page so the extension can attach, then try again.");
        return null;
      }
    },
    []
  );

  const refreshStatus = useCallback(async () => {
    const response = await sendToActiveTab({ type: "GET_STATUS" }, false);
    if (!response) return;
    setStatusDetail(response.status.detail);
    setStatusState(stateForStatus(response.status, "idle"));
    setResumable(Boolean(response.status.resumable) && !response.status.running);
  }, [sendToActiveTab]);

  useEffect(() => {
    if (statusState !== "running") return;
    const id = setInterval(() => void refreshStatus(), 500);
    return () => clearInterval(id);
  }, [statusState, refreshStatus]);

  const onStart = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!settings.text.trim()) {
        setStatusDetail("Paste some text into the extension first.");
        setStatusState("error");
        return;
      }

      let payload = settings;
      if (settings.breakMaxSeconds < settings.breakMinSeconds) {
        payload = { ...settings, breakMaxSeconds: settings.breakMinSeconds };
        setSettings(payload);
      }

      setResumable(false);

      const response = await sendToActiveTab({ type: "START_DRIP", payload });
      if (!response) return;

      setStatusDetail(response.status.detail);
      setStatusState(stateForStatus(response.status, "done"));
    },
    [settings, sendToActiveTab]
  );

  const onStop = useCallback(async () => {
    const response = await sendToActiveTab({ type: "STOP_DRIP" });
    if (!response) {
      setStatusDetail("Stopped locally.");
      setStatusState("idle");
      setResumable(false);
      return;
    }
    setStatusDetail(response.status.detail);
    setStatusState("idle");
    setResumable(Boolean(response.status.resumable) && !response.status.running);
  }, [sendToActiveTab]);

  const onResume = useCallback(async () => {
    const response = await sendToActiveTab({ type: "RESUME_DRIP", payload: { ...settings } });
    if (!response) return;

    setStatusDetail(response.status.detail);
    setStatusState(stateForStatus(response.status, "done"));

    if (!response.status.resumable) {
      setResumable(false);
    }
  }, [settings, sendToActiveTab]);

  const onDiagnostics = useCallback(async () => {
    const response = await sendToActiveTab({ type: "RUN_DIAGNOSTICS" });
    if (!response) return;
    setResumable(false);
    setStatusDetail(response.status.detail);
    setStatusState(stateForStatus(response.status, "done"));
  }, [sendToActiveTab]);

  const update = <K extends keyof TypePilotSettings>(key: K, value: TypePilotSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "speed", label: "Speed" },
    { id: "breaks", label: "Breaks" },
    { id: "mistakes", label: "Mistakes" }
  ];

  return (
    <main className="glass-shell">
      {/* Header */}
      <header className="glass-header">
        <div className="glass-header__left">
          <h1 className="glass-title">{TITLE}</h1>
          <p className="glass-subtitle">Human-like typing engine</p>
        </div>
        <button
          type="button"
          className="glass-theme-toggle"
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      {/* Status bar */}
      <div
        className={`glass-status ${statusState === "error" ? "error" : ""} ${statusState === "running" ? "running" : ""}`}
        aria-live="polite"
      >
        {statusDetail}
      </div>

      {/* Main form */}
      <form className="glass-form" onSubmit={onStart}>
        {/* Text input — collapsible */}
        <section className={`glass-card glass-card--text ${textExpanded ? "expanded" : "collapsed"}`}>
          <button
            type="button"
            className="glass-card__header text-card__toggle"
            onClick={() => setTextExpanded(!textExpanded)}
            aria-expanded={textExpanded}
            aria-label={textExpanded ? "Collapse text input" : "Expand text input"}
          >
            <span className="text-card__label">Text to type</span>
            <span className={`text-card__chevron ${textExpanded ? "open" : ""}`}>▼</span>
          </button>
          <div className={`text-card__body ${textExpanded ? "open" : ""}`}>
            <textarea
              id="text"
              placeholder="Paste the text you want typed into any text box..."
              value={settings.text}
              onChange={(e) => update("text", e.target.value)}
            />
          </div>
        </section>

        {/* Settings tabs */}
        <section className="glass-card glass-card--settings">
          <nav className="glass-tabs">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`glass-tab ${activeTab === id ? "active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="glass-tab-content">
            {activeTab === "speed" && (
              <>
                <MixRow id="wpm" label="Typing speed" unit="wpm" min={20} max={150}
                  value={settings.wpm} onChange={v => update("wpm", v)} />
                <MixRow id="sv" label="Speed variance" unit="%" min={0} max={80}
                  value={settings.speedVariance} onChange={v => update("speedVariance", v)} />
              </>
            )}
            {activeTab === "breaks" && (
              <>
                <MixRow id="bf" label="Break frequency" unit="s" min={15} max={180} step={5}
                  value={settings.breakFrequencySeconds} onChange={v => update("breakFrequencySeconds", v)} />
                <MixRow id="bfv" label="Frequency vary" unit="%" min={0} max={100} step={5}
                  value={settings.breakFrequencyVariance} onChange={v => update("breakFrequencyVariance", v)} />
                <MixRow id="bmin" label="Shortest break" unit="s" min={3} max={20}
                  value={settings.breakMinSeconds} onChange={v => update("breakMinSeconds", v)} />
                <MixRow id="bmax" label="Longest break" unit="s" min={4} max={25}
                  value={settings.breakMaxSeconds} onChange={v => update("breakMaxSeconds", v)} />
              </>
            )}
            {activeTab === "mistakes" && (
              <>
                <MixRow id="typo" label="Typos" unit="%" min={0} max={25}
                  value={settings.typoRate} onChange={v => update("typoRate", v)} />
                <MixRow id="fs" label="False starts" unit="%" min={0} max={20}
                  value={settings.detourRate} onChange={v => update("detourRate", v)} />
              </>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="glass-actions">
          <button type="submit" className="glass-button glass-button--primary">
            Start
          </button>
          {resumable && statusState !== "running" && (
            <button
              type="button"
              className="glass-button"
              onClick={() => void onResume()}
            >
              Resume
            </button>
          )}
          <button
            type="button"
            className="glass-button"
            onClick={() => void onDiagnostics()}
          >
            Run Test
          </button>
          {statusState === "running" && (
            <button
              type="button"
              className="glass-button glass-button--secondary"
              onClick={() => void onStop()}
            >
              Stop
            </button>
          )}
        </div>
      </form>

      {/* Footer */}
      <footer className="glass-footer">
        <span className="footer-brand">TypePilot</span>
        <span className="footer-version">{VERSION_TAG}</span>
      </footer>

      {/* API toggle */}
      <div className="glass-api-toggle">
        <div className="api-toggle__row">
          <input
            type="checkbox"
            id="api-toggle"
            checked={apiMode}
            onChange={(e) => setApiMode(e.target.checked)}
          />
          <label className="api-toggle__label" htmlFor="api-toggle">
            Enable API mode
          </label>
          <span
            className="api-toggle__pill"
            aria-hidden
            data-on={apiMode}
          />
        </div>
        <p className="api-toggle__hint">
          Exposes <code>window._typepilot</code> on the active page. Active immediately — no reload needed.
        </p>
      </div>
    </main>
  );
}
