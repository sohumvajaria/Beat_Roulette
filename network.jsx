// Beat Roulette — network session via PeerJS
// One device is "host" (owns canonical state). Others are "clients" — they
// dispatch actions, host applies them and broadcasts updated state back.

const { useState, useEffect, useRef, useCallback } = React;

const PEER_PREFIX = "beat-roulette-v2-";

// Generate a per-tab device id. Each browser tab gets a fresh id so multiple
// tabs on the same machine (a common test setup) don't collide.
// For the host, we persist to sessionStorage so a reload within the same tab
// keeps you as the same player. For clients, we keep it tab-volatile too —
// the network layer always creates a new id for a fresh tab.
function newDeviceId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "dev_" + window.crypto.randomUUID();
    }
  } catch (e) {}
  return "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function getDeviceId(role) {
  // Host: keep stable within this tab session (sessionStorage, not localStorage)
  // so a refresh keeps your identity but a new tab is a new player.
  if (role === "host") {
    let id = null;
    try { id = sessionStorage.getItem("br_device_id"); } catch (e) {}
    if (!id) {
      id = newDeviceId();
      try { sessionStorage.setItem("br_device_id", id); } catch (e) {}
    }
    return id;
  }
  // Client: ALWAYS a fresh id, never persisted. Prevents the host & client
  // tabs on the same machine from sharing an id (which would make them
  // overwrite each other's player record).
  return newDeviceId();
}

