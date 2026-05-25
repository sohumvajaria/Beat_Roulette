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
  if (role === "host" || role === "local") {
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
    localPassAround: false,  // single-device: sequential votes, owner guesses, no speed bonus
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
      if (state.localPassAround && state.players.length > 0) return state;
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
        if (state.players.length < 3) return state;
        const allReady = state.players.every(p =>
          state.songs.filter(s => s.ownerDeviceId === p.deviceId).length >= state.songsPerPlayer
        );
        if (!allReady) return state;
      } else if (state.localPassAround) {
        if (state.players.length < 3) return state;
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
      const ownerPicksSelf = deviceId === song.ownerDeviceId && targetDeviceId === deviceId;
      if (deviceId === targetDeviceId && !ownerPicksSelf) return state;
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

      let fastest = null;
      if (!state.localPassAround) {
        let fastestT = Infinity;
        for (const g of guessers) {
          if (state.guesses[g] === song.ownerDeviceId) {
            const t = state.guessTimes[g];
            if (t != null && t < fastestT) { fastestT = t; fastest = g; }
          }
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
          if (!state.localPassAround && g === fastest) delta += 1;
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
        localPassAround: state.localPassAround,
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
    if (mode.kind === "local") {
      setStatus({ kind: "ready", message: "" });
      // Local mode: no auto-seed. Players are added one at a time via the
      // turn-based local lobby. We still mark this device as "host" so
      // start/reveal/next buttons render.
      setState(s => ({ ...s, hostDeviceId: deviceId, localPassAround: true }));
      return () => {};
    }

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
    if (mode.kind === "local" || mode.kind === "host") {
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
    isHost: mode.kind === "host" || mode.kind === "local",
  };
}

Object.assign(window, { useSession, getDeviceId, newDeviceId, PEER_PREFIX });
