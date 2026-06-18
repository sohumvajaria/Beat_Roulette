// Beat Roulette, multiplayer via PartyKit (authoritative server).
// Frontend stays on GitHub Pages; deploy the PartyKit server separately:
//   npx partykit deploy
// Then paste your deployed host below.

// TODO: Replace with your deployed PartyKit host (e.g. beat-roulette.YOUR_USER.partykit.dev)
const PARTYKIT_HOST = "beat-roulette.sohumvajaria.partykit.dev";

const { useState, useEffect, useRef, useCallback } = React;

function newDeviceId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "dev_" + window.crypto.randomUUID();
    }
  } catch (e) {}
  return "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getDeviceId(role) {
  if (role === "host") {
    let id = null;
    try { id = sessionStorage.getItem("br_device_id"); } catch (e) {}
    if (!id) {
      id = newDeviceId();
      try { sessionStorage.setItem("br_device_id", id); } catch (e) {}
    }
    return id;
  }
  return newDeviceId();
}

function partyInitialState() {
  return {
    phase: "lobby",
    hostDeviceId: null,
    players: [],
    songs: [],
    order: [],
    roundIdx: 0,
    guesses: {},
    guessTimes: {},
    roundStartedAt: 0,
    scores: {},
    scoreDeltas: {},
    streaks: {},
    fastestCorrect: null,
    songsPerPlayer: null,
    reactions: [],
    reactionSeq: 0,
  };
}

function blitzClientInitialState() {
  return {
    phase: "lobby",
    coordinatorDeviceId: null,
    players: [],
    scores: {},
    roundIdx: 0,
    roundCount: 3,
    seed: 0,
    chartTracks: null,
    joinWindowEndsAtMs: null,
    startVotes: {},
    replayVotes: {},
    round: null,
    answers: {},
    lastRoundDeltas: {},
  };
}

function isFirstPlayer(state, deviceId) {
  const players = state && state.players;
  return !!(players && players.length > 0 && players[0].deviceId === deviceId);
}

function waitForPartySocket() {
  return new Promise((resolve, reject) => {
    if (window.PartySocket) {
      resolve(window.PartySocket);
      return;
    }
    const onReady = () => {
      window.removeEventListener("partysocket-ready", onReady);
      if (window.PartySocket) resolve(window.PartySocket);
      else reject(new Error("PartySocket missing"));
    };
    window.addEventListener("partysocket-ready", onReady);
    setTimeout(() => {
      window.removeEventListener("partysocket-ready", onReady);
      if (window.PartySocket) resolve(window.PartySocket);
      else reject(new Error("PartySocket load timeout"));
    }, 12000);
  });
}

function usePartySocketRoom({ room, enabled, onMessage, onOpen, onClose, onError }) {
  const socketRef = useRef(null);
  const handlersRef = useRef({ onMessage, onOpen, onClose, onError });
  handlersRef.current = { onMessage, onOpen, onClose, onError };

  useEffect(() => {
    if (!enabled) return () => {};
    let disposed = false;
    let socket = null;

    (async () => {
      try {
        const PartySocket = await waitForPartySocket();
        if (disposed) return;

        socket = new PartySocket({ host: PARTYKIT_HOST, room });
        socketRef.current = socket;

        socket.addEventListener("open", () => {
          if (!disposed) handlersRef.current.onOpen && handlersRef.current.onOpen(socket);
        });
        socket.addEventListener("message", (ev) => {
          if (!disposed) handlersRef.current.onMessage && handlersRef.current.onMessage(ev, socket);
        });
        socket.addEventListener("close", () => {
          if (!disposed) handlersRef.current.onClose && handlersRef.current.onClose();
        });
        socket.addEventListener("error", () => {
          if (!disposed) handlersRef.current.onError && handlersRef.current.onError();
        });
      } catch (e) {
        if (!disposed) handlersRef.current.onError && handlersRef.current.onError(e);
      }
    })();

    return () => {
      disposed = true;
      try { socket && socket.close(); } catch (e) {}
      socketRef.current = null;
    };
  }, [room, enabled]);

  const send = useCallback((payload) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === 1) {
      try { socket.send(JSON.stringify(payload)); } catch (e) {}
    }
  }, []);

  return { send, socketRef };
}