// ---------- Reducer (canonical, runs on host only) ----------
function initialState() {
  return {
    phase: "lobby",          // lobby | splash | round | results | final
    hostDeviceId: null,
    players: [],             // [{deviceId, name, online}]
    songs: [],               // [{id, ownerDeviceId, ownerName, title, artist, url, cover, noPreview}]
    order: [],               // [songId]
    roundIdx: 0,
    guesses: {},             // { [deviceId]: targetDeviceId }
    guessTimes: {},          // { [deviceId]: ms }
    roundStartedAt: 0,
    scores: {},              // { [deviceId]: int }
    scoreDeltas: {},         // { [deviceId]: int }
    streaks: {},             // { [deviceId]: int }
    fastestCorrect: null,    // deviceId
    songsPerPlayer: null,    // single-device: each player adds this many songs (= # of rounds)
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "join": {
      const { deviceId, name } = action;
      const existing = state.players.find(p => p.deviceId === deviceId);
      if (existing) {
        return {
          ...state,
          players: state.players.map(p =>
            p.deviceId === deviceId ? { ...p, name: name || p.name, online: true } : p
          ),
        };
      }
      if (state.phase !== "lobby") return state; // can't join mid-game
      return {
        ...state,
        players: [...state.players, { deviceId, name, online: true }],
        scores: { ...state.scores, [deviceId]: 0 },
        streaks: { ...state.streaks, [deviceId]: 0 },
      };
    }
    case "setOnline": {
      return {
        ...state,
        players: state.players.map(p =>
          p.deviceId === action.deviceId ? { ...p, online: action.online } : p
        ),
      };
    }
    case "setSongsPerPlayer": {
      if (state.phase !== "lobby") return state;
      const count = action.count;
      if (count < 1 || count > 5) return state;
      return { ...state, songsPerPlayer: count };
    }
    case "addSong": {
      if (state.phase !== "lobby") return state;
      const { ownerDeviceId, title, artist, url, cover, noPreview } = action;
      const owner = state.players.find(p => p.deviceId === ownerDeviceId);
      if (!owner) return state;
      if (state.songsPerPlayer) {
        const ownerCount = state.songs.filter(s => s.ownerDeviceId === ownerDeviceId).length;
        if (ownerCount >= state.songsPerPlayer) return state;
      }
      const id = "song_" + Math.random().toString(36).slice(2, 10);
      return {
        ...state,
        songs: [...state.songs, {
          id, ownerDeviceId, ownerName: owner.name,
          title, artist, url: url || null, cover: cover || null, noPreview: !!noPreview,
        }],
      };
    }
    case "removeSong": {
      if (state.phase !== "lobby") return state;
      return { ...state, songs: state.songs.filter(s => s.id !== action.songId) };
    }
    case "start": {
      if (state.phase !== "lobby") return state;
      const owners = new Set(state.songs.map(s => s.ownerDeviceId));
      if (state.songsPerPlayer) {
        const allReady = state.players.every(p =>
          state.songs.filter(s => s.ownerDeviceId === p.deviceId).length >= state.songsPerPlayer
        );
        if (!allReady) return state;
      } else if (state.songs.length < 3 || owners.size < 2) {
        return state;
      }
      const order = shuffleArr(state.songs.map(s => s.id));
      const scores = {}, streaks = {};
      state.players.forEach(p => { scores[p.deviceId] = 0; streaks[p.deviceId] = 0; });
      return {
        ...state,
        phase: "splash",
        order, roundIdx: 0,
        scores, streaks, scoreDeltas: {},
        guesses: {}, guessTimes: {},
        roundStartedAt: 0, fastestCorrect: null,
      };
    }
    case "enterRound": {
      if (state.phase !== "splash") return state;
      return { ...state, phase: "round", roundStartedAt: action.now, guesses: {}, guessTimes: {} };
    }
    case "submitGuess": {
      if (state.phase !== "round") return state;
      const { deviceId, targetDeviceId, now } = action;
      const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
      if (!song) return state;
      // Don't overwrite locked-in guesses
      if (state.guesses[deviceId]) return state;
      return {
        ...state,
        guesses: { ...state.guesses, [deviceId]: targetDeviceId },
        guessTimes: { ...state.guessTimes, [deviceId]: now - state.roundStartedAt },
      };
    }
    case "revealRound": {
      if (state.phase !== "round") return state;
      const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
      if (!song) return state;

      const guessers = state.players.filter(p => p.online !== false).map(p => p.deviceId);
      if (guessers.length > 0 && !guessers.every(g => state.guesses[g] != null)) return state;

      let fastest = null;
      let fastestT = Infinity;
      for (const g of guessers) {
        if (state.guesses[g] === song.ownerDeviceId) {
          const t = state.guessTimes[g];
          if (t != null && t < fastestT) { fastestT = t; fastest = g; }
        }
      }

      const scores = { ...state.scores };
      const streaks = { ...state.streaks };
      const deltas = {};
      let wrongCount = 0;
      let totalLocked = 0;

      for (const g of guessers) {
        const guess = state.guesses[g];
        let delta = 0;
        if (guess == null) {
          // Didn't lock in — no points, streak resets
          streaks[g] = 0;
          deltas[g] = 0;
          continue;
        }
        totalLocked += 1;
        const correct = guess === song.ownerDeviceId;
        if (correct) {
          delta = 1;
          if (g === fastest) delta += 1;
          const newStreak = (streaks[g] || 0) + 1;
          streaks[g] = newStreak;
          if (newStreak >= 3) delta += 1;
        } else {
          streaks[g] = 0;
          wrongCount += 1;
        }
        scores[g] = (scores[g] || 0) + delta;
        deltas[g] = delta;
      }

      // Owner bonus: more than half of LOCKED guessers were wrong
      let ownerDelta = 0;
      if (totalLocked > 0 && wrongCount * 2 > totalLocked) {
        ownerDelta = 1;
        scores[song.ownerDeviceId] = (scores[song.ownerDeviceId] || 0) + 1;
      }
      deltas[song.ownerDeviceId] = ownerDelta;
      // Owner's streak is preserved (they aren't guessing); no change.

      return {
        ...state,
        phase: "results",
        scores, streaks, scoreDeltas: deltas,
        fastestCorrect: fastest,
      };
    }
    case "nextRound": {
      if (state.phase !== "results") return state;
      if (state.roundIdx + 1 >= state.order.length) {
        return { ...state, phase: "final" };
      }
      return {
        ...state,
        phase: "splash",
        roundIdx: state.roundIdx + 1,
        guesses: {}, guessTimes: {},
        scoreDeltas: {}, fastestCorrect: null,
      };
    }
    case "reset": {
      // Keep players + host, wipe game
      const cleared = Object.fromEntries(state.players.map(p => [p.deviceId, 0]));
      return {
        ...initialState(),
        hostDeviceId: state.hostDeviceId,
        songsPerPlayer: state.songsPerPlayer,
        players: state.players,
        scores: cleared,
        streaks: cleared,
      };
    }
    case "kickOffline": {
      // Optional admin tool; not currently exposed
      return { ...state, players: state.players.filter(p => p.online !== false) };
    }
    default:
      return state;
  }
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- useSession ----------
// mode: { kind: "local" | "host", code } | { kind: "client", code }
function useSession(mode, displayName) {
  const deviceId = useRef(getDeviceId(mode.kind)).current;
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const peerRef = useRef(null);
  const connsRef = useRef(new Map()); // host: peerId -> conn ; client: hostId -> conn
  const stateRef = useRef(state);
  stateRef.current = state;

  // Host: apply action + broadcast
  const hostApply = useCallback((action) => {
    setState(prev => {
      const next = reducer(prev, action);
      // Broadcast to all clients
      connsRef.current.forEach(conn => {
        try { conn.send({ type: "state", state: next }); } catch (e) {}
      });
      return next;
    });
  }, []);

  // Setup PeerJS for host or client mode
  useEffect(() => {
    if (typeof Peer === "undefined") {
      setStatus({ kind: "error", message: "Network library failed to load." });
      return () => {};
    }

    if (mode.kind === "host") {
      setStatus({ kind: "connecting", message: "Opening room…" });
      const peerId = PEER_PREFIX + mode.code;
      const peer = new Peer(peerId, { debug: 0 });
      peerRef.current = peer;

      peer.on("open", () => {
        setStatus({ kind: "ready", message: "" });
        const rounds = mode.songsPerPlayer;
        const validRounds = rounds >= 1 && rounds <= 5 ? rounds : null;
        setState(s => {
          const seeded = {
            ...s,
            hostDeviceId: deviceId,
            songsPerPlayer: validRounds,
          };
          return reducer(seeded, {
            type: "join", deviceId, name: displayName || "Host"
          });
        });
      });

      peer.on("connection", (conn) => {
        conn.on("open", () => {
          connsRef.current.set(conn.peer, conn);
          // Snapshot current state to new joiner
          try { conn.send({ type: "state", state: stateRef.current }); } catch (e) {}
        });
        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "action") {
            hostApply({ ...msg.action, deviceId: conn.peer });
          }
        });
        conn.on("close", () => {
          connsRef.current.delete(conn.peer);
          hostApply({ type: "setOnline", deviceId: conn.peer, online: false });
        });
        conn.on("error", () => {});
      });

      peer.on("error", (err) => {
        const code = err && err.type;
        if (code === "unavailable-id") {
          setStatus({ kind: "error", message: "Room code already in use. Try another." });
        } else if (code === "network" || code === "server-error" || code === "disconnected") {
          setStatus({ kind: "error", message: "Lost connection to signaling server." });
        } else {
          // Non-fatal (e.g. peer-unavailable from disconnect) — ignore
        }
      });

      return () => {
        try { peer.destroy(); } catch (e) {}
        peerRef.current = null;
        connsRef.current.clear();
      };
    }

    if (mode.kind === "client") {
      setStatus({ kind: "connecting", message: "Joining room…" });
      const peer = new Peer(deviceId, { debug: 0 });
      peerRef.current = peer;

      peer.on("open", () => {
        const conn = peer.connect(PEER_PREFIX + mode.code, { reliable: true });
        connsRef.current.set("host", conn);

        const timeout = setTimeout(() => {
          if (status.kind === "connecting" || status.kind === "idle") {
            setStatus({ kind: "error", message: `Room "${mode.code}" not found.` });
          }
        }, 8000);

        conn.on("open", () => {
          clearTimeout(timeout);
          setStatus({ kind: "ready", message: "" });
          // Identify ourselves
          try { conn.send({ type: "action", action: { type: "join", name: displayName || "Player" } }); } catch (e) {}
        });
        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "state") setState(msg.state);
        });
        conn.on("close", () => {
          setStatus({ kind: "error", message: "Host left the party." });
        });
        conn.on("error", () => {});
      });

      peer.on("error", (err) => {
        const code = err && err.type;
        if (code === "peer-unavailable") {
          setStatus({ kind: "error", message: `Room "${mode.code}" not found.` });
        } else if (code === "network" || code === "server-error") {
          setStatus({ kind: "error", message: "Connection failed. Check your network." });
        }
      });

      return () => {
        try { peer.destroy(); } catch (e) {}
        peerRef.current = null;
        connsRef.current.clear();
      };
    }
  }, [mode.kind, mode.code, hostApply, deviceId]);

  // dispatch: host applies directly; client sends to host
  const dispatch = useCallback((action) => {
    if (mode.kind === "host") {
      hostApply({ ...action, deviceId: action.deviceId || deviceId });
    } else if (mode.kind === "client") {
      const conn = connsRef.current.get("host");
      if (conn && conn.open) {
        try { conn.send({ type: "action", action }); } catch (e) {}
      }
    }
  }, [mode.kind, hostApply, deviceId]);

  return {
    deviceId,
    state,
    dispatch,
    status,
    isHost: mode.kind === "host",
  };
}

