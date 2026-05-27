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

// ---------------- Solo Showdown (separate session + reducer) ----------------

const SOLO_PEER_PREFIX = "solo-showdown-v1-";

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
  const res = await deezerJsonp("https://api.deezer.com/chart/0/tracks");
  const raw = (res && res.data) ? res.data : [];
  return raw
    .map((t) => {
      if (!t || !t.id) return null;
      const title = String(t.title_short || t.title || "").trim();
      const artist = (t.artist && t.artist.name) ? String(t.artist.name).trim() : "Unknown artist";
      const preview = t.preview ? String(t.preview) : null;
      if (!title) return null;
      return {
        deezerId: String(t.id),
        title,
        artist,
        cover: (t.album && (t.album.cover_small || t.album.cover_medium || t.album.cover)) || null,
        preview,
      };
    })
    .filter(Boolean);
}

function soloInitialState() {
  return {
    phase: "lobby", // lobby | round | results | final
    hostDeviceId: null,
    players: [], // [{deviceId,name,online}]
    scores: {}, // { [deviceId]: number }
    roundIdx: 0,
    roundCount: 3,
    seed: 0,
    chartTracks: null, // [{deezerId,title,artist,cover,preview}]
    round: null, // { startedAtMs, endsAtMs, correctId, choiceIds: string[] }
    answers: {}, // { [roundIdx]: { [deviceId]: { choiceId, answeredAtMs, points, correct } } }
    lastRoundDeltas: {}, // { [deviceId]: { points, correct } }
  };
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

function soloReducer(state, action) {
  switch (action.type) {
    case "join": {
      if (state.phase !== "lobby") return state;
      const { deviceId, name } = action;
      const existing = state.players.find(p => p.deviceId === deviceId);
      if (existing) {
        return {
          ...state,
          players: state.players.map(p => p.deviceId === deviceId ? { ...p, name: name || p.name, online: true } : p),
        };
      }
      if (state.players.length >= 5) return state;
      return {
        ...state,
        players: [...state.players, { deviceId, name, online: true }],
        scores: { ...state.scores, [deviceId]: 0 },
      };
    }
    case "setOnline": {
      return {
        ...state,
        players: state.players.map(p => p.deviceId === action.deviceId ? { ...p, online: action.online } : p),
      };
    }
    case "init": {
      if (state.phase !== "lobby") return state;
      return {
        ...state,
        hostDeviceId: action.hostDeviceId || state.hostDeviceId,
        roundCount: action.roundCount,
        seed: action.seed,
      };
    }
    case "setChart": {
      if (state.phase !== "lobby") return state;
      return { ...state, chartTracks: action.tracks };
    }
    case "startRound": {
      if (state.phase !== "lobby" && state.phase !== "results") return state;
      if (!state.chartTracks || state.chartTracks.length < 8) return state;
      const built = buildRoundFromSeed({
        seed: state.seed,
        roundIdx: state.roundIdx,
        tracks: state.chartTracks,
      });
      if (!built) return state;
      const { correctId, choiceIds } = built;
      const startedAtMs = action.startedAtMs;
      const endsAtMs = startedAtMs + 30000;
      return {
        ...state,
        phase: "round",
        round: { startedAtMs, endsAtMs, correctId, choiceIds },
        lastRoundDeltas: {},
      };
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
      // Keep lobby + players, reset scores/rounds (host can do this)
      const cleared = Object.fromEntries(state.players.map(p => [p.deviceId, 0]));
      return {
        ...soloInitialState(),
        hostDeviceId: state.hostDeviceId,
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
function useSoloSession(mode, displayName) {
  const myDeviceId = useRef(newDeviceId()).current;
  const [state, setState] = useState(soloInitialState);
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const peerRef = useRef(null);
  const connsRef = useRef(new Map()); // host: peerId->conn ; client: "host"->conn
  const stateRef = useRef(state);
  stateRef.current = state;

  const hostApply = useCallback((action) => {
    setState(prev => {
      const next = soloReducer(prev, action);
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

    const roomPeerId = SOLO_PEER_PREFIX + mode.roomId;
    setStatus({ kind: "connecting", message: "Finding match…" });

    const hostPeer = new Peer(roomPeerId, { debug: 0 });
    peerRef.current = hostPeer;

    const becomeClient = () => {
      try { hostPeer.destroy(); } catch (e) {}
      const clientPeer = new Peer(myDeviceId, { debug: 0 });
      peerRef.current = clientPeer;
      clientPeer.on("open", () => {
        const conn = clientPeer.connect(roomPeerId, { reliable: true });
        connsRef.current.set("host", conn);
        const timeout = setTimeout(() => {
          setStatus({ kind: "error", message: "Matchmaking failed. Try again." });
        }, 9000);
        conn.on("open", () => {
          clearTimeout(timeout);
          setStatus({ kind: "ready", message: "" });
          try { conn.send({ type: "action", action: { type: "join", name: displayName || "Player" } }); } catch (e) {}
        });
        conn.on("data", (msg) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "state") setState(msg.state);
        });
        conn.on("close", () => setStatus({ kind: "error", message: "Match ended — host left." }));
        conn.on("error", () => {});
      });
      clientPeer.on("error", () => setStatus({ kind: "error", message: "Connection failed. Try again." }));
    };

    hostPeer.on("open", async () => {
      setStatus({ kind: "ready", message: "" });
      hostApply({ type: "join", deviceId: myDeviceId, name: displayName || "Host" });
      hostApply({
        type: "init",
        hostDeviceId: myDeviceId,
        roundCount: mode.roundCount,
        seed: mode.seed,
      });
      try {
        const tracks = await fetchDeezerChartTracks();
        hostApply({ type: "setChart", tracks });
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
          hostApply({ ...msg.action, deviceId: conn.peer });
        }
      });
      conn.on("close", () => {
        connsRef.current.delete(conn.peer);
        hostApply({ type: "setOnline", deviceId: conn.peer, online: false });
      });
      conn.on("error", () => {});
    });

    hostPeer.on("error", (err) => {
      if (err && err.type === "unavailable-id") {
        becomeClient();
        return;
      }
      setStatus({ kind: "error", message: "Matchmaking failed. Try again." });
    });

    return () => {
      try { peerRef.current && peerRef.current.destroy(); } catch (e) {}
      peerRef.current = null;
      connsRef.current.clear();
    };
  }, [mode.roomId, mode.roundCount, mode.seed, hostApply, displayName, myDeviceId]);

  const dispatch = useCallback((action) => {
    const isHost = state.hostDeviceId === myDeviceId;
    if (isHost) {
      hostApply({ ...action, deviceId: action.deviceId || myDeviceId });
      return;
    }
    const conn = connsRef.current.get("host");
    if (conn && conn.open) {
      try { conn.send({ type: "action", action }); } catch (e) {}
    }
  }, [hostApply, myDeviceId, state.hostDeviceId]);

  return {
    deviceId: myDeviceId,
    state,
    dispatch,
    status,
    isHost: state.hostDeviceId === myDeviceId,
  };
}

Object.assign(window, {
  useSession,
  useSoloSession,
  getDeviceId,
  newDeviceId,
  PEER_PREFIX,
  SOLO_PEER_PREFIX,
});
