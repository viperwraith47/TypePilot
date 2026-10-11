import type { PlasmoCSConfig } from "plasmo";

import {
  BRIDGE_CONTROL_SOURCE,
  BRIDGE_REQUEST_SOURCE,
  BRIDGE_RESPONSE_SOURCE,
  type BridgeControl,
  type BridgeRequest,
  type BridgeResponse,
  DEFAULT_SETTINGS,
  type TypePilotSettings,
  type TypingStatus
} from "../types";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_idle",
  world: "MAIN"
};

interface TypePilotApi {
  readonly version: string;
  config: TypePilotSettings;
  start(): Promise<void>;
  stop(): Promise<void>;
  test(): Promise<void>;
  status(): Promise<TypingStatus>;
}

declare global {
  interface Window {
    _typepilot?: TypePilotApi;
  }
}

const pending = new Map<string, {
  resolve: (response: BridgeResponse) => void;
  reject: (error: Error) => void;
}>();

export const VERSION = "3.2.0";

let apiVersion = VERSION;

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.source === BRIDGE_CONTROL_SOURCE) {
    handleControl(data as BridgeControl);
    return;
  }

  if (data.source === BRIDGE_RESPONSE_SOURCE) {
    const response = data as BridgeResponse;
    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);
    entry.resolve(response);
  }
});

function handleControl(control: BridgeControl) {
  if (control.action === "enable") {
    apiVersion = control.version;
    if (!window._typepilot) {
      window._typepilot = createApi();
    }
    return;
  }

  if (control.action === "disable") {
    if (window._typepilot) {
      delete window._typepilot;
    }
    for (const entry of pending.values()) {
      entry.reject(new Error("TypePilot API mode was disabled."));
    }
    pending.clear();
  }
}

function createApi(): TypePilotApi {
  const userConfig: TypePilotSettings = { ...DEFAULT_SETTINGS };

  function send<T extends BridgeRequest["method"]>(
    method: T,
    extra: Omit<Extract<BridgeRequest, { method: T }>, "source" | "id" | "method">
  ): Promise<BridgeResponse> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      pending.set(id, { resolve, reject });
      const request = {
        source: BRIDGE_REQUEST_SOURCE,
        id,
        method,
        ...extra
      } as BridgeRequest;
      window.postMessage(request, window.location.origin);
    });
  }

  const api: TypePilotApi = {
    get version() {
      return apiVersion;
    },
    config: userConfig,
    async start() {
      const response = await send("start", { settings: { ...userConfig } });
      if (!response.ok) {
        throw new Error(response.error ?? "TypePilot start failed.");
      }
    },
    async stop() {
      const response = await send("stop", {});
      if (!response.ok) {
        throw new Error(response.error ?? "TypePilot stop failed.");
      }
    },
    async test() {
      const response = await send("test", {});
      if (!response.ok) {
        throw new Error(response.error ?? "TypePilot test failed.");
      }
    },
    async status() {
      const response = await send("status", {});
      if (!response.ok || !response.status) {
        throw new Error(response.error ?? "Could not fetch status.");
      }
      return response.status;
    }
  };

  return api;
}