// ---------------- Blitz Mode (separate session + reducer) ----------------

const BLITZ_PEER_PREFIX = "blitz-mode-v1-";
const SOLO_PEER_PREFIX = BLITZ_PEER_PREFIX;

function hashStringToSeed(str) {
  // FNV-1a 32-bit
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deezerJsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "__dz_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let done = false;
    const cleanup = () => {
      done = true;
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      script.remove();
    };
    window[cb] = (data) => { if (done) return; cleanup(); resolve(data); };
    script.onerror = () => { if (done) return; cleanup(); reject(new Error("network")); };
    setTimeout(() => { if (done) return; cleanup(); reject(new Error("timeout")); }, 9000);
    script.src = `${url}${url.includes("?") ? "&" : "?"}output=jsonp&callback=${cb}`;
    document.head.appendChild(script);
  });
}

async function fetchDeezerChartTracks() {
  const PAGE_SIZE = 50;
  const PAGE_COUNT = 6;
  const pages = await Promise.all(
    Array.from({ length: PAGE_COUNT }, (_, i) =>
      deezerJsonp(`https://api.deezer.com/chart/0/tracks?limit=${PAGE_SIZE}&index=${i * PAGE_SIZE}`)
        .catch(() => null)
    )
  );
  const seen = new Set();
  const tracks = [];
  for (const res of pages) {
    const raw = (res && res.data) ? res.data : [];
    for (const t of raw) {
      if (!t || !t.id) continue;
      const deezerId = String(t.id);
      if (seen.has(deezerId)) continue;
      seen.add(deezerId);
      const title = String(t.title_short || t.title || "").trim();
      const artist = (t.artist && t.artist.name) ? String(t.artist.name).trim() : "Unknown artist";
      const preview = t.preview ? String(t.preview) : null;
      if (!title) continue;
      tracks.push({
        deezerId,
        title,
        artist,
        cover: (t.album && (t.album.cover_small || t.album.cover_medium || t.album.cover)) || null,
        preview,
      });
    }
  }
  return tracks;
}

