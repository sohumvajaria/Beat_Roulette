import type * as Party from "partykit/server";

// ---------- Party reducer ----------
function initialState() {
  return {
    phase: "lobby" as const,
    hostDeviceId: null as string | null,
    players: [] as { deviceId: string; name: string; online: boolean }[],
    songs: [] as {
      id: string;
      ownerDeviceId: string;
      ownerName: string;
      title: string;
      artist: string;
      url: string | null;
      cover: string | null;
      noPreview: boolean;
    }[],
    order: [] as string[],
    roundIdx: 0,
    guesses: {} as Record<string, string>,
    guessTimes: {} as Record<string, number>,
    roundStartedAt: 0,
    scores: {} as Record<string, number>,
    scoreDeltas: {} as Record<string, number>,
    streaks: {} as Record<string, number>,
    fastestCorrect: null as string | null,
    songsPerPlayer: null as number | null,
    reactions: [] as { id: number; reactionId: string; deviceId: string; name: string; atMs: number }[],
    reactionSeq: 0,
  };
}

type PartyState = ReturnType<typeof initialState>;

function shuffleArr(arr: string[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reducer(state: PartyState, action: Record<string, unknown>): PartyState {
  switch (action.type) {
    case "join": {
      const deviceId = action.deviceId as string;
      const name = action.name as string;
      const existing = state.players.find((p) => p.deviceId === deviceId);
      if (existing) {
        return {
          ...state,
          players: state.players.map((p) =>
            p.deviceId === deviceId ? { ...p, name: name || p.name, online: true } : p
          ),
        };
      }
      if (state.phase !== "lobby") return state;
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
        players: state.players.map((p) =>
          p.deviceId === action.deviceId ? { ...p, online: action.online as boolean } : p
        ),
      };
    }
    case "setSongsPerPlayer": {
      if (state.phase !== "lobby") return state;
      const count = action.count as number;
      if (count < 1 || count > 5) return state;
      return { ...state, songsPerPlayer: count };
    }
    case "addSong": {
      if (state.phase !== "lobby") return state;
      const ownerDeviceId = action.ownerDeviceId as string;
      const title = action.title as string;
      const artist = action.artist as string;
      const url = action.url as string | null | undefined;
      const cover = action.cover as string | null | undefined;
      const noPreview = action.noPreview as boolean;
      const owner = state.players.find((p) => p.deviceId === ownerDeviceId);
      if (!owner) return state;
      if (state.songsPerPlayer) {
        const ownerCount = state.songs.filter((s) => s.ownerDeviceId === ownerDeviceId).length;
        if (ownerCount >= state.songsPerPlayer) return state;
      }
      const id = "song_" + Math.random().toString(36).slice(2, 10);
      return {
        ...state,
        songs: [
          ...state.songs,
          {
            id,
            ownerDeviceId,
            ownerName: owner.name,
            title,
            artist,
            url: url || null,
            cover: cover || null,
            noPreview: !!noPreview,
          },
        ],
      };
    }
    case "removeSong": {
      if (state.phase !== "lobby") return state;
      return { ...state, songs: state.songs.filter((s) => s.id !== action.songId) };
    }
    case "start": {
      if (state.phase !== "lobby") return state;
      const owners = new Set(state.songs.map((s) => s.ownerDeviceId));
      if (state.songsPerPlayer) {
        const allReady = state.players.every(
          (p) =>
            state.songs.filter((s) => s.ownerDeviceId === p.deviceId).length >= state.songsPerPlayer!
        );
        if (!allReady) return state;
      } else if (state.songs.length < 3 || owners.size < 2) {
        return state;
      }
      const order = shuffleArr(state.songs.map((s) => s.id));
      const scores: Record<string, number> = {};
      const streaks: Record<string, number> = {};
      state.players.forEach((p) => {
        scores[p.deviceId] = 0;
        streaks[p.deviceId] = 0;
      });
      return {
        ...state,
        phase: "splash",
        order,
        roundIdx: 0,
        scores,
        streaks,
        scoreDeltas: {},
        guesses: {},
        guessTimes: {},
        roundStartedAt: 0,
        fastestCorrect: null,
        reactions: [],
        reactionSeq: 0,
      };
    }
    case "enterRound": {
      if (state.phase !== "splash") return state;
      return {
        ...state,
        phase: "round",
        roundStartedAt: action.now as number,
        guesses: {},
        guessTimes: {},
        reactions: [],
      };
    }
    case "sendReaction": {
      if (state.phase !== "round") return state;
      const deviceId = action.deviceId as string;
      const reactionId = action.reactionId as string;
      if (!deviceId || !reactionId) return state;
      const player = state.players.find((p) => p.deviceId === deviceId);
      const nextSeq = (state.reactionSeq || 0) + 1;
      const event = {
        id: nextSeq,
        reactionId,
        deviceId,
        name: player ? player.name : "Player",
        atMs: (action.nowMs as number) || Date.now(),
      };
      return {
        ...state,
        reactionSeq: nextSeq,
        reactions: [...(state.reactions || []), event].slice(-32),
      };
    }
    case "submitGuess": {
      if (state.phase !== "round") return state;
      const deviceId = action.deviceId as string;
      const targetDeviceId = action.targetDeviceId as string;
      const now = action.now as number;
      const song = state.songs.find((s) => s.id === state.order[state.roundIdx]);
      if (!song) return state;
      if (state.guesses[deviceId]) return state;
      return {
        ...state,
        guesses: { ...state.guesses, [deviceId]: targetDeviceId },
        guessTimes: { ...state.guessTimes, [deviceId]: now - state.roundStartedAt },
      };
    }
    case "revealRound": {
      if (state.phase !== "round") return state;
      const song = state.songs.find((s) => s.id === state.order[state.roundIdx]);
      if (!song) return state;

      const guessers = state.players.filter((p) => p.online !== false).map((p) => p.deviceId);
      if (guessers.length > 0 && !guessers.every((g) => state.guesses[g] != null)) return state;

      const scores = { ...state.scores };
      const streaks = { ...state.streaks };
      const deltas: Record<string, number> = {};
      let fastest: string | null = null;
      let fastestPoints = 0;

      for (const g of guessers) {
        const guess = state.guesses[g];
        let delta = 0;
        if (guess == null) {
          streaks[g] = 0;
          deltas[g] = 0;
          continue;
        }
        const correct = guess === song.ownerDeviceId;
        if (correct) {
          const elapsed = state.guessTimes[g] != null ? state.guessTimes[g] : 30000;
          delta = pointsForMs(elapsed);
          streaks[g] = (streaks[g] || 0) + 1;
          if (delta > fastestPoints) {
            fastestPoints = delta;
            fastest = g;
          }
        } else {
          streaks[g] = 0;
        }
        scores[g] = (scores[g] || 0) + delta;
        deltas[g] = delta;
      }

      return {
        ...state,
        phase: "results",
        scores,
        streaks,
        scoreDeltas: deltas,
        fastestCorrect: fastest,
        reactions: [],
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
        guesses: {},
        guessTimes: {},
        scoreDeltas: {},
        fastestCorrect: null,
        reactions: [],
      };
    }
    case "reset": {
      const cleared = Object.fromEntries(state.players.map((p) => [p.deviceId, 0]));
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
      return { ...state, players: state.players.filter((p) => p.online !== false) };
    }
    default:
      return state;
  }
}

// ---------- Blitz reducer ----------
function hashStringToSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(arr: string[], rng: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ChartTrack = {
  deezerId: string;
  title: string;
  artist: string;
  cover: string | null;
  preview: string | null;
};

async function fetchDeezerChartTracks(): Promise<ChartTrack[]> {
  const PAGE_SIZE = 50;
  const PAGE_COUNT = 6;
  const pages = await Promise.all(
    Array.from({ length: PAGE_COUNT }, (_, i) =>
      fetch(
        `https://api.deezer.com/chart/0/tracks?limit=${PAGE_SIZE}&index=${i * PAGE_SIZE}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );
  const seen = new Set<string>();
  const tracks: ChartTrack[] = [];
  for (const res of pages) {
    const raw = res && res.data ? res.data : [];
    for (const t of raw) {
      if (!t || !t.id) continue;
      const deezerId = String(t.id);
      if (seen.has(deezerId)) continue;
      seen.add(deezerId);
      const title = String(t.title_short || t.title || "").trim();
      const artist =
        t.artist && t.artist.name ? String(t.artist.name).trim() : "Unknown artist";
      const preview = t.preview ? String(t.preview) : null;
      if (!title) continue;
      tracks.push({
        deezerId,
        title,
        artist,
        cover:
          (t.album && (t.album.cover_small || t.album.cover_medium || t.album.cover)) || null,
        preview,
      });
    }
  }
  return tracks;
}

function blitzInitialState() {
  return {
    phase: "lobby" as const,
    coordinatorDeviceId: null as string | null,
    players: [] as { deviceId: string; name: string; online: boolean }[],
    scores: {} as Record<string, number>,
    roundIdx: 0,
    roundCount: 3,
    seed: 0,
    chartTracks: null as ChartTrack[] | null,
    joinWindowEndsAtMs: null as number | null,
    startVotes: {} as Record<string, boolean>,
    replayVotes: {} as Record<string, boolean>,
    round: null as {
      startedAtMs: number;
      endsAtMs: number;
      correctId: string;
      choiceIds: string[];
    } | null,
    answers: {} as Record<
      number,
      Record<string, { choiceId: string; answeredAtMs: number; points: number; correct: boolean }>
    >,
    lastRoundDeltas: {} as Record<string, { points: number; correct: boolean }>,
  };
}

type BlitzState = ReturnType<typeof blitzInitialState>;

const BLITZ_JOIN_WINDOW_MS = 30000;
const BLITZ_MIN_PLAYERS = 2;
const BLITZ_MAX_PLAYERS = 5;

function blitzOnlinePlayers(state: BlitzState) {
  return (state.players || []).filter((p) => p.online !== false);
}

function blitzCanJoinLobby(state: BlitzState, nowMs: number) {
  if (state.phase !== "lobby") return false;
  if (state.players.length >= BLITZ_MAX_PLAYERS) return false;
  if (state.players.length < BLITZ_MIN_PLAYERS) return true;
  if (!state.joinWindowEndsAtMs) return true;
  return nowMs <= state.joinWindowEndsAtMs;
}

function pointsForMs(elapsedMs: number) {
  const t = Math.max(0, Math.min(30000, elapsedMs));
  const raw = 1000 - (t / 30000) * 900;
  return Math.max(100, Math.round(raw));
}

function buildRoundFromSeed({
  seed,
  roundIdx,
  tracks,
}: {
  seed: number;
  roundIdx: number;
  tracks: ChartTrack[];
}) {
  const rng = mulberry32((seed + roundIdx * 1013904223) >>> 0);
  const usable = tracks.filter((t) => t && t.preview);
  const pool = usable.length >= 4 ? usable : tracks.filter(Boolean);
  if (pool.length < 4) return null;
  const ids = pool.map((t) => t.deezerId);
  const shuffled = shuffleWithRng(ids, rng);
  const correctId = shuffled[0];
  const wrong = shuffled.slice(1, 4);
  const choiceIds = shuffleWithRng([correctId, ...wrong], rng);
  return { correctId, choiceIds };
}

function blitzBuildStartRoundState(state: BlitzState, startedAtMs: number) {
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
    phase: "round" as const,
    round: { startedAtMs, endsAtMs, correctId, choiceIds },
    lastRoundDeltas: {},
    startVotes: {},
    replayVotes: {},
  };
}

function blitzTryStartFromVotes(state: BlitzState, startedAtMs: number) {
  if (state.phase !== "lobby") return null;
  const online = blitzOnlinePlayers(state);
  if (online.length < BLITZ_MIN_PLAYERS) return null;
  const allVoted = online.every((p) => state.startVotes[p.deviceId]);
  if (!allVoted) return null;
  return blitzBuildStartRoundState(state, startedAtMs);
}

function blitzTryReplayFromVotes(state: BlitzState, startedAtMs: number, seed: number) {
  if (state.phase !== "final") return null;
  const online = blitzOnlinePlayers(state);
  if (online.length < 1) return null;
  const allVoted = online.every((p) => state.replayVotes[p.deviceId]);
  if (!allVoted) return null;
  const cleared = Object.fromEntries(state.players.map((p) => [p.deviceId, 0]));
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

function blitzReducer(state: BlitzState, action: Record<string, unknown>): BlitzState {
  switch (action.type) {
    case "join": {
      if (state.phase !== "lobby") return state;
      const deviceId = action.deviceId as string;
      const name = action.name as string;
      const nowMs = (action.nowMs as number) || Date.now();
      const existing = state.players.find((p) => p.deviceId === deviceId);
      if (existing) {
        return {
          ...state,
          players: state.players.map((p) =>
            p.deviceId === deviceId ? { ...p, name: name || p.name, online: true } : p
          ),
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
        players: state.players.map((p) =>
          p.deviceId === action.deviceId ? { ...p, online: action.online as boolean } : p
        ),
      };
    }
    case "leave": {
      if (state.phase !== "lobby") return state;
      const deviceId = action.deviceId as string;
      if (!deviceId || deviceId === state.coordinatorDeviceId) return state;
      const nextPlayers = state.players.filter((p) => p.deviceId !== deviceId);
      let joinWindowEndsAtMs = state.joinWindowEndsAtMs;
      if (nextPlayers.length < BLITZ_MIN_PLAYERS) joinWindowEndsAtMs = null;
      return {
        ...state,
        players: nextPlayers,
        scores: Object.fromEntries(
          Object.entries(state.scores).filter(([id]) => id !== deviceId)
        ),
        startVotes: Object.fromEntries(
          Object.entries(state.startVotes).filter(([id]) => id !== deviceId)
        ),
        joinWindowEndsAtMs,
      };
    }
    case "init": {
      if (state.phase !== "lobby") return state;
      return {
        ...state,
        coordinatorDeviceId:
          (action.coordinatorDeviceId as string) || state.coordinatorDeviceId,
        roundCount: action.roundCount as number,
        seed: action.seed as number,
      };
    }
    case "setChart": {
      if (state.phase !== "lobby") return state;
      const withChart = { ...state, chartTracks: action.tracks as ChartTrack[] };
      const started = blitzTryStartFromVotes(
        withChart,
        (action.startedAtMs as number) || Date.now() + 1500
      );
      return started || withChart;
    }
    case "voteStart": {
      if (state.phase !== "lobby") return state;
      const deviceId = action.deviceId as string;
      const voted = action.voted as boolean;
      const online = blitzOnlinePlayers(state);
      if (online.length < BLITZ_MIN_PLAYERS) return state;
      if (!online.some((p) => p.deviceId === deviceId)) return state;
      const nextVotes = { ...state.startVotes };
      if (voted) nextVotes[deviceId] = true;
      else delete nextVotes[deviceId];
      const withVotes = { ...state, startVotes: nextVotes };
      const started = blitzTryStartFromVotes(
        withVotes,
        (action.startedAtMs as number) || Date.now() + 1500
      );
      return started || withVotes;
    }
    case "voteReplay": {
      if (state.phase !== "final") return state;
      const deviceId = action.deviceId as string;
      const voted = action.voted as boolean;
      const online = blitzOnlinePlayers(state);
      if (!online.some((p) => p.deviceId === deviceId)) return state;
      const nextVotes = { ...state.replayVotes };
      if (voted) nextVotes[deviceId] = true;
      else delete nextVotes[deviceId];
      const withVotes = { ...state, replayVotes: nextVotes };
      const seed = (action.seed as number) || ((Math.random() * 0xffffffff) >>> 0);
      const started = blitzTryReplayFromVotes(
        withVotes,
        (action.startedAtMs as number) || Date.now() + 1800,
        seed
      );
      return started || withVotes;
    }
    case "startRound": {
      if (state.phase !== "lobby" && state.phase !== "results") return state;
      const started = blitzBuildStartRoundState(state, action.startedAtMs as number);
      return started || state;
    }
    case "submitAnswer": {
      if (state.phase !== "round" || !state.round) return state;
      const deviceId = action.deviceId as string;
      const choiceId = action.choiceId as string;
      const answeredAtMs = action.answeredAtMs as number;
      const existing =
        (state.answers[state.roundIdx] && state.answers[state.roundIdx][deviceId]) || null;
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
      const nextScores = {
        ...state.scores,
        [deviceId]: (state.scores[deviceId] || 0) + points,
      };
      const nextDeltas = {
        ...state.lastRoundDeltas,
        [deviceId]: { points, correct },
      };
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
      const cleared = Object.fromEntries(state.players.map((p) => [p.deviceId, 0]));
      return {
        ...blitzInitialState(),
        coordinatorDeviceId: state.coordinatorDeviceId,
        players: state.players,
        scores: cleared,
        roundCount: state.roundCount,
        seed: action.seed as number,
        chartTracks: state.chartTracks,
      };
    }
    default:
      return state;
  }
}

function blitzConfigFromRoomId(roomId: string) {
  const m = roomId.match(/^blitz-(short|medium|long)$/);
  if (!m) return null;
  const len = m[1];
  const roundCount = len === "short" ? 3 : len === "medium" ? 5 : 7;
  return { roundCount, seed: hashStringToSeed(roomId) };
}

function isBlitzRoom(roomId: string) {
  return roomId.startsWith("blitz-");
}

export default class GameServer implements Party.Server {
  gameType: "party" | "blitz";
  state: PartyState | BlitzState;
  connToDevice = new Map<string, string>();
  chartLoading = false;

  constructor(readonly room: Party.Room) {
    this.gameType = isBlitzRoom(room.id) ? "blitz" : "party";
    this.state = this.gameType === "blitz" ? blitzInitialState() : initialState();
  }

  broadcastState() {
    this.room.broadcast(JSON.stringify({ type: "state", state: this.state }));
  }

  sendState(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "state", state: this.state }));
  }

  applyAction(action: Record<string, unknown>, deviceId: string) {
    const full = { ...action, deviceId: (action.deviceId as string) || deviceId };
    if (this.gameType === "blitz") {
      this.state = blitzReducer(this.state as BlitzState, full);
    } else {
      this.state = reducer(this.state as PartyState, full);
    }
    this.broadcastState();
  }

  async ensureBlitzChart() {
    const st = this.state as BlitzState;
    if (this.chartLoading || st.chartTracks) return;
    this.chartLoading = true;
    try {
      const tracks = await fetchDeezerChartTracks();
      if (tracks.length > 0 && this.gameType === "blitz") {
        this.applyAction(
          { type: "setChart", tracks, startedAtMs: Date.now() + 1500 },
          st.coordinatorDeviceId || ""
        );
      }
    } catch (e) {
      console.error("Deezer chart fetch failed", e);
    } finally {
      this.chartLoading = false;
    }
  }

  onConnect(conn: Party.Connection) {
    this.sendState(conn);
  }

  onClose(conn: Party.Connection) {
    const deviceId = this.connToDevice.get(conn.id);
    if (!deviceId) return;
    this.connToDevice.delete(conn.id);

    if (this.gameType === "blitz") {
      const st = this.state as BlitzState;
      if (st.phase === "lobby") {
        this.applyAction({ type: "leave", deviceId }, deviceId);
      } else {
        this.applyAction({ type: "setOnline", deviceId, online: false }, deviceId);
      }
    } else {
      this.applyAction({ type: "setOnline", deviceId, online: false }, deviceId);
    }
  }

  onMessage(raw: string | ArrayBuffer, sender: Party.Connection) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    if (msg.type === "hello") {
      const deviceId = msg.deviceId as string;
      const name = (msg.name as string) || "Player";
      if (!deviceId) return;

      this.connToDevice.set(sender.id, deviceId);

      if (this.gameType === "party") {
        let st = this.state as PartyState;
        if (st.players.length === 0) {
          const sp = msg.songsPerPlayer as number | undefined;
          if (sp != null && sp >= 1 && sp <= 5) {
            st = reducer(st, { type: "setSongsPerPlayer", count: sp });
          }
          st = { ...st, hostDeviceId: deviceId };
          this.state = st;
        }
        this.applyAction({ type: "join", name, deviceId }, deviceId);
      } else {
        const st = this.state as BlitzState;
        const nowMs = Date.now();
        const existing = st.players.some((p) => p.deviceId === deviceId);
        if (!existing && !blitzCanJoinLobby(st, nowMs)) {
          sender.send(
            JSON.stringify({
              type: "joinRejected",
              message:
                st.players.length >= BLITZ_MAX_PLAYERS
                  ? "This room is full."
                  : "The join window for this room has closed.",
            })
          );
          return;
        }

        const wasEmpty = st.players.length === 0;
        this.applyAction({ type: "join", name, deviceId, nowMs }, deviceId);

        if (wasEmpty && (this.state as BlitzState).players.some((p) => p.deviceId === deviceId)) {
          const cfg = blitzConfigFromRoomId(this.room.id);
          if (cfg) {
            this.applyAction(
              {
                type: "init",
                coordinatorDeviceId: deviceId,
                roundCount: cfg.roundCount,
                seed: cfg.seed,
              },
              deviceId
            );
            void this.ensureBlitzChart();
          }
        }
      }
      return;
    }

    if (msg.type === "action") {
      const deviceId = this.connToDevice.get(sender.id);
      if (!deviceId) return;
      const action = msg.action as Record<string, unknown>;
      if (!action || typeof action !== "object") return;

      if (this.gameType === "blitz" && action.type === "join") {
        const st = this.state as BlitzState;
        const nowMs = (action.nowMs as number) || Date.now();
        const existing = st.players.some((p) => p.deviceId === deviceId);
        if (!existing && !blitzCanJoinLobby(st, nowMs)) {
          sender.send(
            JSON.stringify({
              type: "joinRejected",
              message:
                st.players.length >= BLITZ_MAX_PLAYERS
                  ? "This room is full."
                  : "The join window for this room has closed.",
            })
          );
          return;
        }
      }

      this.applyAction(action, deviceId);
    }
  }
}

GameServer satisfies Party.Worker;
