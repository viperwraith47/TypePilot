export interface TypePilotSettings {
  text: string;
  wpm: number;
  speedVariance: number;
  typoRate: number;
  detourRate: number;
  breakFrequencySeconds: number;
  breakFrequencyVariance: number;
  breakMinSeconds: number;
  breakMaxSeconds: number;
}

export interface TypingStatus {
  running: boolean;
  detail: string;
  /** Set when a run ended because Google Docs rejected the text we tried to insert. */
  failed?: boolean;
  /**
   * Set when a stopped run kept enough state to continue later: a Resume
   * request will continue from the last successfully typed character.
   */
  resumable?: boolean;
}

export type TypePilotMessage =
  | { type: "START_DRIP"; payload: TypePilotSettings }
  | {
      /**
       * Echoes the side panel's current settings. The content script refuses Resume
       * when the text changed, and otherwise continues with these knobs.
       */
      type: "RESUME_DRIP";
      payload: { text: string } & Partial<TypePilotSettings>;
    }
  | { type: "RUN_DIAGNOSTICS" }
  | { type: "STOP_DRIP" }
  | { type: "GET_STATUS" };

export interface TypePilotResponse {
  ok: boolean;
  status: TypingStatus;
  error?: string;
}

export const DEFAULT_SETTINGS: TypePilotSettings = {
  text: "",
  wpm: 60,
  speedVariance: 30,
  typoRate: 3,
  detourRate: 3,
  breakFrequencySeconds: 55,
  breakFrequencyVariance: 30,
  breakMinSeconds: 3,
  breakMaxSeconds: 15
};

// ---- API mode / console bridge ----

export const API_MODE_STORAGE_KEY = "typepilotApiMode";

/** Marker on every message the bridge and content script exchange. */
export const BRIDGE_REQUEST_SOURCE = "typepilot-api-request";
export const BRIDGE_RESPONSE_SOURCE = "typepilot-api-response";
export const BRIDGE_CONTROL_SOURCE = "typepilot-api-control";

/** Sent from isolated content script to the MAIN-world bridge. */
export type BridgeControl =
  | { source: typeof BRIDGE_CONTROL_SOURCE; action: "enable"; version: string }
  | { source: typeof BRIDGE_CONTROL_SOURCE; action: "disable" };

/** Sent from MAIN-world bridge to isolated content script. */
export type BridgeRequest =
  | { source: typeof BRIDGE_REQUEST_SOURCE; id: string; method: "start"; settings: TypePilotSettings }
  | { source: typeof BRIDGE_REQUEST_SOURCE; id: string; method: "stop" }
  | { source: typeof BRIDGE_REQUEST_SOURCE; id: string; method: "test" }
  | { source: typeof BRIDGE_REQUEST_SOURCE; id: string; method: "status" };

/** Sent from isolated content script back to the MAIN-world bridge. */
export interface BridgeResponse {
  source: typeof BRIDGE_RESPONSE_SOURCE;
  id: string;
  ok: boolean;
  error?: string;
  status?: TypingStatus;
}

// ---- GitHub OAuth (optional sign-in) ----

export const GITHUB_TOKEN_STORAGE_KEY = "typepilotGithubToken";
export const GITHUB_USER_STORAGE_KEY = "typepilotGithubUser";

/** Minimal GitHub user profile returned by `GET /user`. */
export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

/** Result returned by a successful GitHub OAuth sign-in. */
export interface GithubAuthResult {
  token: string;
  user: GithubUser;
}

// ---- Frame targeting (background service worker) ----

/**
 * With `all_frames` injection every frame runs a content script. The background
 * service worker tracks which frame last focused an editable so the side panel can
 * send typing commands to the right one (e.g. the cross-origin Packback iframe).
 */
export type FrameMessage =
  | { type: "EDITABLE_FOCUSED" }
  | { type: "GET_TARGET_FRAME"; tabId: number };

export interface TargetFrameResponse {
  frameId: number | null;
}