function blitzInitialState() {
  return {
    phase: "lobby", // lobby | round | results | final
    coordinatorDeviceId: null,
    players: [], // [{deviceId,name,online}]
    scores: {}, // { [deviceId]: number }
    roundIdx: 0,
    roundCount: 3,
    seed: 0,
    chartTracks: null, // [{deezerId,title,artist,cover,preview}]
    joinWindowEndsAtMs: null,
    startVotes: {}, // { [deviceId]: true }
    replayVotes: {}, // { [deviceId]: true } — final screen only
    round: null, // { startedAtMs, endsAtMs, correctId, choiceIds: string[] }
    answers: {}, // { [roundIdx]: { [deviceId]: { choiceId, answeredAtMs, points, correct } } }
    lastRoundDeltas: {}, // { [deviceId]: { points, correct } }
  };
}

const BLITZ_JOIN_WINDOW_MS = 30000;
const BLITZ_MIN_PLAYERS = 2;
const BLITZ_MAX_PLAYERS = 5;
const BLITZ_MATCH_PROBE_MS = 4500;

function blitzOnlinePlayers(state) {
  return (state.players || []).filter(p => p.online !== false);
}

function blitzCanJoinLobby(state, nowMs) {
  if (state.phase !== "lobby") return false;
  if (state.players.length >= BLITZ_MAX_PLAYERS) return false;
  if (state.players.length < BLITZ_MIN_PLAYERS) return true;
  if (!state.joinWindowEndsAtMs) return true;
  return nowMs <= state.joinWindowEndsAtMs;
}

