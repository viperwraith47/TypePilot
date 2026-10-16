/**
 * GitHub OAuth (PKCE) integration for TypePilot.
 *
 * Uses the Proof Key for Code Exchange (PKCE) flow so that **no client secret**
 * is required — the browser extension is a public client. The access token is
 * stored in `chrome.storage.local` and used for authenticated GitHub API requests.
 *
 * Setup:
 *   1. Register a GitHub OAuth App at https://github.com/settings/developers
 *   2. Set the Authorization callback URL to:
 *        https://<extension-id>.chromiumapp.org/
 *      (for both your dev and production extension IDs)
 *   3. Add `GITHUB_CLIENT_ID=<your-client-id>` to a `.env` file at the
 *      project root (copy `.env.example`).
 *   4. Rebuild the extension (`pnpm build`).
 *
 * The feature is **optional** — TypePilot works fully without signing in.
 */

import type { GithubAuthResult, GithubUser } from "../types";
import {
  GITHUB_TOKEN_STORAGE_KEY,
  GITHUB_USER_STORAGE_KEY
} from "../types";

/** GitHub OAuth endpoints. */
const GITHUB_AUTH_BASE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const GITHUB_API_BASE = "https://api.github.com";

/** Scopes requested from the user. `read:user` covers profile info. */
const GITHUB_OAUTH_SCOPES = "read:user";

/**
 * The redirect URL that Chrome intercepts for extension OAuth flows.
 * Chrome automatically captures any redirect to `https://<extension-id>.chromiumapp.org/`,
 * so this must also be registered as the "Authorization callback URL" in the
 * GitHub OAuth App settings.
 */
export function getRedirectBaseUrl(): string {
  return `https://${chrome.runtime.id}.chromiumapp.org/`;
}

/** Client ID from the build-time env var (inlined by Plasmo/Vite at build time). */
const GITHUB_CLIENT_ID: string =
  (process.env.GITHUB_CLIENT_ID as string | undefined) ?? "";

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Generate a PKCE code_verifier (43–128 chars from the unreserved set). */
function generateCodeVerifier(): string {
  // 64 bytes → ~86 base64url chars, well within the 43–128 range.
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Derive a code_challenge = base64url(SHA-256(verifier)). */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

// ---------------------------------------------------------------------------
// Auth URL construction
// ---------------------------------------------------------------------------

/** Build the GitHub authorization URL with PKCE parameters. */
function buildAuthUrl(verifier: string, challenge: string): string {
  if (!GITHUB_CLIENT_ID) {
    throw new Error(
      "GITHUB_CLIENT_ID is not set. Add it to your .env file (see .env.example)."
    );
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: getRedirectBaseUrl(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: GITHUB_OAUTH_SCOPES,
    response_type: "code",
    state: crypto.randomUUID()
  });

  return `${GITHUB_AUTH_BASE}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Auth flow
// ---------------------------------------------------------------------------

/**
 * Launches the GitHub OAuth sign-in flow using `chrome.identity`.
 *
 * Opens a popup to GitHub's authorize page, waits for the PKCE redirect,
 * exchanges the code for an access token, and fetches the user profile.
 *
 * Returns `{ token, user }` on success, or `null` if the user cancelled.
 * @throws if the client ID is missing or the token exchange fails.
 */
export async function signInWithGitHub(): Promise<GithubAuthResult | null> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const authUrl = buildAuthUrl(verifier, challenge);
  const redirectBaseUrl = getRedirectBaseUrl();

  const responseUrl = await new Promise<string | undefined>((resolve) => {
    // The @types/chrome@0.3.0 WebAuthFlowDetails doesn't include redirectBaseUrl,
    // but the Chrome runtime supports it. Cast to add the field.
    const details = {
      url: authUrl,
      redirectBaseUrl,
      interactive: true
    } as chrome.identity.WebAuthFlowDetails;

    chrome.identity.launchWebAuthFlow(details, (redirectedUrl) => {
      resolve(redirectedUrl);
    });
  });

  if (!responseUrl) {
    // User cancelled the flow or an error occurred.
    return null;
  }

  const url = new URL(responseUrl);
  const code = url.searchParams.get("code");
  if (!code) {
    return null;
  }

  const token = await exchangeCodeForToken(code, verifier, redirectBaseUrl);
  const user = await fetchGitHubUser(token);
  await saveAuthData(token, user);

  return { token, user };
}

/** Exchange the authorization code for an access token (PKCE — no client secret). */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch(GITHUB_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Failed to exchange code for token."
    );
  }

  return data.access_token;
}

/** Fetch the authenticated user's profile from GitHub. */
async function fetchGitHubUser(token: string): Promise<GithubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch GitHub user profile.");
  }

  return (await res.json()) as GithubUser;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/** Persist the token + user profile to chrome.storage.local. */
async function saveAuthData(token: string, user: GithubUser): Promise<void> {
  await chrome.storage.local.set({
    [GITHUB_TOKEN_STORAGE_KEY]: token,
    [GITHUB_USER_STORAGE_KEY]: user
  });
}

/** Retrieve the stored access token, or null if signed out. */
export async function getStoredToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(GITHUB_TOKEN_STORAGE_KEY);
  const token = result[GITHUB_TOKEN_STORAGE_KEY];
  return typeof token === "string" && token.length > 0 ? token : null;
}

/** Retrieve the stored GitHub user profile, or null if signed out. */
export async function getStoredUser(): Promise<GithubUser | null> {
  const result = await chrome.storage.local.get(GITHUB_USER_STORAGE_KEY);
  const user = result[GITHUB_USER_STORAGE_KEY];
  return user && typeof user === "object" ? (user as GithubUser) : null;
}

/** Remove the stored token and user profile (sign out). */
export async function signOutOfGitHub(): Promise<void> {
  await chrome.storage.local.remove([GITHUB_TOKEN_STORAGE_KEY, GITHUB_USER_STORAGE_KEY]);
}

/** True when a valid token is persisted in storage. */
export async function isSignedIn(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}

// ---------------------------------------------------------------------------
// Authenticated API helper
// ---------------------------------------------------------------------------

/**
 * Issue an authenticated GET request to the GitHub API.
 * @throws if the user is not signed in.
 */
export async function githubApi<T>(path: string): Promise<T> {
  const token = await getStoredToken();
  if (!token) {
    throw new Error("Not signed in to GitHub.");
  }

  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      `GitHub API error (${res.status}): ${data?.message || res.statusText}`
    );
  }

  return (await res.json()) as T;
}
