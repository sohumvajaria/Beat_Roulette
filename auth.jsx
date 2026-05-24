// Beat Roulette — Spotify Authorization Code + PKCE (no backend)
// Public API integration. Replace the client ID below with your own.

// TODO: set this to your Spotify Developer Dashboard client ID
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";

const SPOTIFY_REDIRECT_URI = "https://sohumvajaria.github.io/Beat_Roulette/";
const SPOTIFY_SCOPES = ["user-top-read", "user-read-recently-played"];
const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const VERIFIER_KEY = "br_pkce_verifier";
const TOKEN_KEY = "br_sp_access_token";
const TOKEN_EXP_KEY = "br_sp_access_token_exp";

// ---------- PKCE primitives ----------

function base64UrlEncode(bytes) {
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(length = 96) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  // 0-9 a-z A-Z - . _ ~  (RFC 7636 unreserved chars)
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  for (let i = 0; i < length; i++) out += alpha[arr[i] % alpha.length];
  return out;
}

async function codeChallengeFromVerifier(verifier) {
  const enc = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return base64UrlEncode(new Uint8Array(hash));
}

// ---------- Public flow ----------

async function spotifyStartLogin() {
  if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID") {
    alert(
      "Spotify client ID not configured.\n\n" +
      "Open auth.jsx and set SPOTIFY_CLIENT_ID to your Spotify Developer Dashboard client ID, " +
      "then register " + SPOTIFY_REDIRECT_URI + " as a Redirect URI."
    );
    return;
  }
  const verifier = generateCodeVerifier();
  const challenge = await codeChallengeFromVerifier(verifier);
  try { sessionStorage.setItem(VERIFIER_KEY, verifier); } catch (e) {}

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  window.location.href = SPOTIFY_AUTHORIZE_URL + "?" + params.toString();
}

// Exchange ?code= in URL for an access token. Returns the token string, or null.
async function spotifyHandleRedirect() {
  let url;
  try { url = new URL(window.location.href); } catch (e) { return null; }
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    // Clean error out of the URL so a refresh doesn't loop
    url.searchParams.delete("error");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
    return { error: err };
  }
  if (!code) return null;

  let verifier = null;
  try { verifier = sessionStorage.getItem(VERIFIER_KEY); } catch (e) {}
  if (!verifier) {
    // Without a verifier we can't complete the exchange. Strip the code so we don't loop.
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
    return { error: "missing_verifier" };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  });

  let tokenJson = null;
  try {
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    tokenJson = await res.json();
  } catch (e) {
    tokenJson = { error: "network" };
  }

  // Clean code out of URL no matter what
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);

  try { sessionStorage.removeItem(VERIFIER_KEY); } catch (e) {}

  if (tokenJson && tokenJson.access_token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, tokenJson.access_token);
      const expMs = Date.now() + (Number(tokenJson.expires_in || 3600) * 1000);
      sessionStorage.setItem(TOKEN_EXP_KEY, String(expMs));
    } catch (e) {}
    return { token: tokenJson.access_token };
  }
  return { error: (tokenJson && tokenJson.error) || "exchange_failed" };
}

function spotifyGetStoredToken() {
  try {
    const tok = sessionStorage.getItem(TOKEN_KEY);
    const exp = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (!tok) return null;
    if (exp && Date.now() > exp - 10_000) return null; // expired (with 10s buffer)
    return tok;
  } catch (e) { return null; }
}

function spotifyClearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  } catch (e) {}
}

async function spotifyFetchTopTracks(token, { limit = 20, timeRange = "medium_term" } = {}) {
  const url = `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`;
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (!res.ok) {
    if (res.status === 401) {
      spotifyClearToken();
      throw new Error("unauthorized");
    }
    throw new Error("http_" + res.status);
  }
  const json = await res.json();
  return (json.items || []).map(t => ({
    id: t.id,
    title: t.name,
    artist: (t.artists || []).map(a => a.name).join(", "),
    cover:
      (t.album && t.album.images && (
        (t.album.images.find(i => i.width >= 200 && i.width <= 400) || t.album.images[1] || t.album.images[0])?.url
      )) || null,
  }));
}

Object.assign(window, {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  spotifyStartLogin,
  spotifyHandleRedirect,
  spotifyGetStoredToken,
  spotifyClearToken,
  spotifyFetchTopTracks,
});