function blitzBuildStartRoundState(state, startedAtMs) {
  if (!state.chartTracks || state.chartTracks.length < 8) return null;
  const built = buildRoundFromSeed({
    seed: state.seed,
    roundIdx: state.roundIdx,
    tracks: state.chartTracks,
  });
  if (!built) return null;
  const { correctId, choiceIds } = built;
  const endsAtMs = startedAtMs + 30000;
  return {
    ...state,
    phase: "round",
    round: { startedAtMs, endsAtMs, correctId, choiceIds },
    lastRoundDeltas: {},
    startVotes: {},
    replayVotes: {},
  };
}

function blitzTryStartFromVotes(state, startedAtMs) {
  if (state.phase !== "lobby") return null;
  const online = blitzOnlinePlayers(state);
  if (online.length < BLITZ_MIN_PLAYERS) return null;
  const allVoted = online.every(p => state.startVotes[p.deviceId]);
  if (!allVoted) return null;
  return blitzBuildStartRoundState(state, startedAtMs);
}

function blitzTryReplayFromVotes(state, startedAtMs, seed) {
  if (state.phase !== "final") return null;
  const online = blitzOnlinePlayers(state);
  if (online.length < 1) return null;
  const allVoted = online.every(p => state.replayVotes[p.deviceId]);
  if (!allVoted) return null;
  const cleared = Object.fromEntries(state.players.map(p => [p.deviceId, 0]));
  const reset = {
    ...blitzInitialState(),
    coordinatorDeviceId: state.coordinatorDeviceId,
    players: state.players,
    scores: cleared,
    roundCount: state.roundCount,
    seed,
    chartTracks: state.chartTracks,
    joinWindowEndsAtMs: null,
  };
  return blitzBuildStartRoundState(reset, startedAtMs);
}

function pointsForMs(elapsedMs) {
  const t = Math.max(0, Math.min(30000, elapsedMs));
  const raw = 1000 - (t / 30000) * 900;
  return Math.max(100, Math.round(raw));
}

function buildRoundFromSeed({ seed, roundIdx, tracks }) {
  const rng = mulberry32((seed + roundIdx * 1013904223) >>> 0);
  const usable = tracks.filter(t => t && t.preview);
  const pool = usable.length >= 4 ? usable : tracks.filter(Boolean);
  if (pool.length < 4) return null;
  const ids = pool.map(t => t.deezerId);
  const shuffled = shuffleWithRng(ids, rng);
  const correctId = shuffled[0];
  const wrong = shuffled.slice(1, 4);
  const choiceIds = shuffleWithRng([correctId, ...wrong], rng);
  return { correctId, choiceIds };
}