// mode: { kind: "local" | "host", code, songsPerPlayer? } | { kind: "client", code }
function useSession(mode, displayName) {
  const deviceId = useRef(getDeviceId(mode.kind)).current;
  const [state, setState] = useState(partyInitialState);
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const joinedRef = useRef(false);

  const { send } = usePartySocketRoom({
    room: mode.code,
    enabled: mode.kind !== "local",
    onOpen: (socket) => {
      setStatus({ kind: "connecting", message: mode.kind === "host" ? "Opening room…" : "Joining room…" });
      const hello = {
        type: "hello",
        deviceId,
        name: displayName || (mode.kind === "host" ? "Host" : "Player"),
      };
      if (mode.kind === "host") {
        const rounds = mode.songsPerPlayer;
        if (rounds >= 1 && rounds <= 5) hello.songsPerPlayer = rounds;
      }
      try { socket.send(JSON.stringify(hello)); } catch (e) {}
    },
    onMessage: (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type === "state" && msg.state) {
        setState(msg.state);
        if (!joinedRef.current && msg.state.players.some(p => p.deviceId === deviceId)) {
          joinedRef.current = true;
          setStatus({ kind: "ready", message: "" });
        }
      }
    },
    onClose: () => {
      if (joinedRef.current) {
        setStatus({ kind: "error", message: "Disconnected from the party." });
      }
    },
    onError: (err) => {
      setStatus({
        kind: "error",
        message: err && err.message === "PartySocket load timeout"
          ? "Network library failed to load."
          : "Connection failed. Check your network.",
      });
    },
  });

  useEffect(() => {
    if (mode.kind === "local") {
      joinedRef.current = true;
      setStatus({ kind: "ready", message: "" });
      return;
    }
    const t = setTimeout(() => {
      if (!joinedRef.current) {
        setStatus({
          kind: "error",
          message: mode.kind === "host"
            ? "Could not open room. Check PartyKit host config."
            : `Room "${mode.code}" not found.`,
        });
      }
    }, 10000);
    return () => clearTimeout(t);
  }, [mode.kind, mode.code]);

  const dispatch = useCallback((action) => {
    if (mode.kind === "local") return;
    send({ type: "action", action });
  }, [mode.kind, send]);

  const isHost = isFirstPlayer(state, deviceId);

  if (mode.kind === "local") {
    return {
      deviceId,
      state,
      dispatch: () => {},
      status: { kind: "ready", message: "" },
      isHost: true,
    };
  }

  return { deviceId, state, dispatch, status, isHost };
}

// mode: { roomId, roundCount, seed }
function useBlitzSession(mode, displayName) {
  const myDeviceId = useRef(newDeviceId()).current;
  const [state, setState] = useState(blitzClientInitialState);
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const joinedRef = useRef(false);

  const { send } = usePartySocketRoom({
    room: mode.roomId,
    enabled: true,
    onOpen: (socket) => {
      setStatus({ kind: "connecting", message: "Finding match…" });
      try {
        socket.send(JSON.stringify({
          type: "hello",
          deviceId: myDeviceId,
          name: displayName || "Player",
        }));
      } catch (e) {}
    },
    onMessage: (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type === "joinRejected") {
        setStatus({ kind: "error", message: msg.message || "Could not join this room." });
        return;
      }
      if (msg.type === "state" && msg.state) {
        setState(msg.state);
        if (!joinedRef.current && msg.state.players.some(p => p.deviceId === myDeviceId)) {
          joinedRef.current = true;
          setStatus({ kind: "ready", message: "" });
        }
      }
    },
    onClose: () => {
      if (joinedRef.current) {
        setStatus({ kind: "error", message: "Room closed." });
      }
    },
    onError: (err) => {
      setStatus({
        kind: "error",
        message: err && err.message === "PartySocket load timeout"
          ? "Network library failed to load."
          : "Matchmaking failed. Try again.",
      });
    },
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (!joinedRef.current) {
        setStatus({ kind: "error", message: "Matchmaking failed. Try again." });
      }
    }, 12000);
    return () => clearTimeout(t);
  }, [mode.roomId]);

  const dispatch = useCallback((action) => {
    send({ type: "action", action });
  }, [send]);

  const isCoordinator = isFirstPlayer(state, myDeviceId);

  return {
    deviceId: myDeviceId,
    state,
    dispatch,
    status,
    isCoordinator,
  };
}

Object.assign(window, {
  useSession,
  useBlitzSession,
  useSoloSession: useBlitzSession,
  getDeviceId,
  newDeviceId,
});