function blitzReducer(state, action) {
  switch (action.type) {
    case "join": {
      if (state.phase !== "lobby") return state;
      const { deviceId, name } = action;
      const nowMs = action.nowMs || Date.now();
      const existing = state.players.find(p => p.deviceId === deviceId);
      if (existing) {
        return {
          ...state,
          players: state.players.map(p => p.deviceId === deviceId ? { ...p, name: name || p.name, online: true } : p),
        };
      }
      if (!blitzCanJoinLobby(state, nowMs)) return state;
      const nextPlayers = [...state.players, { deviceId, name, online: true }];
      let joinWindowEndsAtMs = state.joinWindowEndsAtMs;
      if (nextPlayers.length === BLITZ_MIN_PLAYERS && !joinWindowEndsAtMs) {
        joinWindowEndsAtMs = nowMs + BLITZ_JOIN_WINDOW_MS;
      }
      return {
        ...state,
        players: nextPlayers,
        scores: { ...state.scores, [deviceId]: 0 },
        startVotes: {},
        joinWindowEndsAtMs,
      };
    }
    case "setOnline": {
      return {
        ...state,
        players: state.players.map(p => p.deviceId === action.deviceId ? { ...p, online: action.online } : p),
      };
    }
    case "leave": {
      if (state.phase !== "lobby") return state;
      const { deviceId } = action;
      if (!deviceId || deviceId === state.coordinatorDeviceId) return state;
      const nextPlayers = state.players.filter(p => p.deviceId !== deviceId);
      let joinWindowEndsAtMs = state.joinWindowEndsAtMs;
      if (nextPlayers.length < BLITZ_MIN_PLAYERS) joinWindowEndsAtMs = null;
      return {
        ...state,
        players: nextPlayers,
        scores: Object.fromEntries(Object.entries(state.scores).filter(([id]) => id !== deviceId)),
        startVotes: Object.fromEntries(Object.entries(state.startVotes).filter(([id]) => id !== deviceId)),
        joinWindowEndsAtMs,
      };
    }
    case "init": {
      if (state.phase !== "lobby") return state;
      return {
        ...state,
        coordinatorDeviceId: action.coordinatorDeviceId || state.coordinatorDeviceId,
        roundCount: action.roundCount,
        seed: action.seed,
      };
    }
    case "setChart": {
      if (state.phase !== "lobby") return state;
      const withChart = { ...state, chartTracks: action.tracks };
      const started = blitzTryStartFromVotes(withChart, action.startedAtMs || Date.now() + 1500);
      return started || withChart;
    }
    case "voteStart": {
      if (state.phase !== "lobby") return state;
      const { deviceId, voted } = action;
      const online = blitzOnlinePlayers(state);
      if (online.length < BLITZ_MIN_PLAYERS) return state;
      if (!online.some(p => p.deviceId === deviceId)) return state;
      const nextVotes = { ...state.startVotes };
      if (voted) nextVotes[deviceId] = true;
      else delete nextVotes[deviceId];
      const withVotes = { ...state, startVotes: nextVotes };
      const started = blitzTryStartFromVotes(withVotes, action.startedAtMs || Date.now() + 1500);
      return started || withVotes;
    }
    case "voteReplay": {
      if (state.phase !== "final") return state;
      const { deviceId, voted } = action;
      const online = blitzOnlinePlayers(state);
      if (!online.some(p => p.deviceId === deviceId)) return state;
      const nextVotes = { ...state.replayVotes };
      if (voted) nextVotes[deviceId] = true;
      else delete nextVotes[deviceId];
      const withVotes = { ...state, replayVotes: nextVotes };
      const seed = action.seed || ((Math.random() * 0xffffffff) >>> 0);
      const started = blitzTryReplayFromVotes(withVotes, action.startedAtMs || Date.now() + 1800, seed);
      return started || withVotes;
    }
    case "startRound": {
      if (state.phase !== "lobby" && state.phase !== "results") return state;
      const started = blitzBuildStartRoundState(state, action.startedAtMs);
      return started || state;
    }
    case "submitAnswer": {
      if (state.phase !== "round" || !state.round) return state;
      const { deviceId, choiceId, answeredAtMs } = action;
      const existing = (state.answers[state.roundIdx] && state.answers[state.roundIdx][deviceId]) || null;
      if (existing) return state;
      const elapsed = answeredAtMs - state.round.startedAtMs;
      const correct = choiceId === state.round.correctId;
      const points = correct ? pointsForMs(elapsed) : 0;
      const byRound = state.answers[state.roundIdx] || {};
      const nextAnswersForRound = {
        ...byRound,
        [deviceId]: { choiceId, answeredAtMs, points, correct },
      };
      const nextAnswers = { ...state.answers, [state.roundIdx]: nextAnswersForRound };
      const nextScores = { ...state.scores, [deviceId]: (state.scores[deviceId] || 0) + points };
      const nextDeltas = { ...state.lastRoundDeltas, [deviceId]: { points, correct } };
      return { ...state, answers: nextAnswers, scores: nextScores, lastRoundDeltas: nextDeltas };
    }
    case "revealRound": {
      if (state.phase !== "round") return state;
      return { ...state, phase: "results" };
    }
    case "nextRound": {
      if (state.phase !== "results") return state;
      if (state.roundIdx + 1 >= state.roundCount) {
        return { ...state, phase: "final" };
      }
      return {
        ...state,
        roundIdx: state.roundIdx + 1,
        phase: "results",
        round: null,
        lastRoundDeltas: {},
      };
    }
    case "resetGame": {
      const cleared = Object.fromEntries(state.players.map(p => [p.deviceId, 0]));
      return {
        ...blitzInitialState(),
        coordinatorDeviceId: state.coordinatorDeviceId,
        players: state.players,
        scores: cleared,
        roundCount: state.roundCount,
        seed: action.seed,
        chartTracks: state.chartTracks,
      };
    }
    default:
      return state;
  }
}

// mode: { roomId, roundCount, seed }
function useBlitzSession(mode, displayName) {
  const myDeviceId = useRef(newDeviceId()).current;
  const [state, setState] = useState(blitzInitialState);
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const peerRef = useRef(null);
  const connsRef = useRef(new Map()); // host: peerId->conn ; client: "host"->conn
  const stateRef = useRef(state);
  stateRef.current = state;

  const coordApply = useCallback((action) => {
    setState(prev => {
      const next = blitzReducer(prev, action);
      connsRef.current.forEach(conn => {
        try { conn.send({ type: "state", state: next }); } catch (e) {}
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof Peer === "undefined") {
      setStatus({ kind: "error", message: "Network library failed to load." });
      return () => {};
    }

    const roomPeerId = BLITZ_PEER_PREFIX + mode.roomId;
    setStatus({ kind: "connecting", message: "Finding match…" });

    let disposed = false;

    const teardownPeer = () => {
      try { peerRef.current && peerRef.current.destroy(); } catch (e) {}
      peerRef.current = null;
      connsRef.current.clear();
    };

    const wireClientConnection = (clientPeer, conn) => {
      peerRef.current = clientPeer;
      connsRef.current.set("host", conn);
      const failTimeout = setTimeout(() => {
        if (!disposed) setStatus({ kind: "error", message: "Matchmaking failed. Try again." });
      }, 9000);
      conn.on("open", () => {
        clearTimeout(failTimeout);
        if (disposed) return;
        setStatus({ kind: "ready", message: "" });
        try {
          conn.send({
            type: "action",
            action: { type: "join", deviceId: myDeviceId, name: displayName || "Player", nowMs: Date.now() },
          });
        } catch (e) {}
      });
      conn.on("data", (msg) => {
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "joinRejected") {
          setStatus({ kind: "error", message: msg.message || "Could not join this room." });
          return;
        }
        if (msg.type === "state") setState(msg.state);
      });
      conn.on("close", () => {
        if (!disposed) setStatus({ kind: "error", message: "Room closed." });
      });
      conn.on("error", () => {});
    };

    const wireHostPeer = (hostPeer, onHostOpen) => {
      peerRef.current = hostPeer;

      hostPeer.on("open", async () => {
        if (disposed) return;
        if (onHostOpen) onHostOpen();
        setStatus({ kind: "ready", message: "" });
        const nowMs = Date.now();
        coordApply({ type: "join", deviceId: myDeviceId, name: displayName || "Player", nowMs });
        coordApply({
          type: "init",
          coordinatorDeviceId: myDeviceId,
          roundCount: mode.roundCount,
          seed: mode.seed,
        });
        try {
          const tracks = await fetchDeezerChartTracks();
          if (!disposed) coordApply({ type: "setChart", tracks });
        } catch (e) {}
      });

      hostPeer.on("connection", (conn) => {
        conn.on("open", () => {
          connsRef.current.set(conn.peer, conn);
          try { conn.send({ type: "state", state: stateRef.current }); } catch (e) {}
        });
        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "action") {
            const action = msg.action;
            if (action && action.type === "join") {
              const nowMs = action.nowMs || Date.now();
              if (!blitzCanJoinLobby(stateRef.current, nowMs)) {
                try {
                  conn.send({
                    type: "joinRejected",
                    message: stateRef.current.players.length >= BLITZ_MAX_PLAYERS
                      ? "This room is full."
                      : "The join window for this room has closed.",
                  });
                } catch (e) {}
                return;
              }
            }
            coordApply({ ...action, deviceId: action.deviceId || conn.peer });
          }
        });
        conn.on("close", () => {
          connsRef.current.delete(conn.peer);
          if (stateRef.current.phase === "lobby") {
            coordApply({ type: "leave", deviceId: conn.peer });
          } else {
            coordApply({ type: "setOnline", deviceId: conn.peer, online: false });
          }
        });
        conn.on("error", () => {});
      });
    };

    const tryJoinExistingRoom = () => new Promise((resolve) => {
      if (disposed) {
        resolve(false);
        return;
      }
      const clientPeer = new Peer(myDeviceId, { debug: 0 });
      let settled = false;
      const finish = (joined) => {
        if (settled) return;
        settled = true;
        resolve(joined);
      };

      const abortClient = () => {
        teardownPeer();
        finish(false);
      };

      clientPeer.on("error", () => abortClient());

      clientPeer.on("open", () => {
        if (disposed) {
          try { clientPeer.destroy(); } catch (e) {}
          finish(false);
          return;
        }
        const conn = clientPeer.connect(roomPeerId, { reliable: true });
        const probeTimeout = setTimeout(() => {
          try { conn.close(); } catch (e) {}
          try { clientPeer.destroy(); } catch (e) {}
          peerRef.current = null;
          connsRef.current.clear();
          finish(false);
        }, BLITZ_MATCH_PROBE_MS);

        conn.on("open", () => {
          clearTimeout(probeTimeout);
          wireClientConnection(clientPeer, conn);
          finish(true);
        });
        conn.on("error", () => {
          clearTimeout(probeTimeout);
          abortClient();
        });
      });
    });

    const tryOpenRoom = () => new Promise((resolve) => {
      if (disposed) {
        resolve("failed");
        return;
      }
      const hostPeer = new Peer(roomPeerId, { debug: 0 });
      wireHostPeer(hostPeer, () => resolve("hosting"));

      hostPeer.on("error", (err) => {
        teardownPeer();
        if (err && err.type === "unavailable-id") {
          resolve("room-taken");
          return;
        }
        if (!disposed) setStatus({ kind: "error", message: "Matchmaking failed. Try again." });
        resolve("failed");
      });
    });

    (async () => {
      const joinedExisting = await tryJoinExistingRoom();
      if (disposed) return;
      if (joinedExisting) return;

      const hostResult = await tryOpenRoom();
      if (disposed) return;
      if (hostResult === "room-taken") {
        const joinedAfterRace = await tryJoinExistingRoom();
        if (disposed) return;
        if (!joinedAfterRace) {
          setStatus({ kind: "error", message: "Matchmaking failed. Try again." });
        }
        return;
      }
      if (hostResult === "failed" || hostResult === "hosting") return;
    })();

    return () => {
      disposed = true;
      teardownPeer();
    };
  }, [mode.roomId, mode.roundCount, mode.seed, coordApply, displayName, myDeviceId]);

  const dispatch = useCallback((action) => {
    const isCoordinator = state.coordinatorDeviceId === myDeviceId;
    if (isCoordinator) {
      coordApply({ ...action, deviceId: action.deviceId || myDeviceId });
      return;
    }
    const conn = connsRef.current.get("host");
    if (conn && conn.open) {
      try { conn.send({ type: "action", action }); } catch (e) {}
    }
  }, [coordApply, myDeviceId, state.coordinatorDeviceId]);

  return {
    deviceId: myDeviceId,
    state,
    dispatch,
    status,
    isCoordinator: state.coordinatorDeviceId === myDeviceId,
  };
}

Object.assign(window, {
  useSession,
  useBlitzSession,
  useSoloSession: useBlitzSession,
  getDeviceId,
  newDeviceId,
  PEER_PREFIX,
  BLITZ_PEER_PREFIX,
  SOLO_PEER_PREFIX: BLITZ_PEER_PREFIX,
});
