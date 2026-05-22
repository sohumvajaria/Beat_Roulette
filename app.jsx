// Beat Roulette — UI

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp, useMemo: useMemoApp } = React;

// ---------- Helpers ----------
const cx = (...xs) => xs.filter(Boolean).join(" ");
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const initials = (name) => {
  const parts = (name || "?").trim().split(/\s+/);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
};
const AVATAR_HUES = [280, 320, 250, 200, 160, 30, 350, 220, 120, 60];
const colorFor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = AVATAR_HUES[Math.abs(h) % AVATAR_HUES.length];
  return `hsl(${hue} 80% 60%)`;
};
const randomCode = () => {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 5; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
};

const FAMOUS_ARTISTS = [
  "Drake","Lil Wayne","Taylor Swift","Beyoncé","Kendrick Lamar",
  "Rihanna","The Weeknd","Bad Bunny","Billie Eilish","Dua Lipa",
  "Frank Ocean","Adele","Bruno Mars","Post Malone","Travis Scott",
  "Ariana Grande","Olivia Rodrigo","SZA","Doja Cat","Future",
  "Tyler, The Creator","J. Cole","Megan Thee Stallion","Nicki Minaj",
  "Lana Del Rey","Sabrina Carpenter","Harry Styles","Lil Baby","21 Savage",
];

// ---------- Deezer JSONP ----------
function deezerSearch(query) {
  return new Promise((resolve, reject) => {
    const cb = "__dz_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let done = false;
    const cleanup = () => { done = true; try { delete window[cb]; } catch(e) { window[cb] = undefined; } script.remove(); };
    window[cb] = (data) => { if (done) return; cleanup(); resolve(data); };
    script.onerror = () => { if (done) return; cleanup(); reject(new Error("network")); };
    setTimeout(() => { if (done) return; cleanup(); reject(new Error("timeout")); }, 8000);
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=jsonp&callback=${cb}`;
    document.head.appendChild(script);
  });
}
function deezerArtistSearch(name) {
  return new Promise((resolve, reject) => {
    const cb = "__dz_art_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let done = false;
    const cleanup = () => { done = true; try { delete window[cb]; } catch(e){ window[cb] = undefined; } script.remove(); };
    window[cb] = (data) => { if (done) return; cleanup(); resolve(data); };
    script.onerror = () => { if (done) return; cleanup(); reject(); };
    setTimeout(() => { if (done) return; cleanup(); reject(); }, 8000);
    script.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&output=jsonp&callback=${cb}&limit=1`;
    document.head.appendChild(script);
  });
}
async function fetchRandomArtistPhoto() {
  const shuffled = shuffle(FAMOUS_ARTISTS);
  for (const name of shuffled) {
    try {
      const res = await deezerArtistSearch(name);
      const a = res && res.data && res.data[0];
      const url = a && (a.picture_xl || a.picture_big || a.picture_medium);
      if (url) return { name, url };
    } catch (e) {}
  }
  return null;
}
async function findPreview(title, artist) {
  const queries = [
    `track:"${title}" artist:"${artist}"`,
    `${artist} ${title}`,
    `${title} ${artist}`,
  ];
  for (const q of queries) {
    try {
      const res = await deezerSearch(q);
      const tracks = (res && res.data) || [];
      const hit = tracks.find(t => t && t.preview);
      if (hit) {
        return {
          preview: hit.preview,
          deezerTitle: hit.title,
          deezerArtist: hit.artist && hit.artist.name,
          cover: hit.album && (hit.album.cover_medium || hit.album.cover),
        };
      }
    } catch (e) {}
  }
  return null;
}

// ---------- Atoms ----------
function Avatar({ name, size = 36, dim = false }) {
  return (
    <div
      className="rounded-full grid place-items-center font-bold text-white shrink-0"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${colorFor(name)}, hsl(280 80% 30%))`,
        fontSize: size * 0.4,
        opacity: dim ? 0.4 : 1,
        boxShadow: `0 6px 18px -8px ${colorFor(name)}`,
      }}
    >
      {initials(name)}
    </div>
  );
}

function TopBar({ subtitle, right }) {
  return (
    <div className="px-6 pt-6 pb-3 flex items-start justify-between relative z-10">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 grid place-items-center shadow-[0_0_24px_-4px_rgba(126,58,142,0.7)] border border-amber-400/40">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          </div>
          <div className="text-[15px] font-semibold tracking-tight">Beat Roulette</div>
        </div>
        {subtitle && (
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, maxLength, autoFocus }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45 mb-1">{label}</div>
      <input
        value={value}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none",
          "placeholder:text-white/25 focus:border-purple-500 focus:bg-black/60 transition",
          mono && "font-mono text-[14px] tracking-[0.2em] uppercase"
        )}
      />
    </label>
  );
}

function ArtistPhotoBackdrop() {
  const [photo, setPhoto] = useStateApp(null);
  useEffectApp(() => {
    let cancelled = false;
    fetchRandomArtistPhoto().then(p => { if (!cancelled && p) setPhoto(p); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {photo && (
        <>
          <img src={photo.url} alt="" className="absolute inset-0 w-full h-full object-cover kenburns" style={{ opacity: 0.78 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(58,25,71,0.25) 0%, rgba(58,25,71,0.45) 25%, rgba(13,7,18,0.85) 60%, rgba(13,7,18,0.98) 80%, var(--bg) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, rgba(212,168,67,0.10), transparent 60%)" }} />
          <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-mono uppercase tracking-[0.3em] text-white/25">ft. {photo.name}</div>
        </>
      )}
      {!photo && (
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 40% at 50% 10%, rgba(126,58,142,0.45), transparent 70%), radial-gradient(40% 30% at 80% 30%, rgba(212,168,67,0.18), transparent 70%)" }} />
      )}
    </div>
  );
}

// ---------- StartScreen — choose host/join/local ----------
function StartScreen({ onChoose }) {
  const [view, setView] = useStateApp("home"); // home | host | join
  const [name, setName] = useStateApp("");
  const [code, setCode] = useStateApp("");

  // pre-populate code from ?room= if present
  useEffectApp(() => {
    try {
      const u = new URL(window.location.href);
      const r = u.searchParams.get("room");
      if (r) {
        setCode(r.toUpperCase());
        setView("join");
      }
    } catch (e) {}
  }, []);

  const startHost = () => {
    if (!name.trim()) return;
    onChoose({ kind: "host", code: randomCode(), name: name.trim() });
  };
  const startJoin = () => {
    if (!name.trim() || code.trim().length < 4) return;
    onChoose({ kind: "client", code: code.trim().toUpperCase(), name: name.trim() });
  };

  return (
    <div className="fade-enter relative min-h-[100dvh]">
      <ArtistPhotoBackdrop />
      <div className="relative">
        <TopBar subtitle={view === "home" ? "Start a party" : view === "host" ? "Hosting" : "Joining"} />

        <div className="px-6 mt-2 relative z-10">
          <h1 className="text-[32px] leading-[1.02] font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            Guess who<br/>brought the <span className="text-amber-400">vibe</span>.
          </h1>
          <p className="mt-2 text-sm text-white/65 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            Each player joins on their own phone. Drop a song, friends race to guess who picked it.
          </p>
        </div>

        {view === "home" && (
          <div className="mt-7 px-6 space-y-3 relative z-10">
            <button
              onClick={() => setView("host")}
              className="w-full rounded-2xl px-5 py-4 text-left border border-amber-400/40 bg-gradient-to-b from-purple-600 to-purple-800 shadow-[0_14px_36px_-12px_rgba(126,58,142,0.9)] active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200/90">Create party</div>
                  <div className="mt-0.5 text-lg font-semibold">Host a new room</div>
                  <div className="text-[12px] text-white/70 mt-0.5">Get a code, share it with friends.</div>
                </div>
                <ArrowRight />
              </div>
            </button>

            <button
              onClick={() => setView("join")}
              className="w-full rounded-2xl px-5 py-4 text-left border border-white/15 bg-black/40 backdrop-blur-md hover:border-white/30 active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">Got a code?</div>
                  <div className="mt-0.5 text-lg font-semibold">Join a party</div>
                  <div className="text-[12px] text-white/55 mt-0.5">Enter the 5-letter room code.</div>
                </div>
                <ArrowRight muted />
              </div>
            </button>

            <button
              onClick={() => { if (!name.trim()) { setName("You"); } onChoose({ kind: "local", code: randomCode(), name: name.trim() || "You" }); }}
              className="w-full rounded-xl px-4 py-3 text-left border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/35">Single device</div>
                  <div className="text-[13px] text-white/70">Pass-around mode (everyone uses this phone)</div>
                </div>
                <ArrowRight muted />
              </div>
            </button>
          </div>
        )}

        {view === "host" && (
          <div className="mt-6 mx-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 space-y-3 grain relative z-10">
            <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
            <div className="text-[11px] text-white/40 leading-snug">
              You'll get a room code after this — share it (or the link) with friends so they can join from their phones.
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setView("home")} className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm">Back</button>
              <button
                disabled={!name.trim()}
                onClick={startHost}
                className={cx(
                  "flex-1 rounded-xl py-3 text-sm font-semibold transition border",
                  name.trim()
                    ? "bg-gradient-to-b from-purple-600 to-purple-800 hover:brightness-110 shadow-[0_10px_28px_-10px_rgba(126,58,142,0.9)] border-amber-400/40"
                    : "bg-white/[0.04] text-white/30 border-white/5"
                )}
              >Open room →</button>
            </div>
          </div>
        )}

        {view === "join" && (
          <div className="mt-6 mx-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 space-y-3 grain relative z-10">
            <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
            <Field label="Room code" value={code} onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))} placeholder="ABCDE" mono maxLength={5} />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setView("home")} className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm">Back</button>
              <button
                disabled={!name.trim() || code.length < 4}
                onClick={startJoin}
                className={cx(
                  "flex-1 rounded-xl py-3 text-sm font-semibold transition border",
                  name.trim() && code.length >= 4
                    ? "bg-gradient-to-b from-purple-600 to-purple-800 hover:brightness-110 shadow-[0_10px_28px_-10px_rgba(126,58,142,0.9)] border-amber-400/40"
                    : "bg-white/[0.04] text-white/30 border-white/5"
                )}
              >Join party →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRight({ muted }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={muted ? "rgba(255,255,255,0.4)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}

// ---------- ConnectionGate ----------
function ConnectionGate({ status, mode, onReset }) {
  if (status.kind === "ready") return null;
  return (
    <div className="fade-enter fixed inset-0 grid place-items-center bg-[var(--bg)]/95 backdrop-blur-md z-50">
      <div className="mx-6 max-w-sm w-full rounded-2xl border border-white/10 bg-black/60 p-5 text-center">
        {status.kind === "error" ? (
          <>
            <div className="text-[11px] uppercase tracking-[0.18em] text-rose-400">Couldn't connect</div>
            <div className="mt-2 text-base font-medium">{status.message || "Something went wrong."}</div>
            <button onClick={onReset} className="mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-black w-full">Back to start</button>
          </>
        ) : (
          <>
            <div className="mx-auto w-10 h-10 rounded-full border-2 border-purple-500/40 border-t-amber-400 animate-spin"></div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
              {mode.kind === "host" ? "Opening room" : "Joining room"}
            </div>
            <div className="mt-1 text-base font-medium tabular">{mode.code}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- RoomChip ----------
function RoomChip({ code, mode }) {
  const [copied, setCopied] = useStateApp(false);
  const copy = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("room", code);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch (_) {}
    }
  };
  return (
    <button onClick={copy} className="text-right group">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Room {mode.kind === "client" ? "· joined" : ""}</div>
      <div className="font-mono text-sm font-semibold tracking-[0.2em] text-amber-300 group-hover:text-amber-200 transition">
        {code}
      </div>
      <div className="text-[10px] text-white/35 mt-0.5">{copied ? "link copied!" : "tap to copy link"}</div>
    </button>
  );
}

// ---------- LobbyScreen ----------
function LobbyScreen({ state, dispatch, isHost, deviceId, code, mode }) {
  const [title, setTitle] = useStateApp("");
  const [artist, setArtist] = useStateApp("");
  const [err, setErr] = useStateApp("");
  const [loading, setLoading] = useStateApp(false);

  const me = state.players.find(p => p.deviceId === deviceId);
  const mySongs = state.songs.filter(s => s.ownerDeviceId === deviceId);

  const submit = async () => {
    setErr("");
    if (!title.trim() || !artist.trim()) return setErr("Add song title and artist.");
    setLoading(true);
    let found = null;
    try { found = await findPreview(title.trim(), artist.trim()); } catch (e) {}
    setLoading(false);
    dispatch({
      type: "addSong",
      ownerDeviceId: deviceId,
      title: title.trim(),
      artist: artist.trim(),
      url: found ? found.preview : null,
      cover: found ? found.cover : null,
      noPreview: !found,
    });
    setTitle(""); setArtist("");
  };

  const owners = new Set(state.songs.map(s => s.ownerDeviceId));
  const canStart = state.songs.length >= 3 && owners.size >= 2;

  return (
    <div className="fade-enter relative">
      <ArtistPhotoBackdrop />
      <div className="relative">
        <TopBar subtitle="Lobby" right={<RoomChip code={code} mode={mode} />} />

        <div className="px-6 relative z-10">
          <h1 className="text-[26px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {isHost ? "You're hosting." : "You're in."}
          </h1>
          <p className="mt-1.5 text-sm text-white/65 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            {isHost
              ? "Share the room code (tap it to copy a link). When everyone's added a song, hit start."
              : "Drop your song(s) below. The host will start the round when you're all ready."}
          </p>
        </div>

        {/* Players in room */}
        <div className="mt-5 px-6 relative z-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">
            In the room · {state.players.length}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {state.players.map(p => {
              const isMe = p.deviceId === deviceId;
              const isHostP = p.deviceId === state.hostDeviceId;
              const songCount = state.songs.filter(s => s.ownerDeviceId === p.deviceId).length;
              return (
                <div key={p.deviceId} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="relative">
                    <Avatar name={p.name} size={42} dim={p.online === false} />
                    {isHostP && (
                      <div className="absolute -top-1 -right-1 text-[10px] bg-amber-400 text-black rounded-full w-4 h-4 grid place-items-center font-bold">★</div>
                    )}
                  </div>
                  <div className={cx("text-[11px] truncate max-w-[64px]", isMe ? "text-amber-300 font-semibold" : "text-white/75")}>{p.name}</div>
                  <div className="text-[10px] font-mono text-white/35 tabular">
                    {songCount} {songCount === 1 ? "song" : "songs"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your songs (just yours) */}
        {mySongs.length > 0 && (
          <div className="mt-4 mx-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-3 relative z-10">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40 mb-2 px-1">Your picks</div>
            <div className="space-y-1.5">
              {mySongs.map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  {s.cover ? (
                    <img src={s.cover} alt="" className="w-9 h-9 rounded-md object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-purple-700/30 border border-white/10"></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate font-medium">{s.title}</div>
                    <div className="text-[11px] text-white/50 truncate">
                      {s.artist}{s.noPreview && <span className="ml-1.5 text-amber-300/80">· no preview</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "removeSong", songId: s.id })}
                    className="text-[11px] text-white/40 hover:text-rose-400 px-2 py-1 rounded-md"
                  >remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add a song */}
        <div className="mt-4 mx-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 space-y-3 grain relative z-10">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45 -mb-1">
            {me ? `Adding as ${me.name}` : "Adding song"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Song title" value={title} onChange={setTitle} placeholder="Levitating" />
            <Field label="Artist" value={artist} onChange={setArtist} placeholder="Dua Lipa" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>30-sec preview fetched automatically.</span>
          </div>
          {err && <div className="text-[12px] text-rose-400">{err}</div>}
          <button
            disabled={loading}
            onClick={submit}
            className={cx(
              "w-full mt-1 rounded-xl py-3 text-sm font-semibold active:scale-[0.99] transition shadow-[0_10px_28px_-10px_rgba(126,58,142,0.9)] flex items-center justify-center gap-2 border",
              loading
                ? "bg-purple-700/60 text-white/70 cursor-wait border-purple-700/40"
                : "bg-gradient-to-b from-purple-600 to-purple-800 hover:brightness-110 border-amber-400/40 text-white"
            )}
          >
            {loading && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            )}
            {loading ? "Finding preview…" : "Add to pool"}
          </button>
        </div>

        <div className="mt-6 px-6 relative z-10">
          <PoolCounter count={state.songs.length} />
        </div>

        <div className="px-6 pt-6 pb-10">
          {isHost ? (
            <button
              disabled={!canStart}
              onClick={() => dispatch({ type: "start" })}
              className={cx(
                "w-full rounded-xl py-4 text-base font-semibold transition",
                canStart
                  ? "bg-gradient-to-b from-purple-600 to-purple-800 hover:brightness-110 shadow-[0_14px_36px_-12px_rgba(126,58,142,0.9)] border-amber-400/40 border"
                  : "bg-white/[0.04] text-white/30 border border-white/5"
              )}
            >
              {canStart
                ? `Start · ${state.songs.length} round${state.songs.length === 1 ? "" : "s"} →`
                : state.songs.length < 3
                  ? `Need ${3 - state.songs.length} more song${3 - state.songs.length === 1 ? "" : "s"}`
                  : "Need at least 2 different players"}
            </button>
          ) : (
            <div className="w-full rounded-xl py-4 text-center bg-white/[0.03] border border-white/10 text-white/55 text-sm">
              {canStart ? "Waiting for host to start…" : "Waiting on more songs…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PoolCounter({ count }) {
  const remaining = Math.max(0, 3 - count);
  const ready = count >= 3;
  const discs = Math.min(count, 8);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur px-5 py-5 text-center grain relative overflow-hidden">
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-purple-600/15 blur-3xl"></div>
      <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl"></div>

      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Songs in the pool</div>
      <div className="relative mt-1 flex items-baseline justify-center">
        <span className="pool-number">{count}</span>
      </div>
      {discs > 0 && (
        <div className="mt-3 flex items-center justify-center -space-x-2">
          {Array.from({ length: discs }).map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-white/15"
              style={{
                background: "radial-gradient(circle at center, #d4a843 0 14%, #1b0f24 16% 55%, #0c0610 56% 100%)",
                transform: `translateY(${(i % 2) * -1}px)`,
              }}
            />
          ))}
          {count > 8 && (
            <div className="ml-3 text-[11px] font-mono text-white/40 tabular">+{count - 8}</div>
          )}
        </div>
      )}
      <div className="mt-3 text-[11px] text-white/50">
        {ready
          ? <span className="text-amber-300">Ready to roll — host can start whenever.</span>
          : `${remaining} more to start${count > 0 ? "" : " · min 3"}.`}
      </div>
    </div>
  );
}

// ---------- Splash ----------
function SplashScreen({ roundNumber, totalRounds, onDone, isHost }) {
  useEffectApp(() => {
    if (!isHost) return; // only host advances state
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone, isHost]);
  return (
    <div className="fade-enter absolute inset-0 grid place-items-center bg-[var(--bg)] z-30">
      <div className="relative w-full">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 splash-strip bg-gradient-to-r from-transparent via-amber-500/25 to-transparent"></div>
        <div className="relative text-center splash-num">
          <div className="text-[11px] uppercase tracking-[0.32em] text-amber-300/90">Round</div>
          <div className="mt-1 text-[96px] leading-none font-black tracking-tighter text-amber-200" style={{ textShadow: "0 4px 24px rgba(212,168,67,0.5), 0 0 1px rgba(255,255,255,0.6)" }}>
            {roundNumber}
          </div>
          <div className="-mt-2 text-sm text-white/40 tabular">of {totalRounds}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Timer ring ----------
function TimerRing({ progress, size = 168, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="pulse-glow">
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7e3a8e" />
          <stop offset="100%" stopColor="#f0c060" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(126,58,142,0.18)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke="url(#ring)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 120ms linear" }}
      />
    </svg>
  );
}

// ---------- RoundScreen ----------
function RoundScreen({ state, dispatch, deviceId, isHost }) {
  const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
  const audioRef = useRefApp(null);
  const [progress, setProgress] = useStateApp(0);
  const [duration, setDuration] = useStateApp(30);
  const [playing, setPlaying] = useStateApp(false);
  const [audioError, setAudioError] = useStateApp(false);

  const isOwner = song && song.ownerDeviceId === deviceId;
  const guessers = state.players.filter(p => p.deviceId !== (song && song.ownerDeviceId));
  const lockedCount = Object.keys(state.guesses).length;
  const myGuess = state.guesses[deviceId];

  useEffectApp(() => {
    setProgress(0);
    setAudioError(!song || song.noPreview || !song.url);
    const a = audioRef.current;
    if (!a || !song || !song.url) return;
    a.currentTime = 0;
    const tryPlay = a.play();
    if (tryPlay && tryPlay.then) {
      tryPlay.then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [song && song.id]);

  useEffectApp(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.duration && isFinite(a.duration)) {
        setDuration(a.duration);
        setProgress(Math.min(1, a.currentTime / a.duration));
      } else {
        setProgress(Math.min(1, a.currentTime / 30));
      }
    };
    const onErr = () => { setAudioError(true); setPlaying(false); };
    const onPlay = () => { setPlaying(true); setAudioError(false); };
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setProgress(1); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("error", onErr);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("error", onErr);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  // Host watches for "everyone locked in" — when all guessers have guessed, host reveals.
  useEffectApp(() => {
    if (!isHost || !song) return;
    const ids = state.players.filter(p => p.deviceId !== song.ownerDeviceId).map(p => p.deviceId);
    if (ids.length === 0) return;
    const allIn = ids.every(id => state.guesses[id] != null);
    if (allIn) {
      // small delay so the locked-in UI animates
      const t = setTimeout(() => dispatch({ type: "revealRound" }), 250);
      return () => clearTimeout(t);
    }
  }, [isHost, song, state.players, state.guesses, dispatch]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      const p = a.play();
      if (p && p.catch) p.catch(() => setAudioError(true));
    } else { a.pause(); }
  };

  if (!song) return null;

  const setGuess = (targetDeviceId) => {
    if (myGuess) return; // already locked
    if (targetDeviceId === deviceId) return;
    dispatch({
      type: "submitGuess",
      targetDeviceId,
      now: performance.now(),
    });
  };

  const secondsLeft = Math.max(0, Math.ceil((1 - progress) * (duration || 30)));

  return (
    <div className="fade-enter relative">
      {song.cover && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={song.cover} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(40px) saturate(1.15)", transform: "scale(1.25)", opacity: 0.55 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(13,7,18,0.55) 0%, rgba(13,7,18,0.80) 40%, rgba(13,7,18,0.95) 75%, var(--bg) 100%)" }} />
        </div>
      )}
      <div className="relative z-10">
        <TopBar
          subtitle="Round in play"
          right={
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Round</div>
              <div className="font-mono text-sm font-semibold text-amber-300 tabular">
                {state.roundIdx + 1}<span className="text-white/30">/{state.order.length}</span>
              </div>
            </div>
          }
        />

        <div className="mx-6 mt-1 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md p-5 grain relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-purple-600/20 blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-amber-400/10 blur-3xl"></div>

          <div className="flex flex-col items-center">
            <div className="relative grid place-items-center" style={{ width: 168, height: 168 }}>
              <div className="absolute inset-0"><TimerRing progress={progress} /></div>
              <div className={cx("w-[120px] h-[120px] rounded-full overflow-hidden border border-white/10 grid place-items-center relative spin-slow", !playing && "spin-paused")}>
                {song.cover ? (
                  <>
                    <img src={song.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(0,0,0,0.85) 0 14%, transparent 14.5% 60%, rgba(0,0,0,0.55) 60.5% 100%)" }}></div>
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, #000 0 18%, #2a1735 18.5% 60%, #0c0610 60.5% 100%)" }}></div>
                )}
                <div className="relative w-6 h-6 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(212,168,67,0.7)]"></div>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono tabular text-white/70">
                0:{secondsLeft.toString().padStart(2,"0")}
              </div>
            </div>

            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-amber-300/90">Now spinning</div>
            <div className="mt-1 text-lg font-semibold leading-tight text-center px-4 truncate w-full">{song.title}</div>
            <div className="text-sm text-white/65 text-center truncate w-full px-4">{song.artist}</div>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-white/45 font-mono">
              {playing ? (
                <div className="flex items-end gap-[2px] h-3">
                  <div className="w-[2px] bg-amber-400 eq-bar"></div>
                  <div className="w-[2px] bg-amber-400 eq-bar" style={{ animationDelay: "120ms" }}></div>
                  <div className="w-[2px] bg-amber-400 eq-bar" style={{ animationDelay: "240ms" }}></div>
                </div>
              ) : <div className="w-2 h-2 rounded-full bg-white/30"></div>}
              <button onClick={togglePlay} disabled={!song.url} className={cx("underline-offset-2 hover:underline", !song.url && "opacity-30 cursor-not-allowed")}>
                {playing ? "pause" : "play"}
              </button>
            </div>
            {audioError && (
              <div className="mt-2 text-[12px] text-amber-300/90 text-center">
                Preview unavailable for this song — guess from title & artist.
              </div>
            )}
          </div>

          {song.url && <audio ref={audioRef} src={song.url} preload="auto" />}
        </div>

        {/* Guess UI */}
        <div className="mt-6 px-6">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {isOwner ? "Your song!" : myGuess ? "Locked in" : "Who picked it?"}
            </div>
            <div className="text-[11px] text-white/40 tabular">{lockedCount}/{guessers.length} locked in</div>
          </div>

          {isOwner ? (
            <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5 text-center">
              <div className="text-3xl mb-2">🤫</div>
              <div className="text-sm text-amber-200/90">Sit tight while everyone guesses.</div>
              <div className="mt-3 flex justify-center gap-1 flex-wrap">
                {guessers.map(p => (
                  <div key={p.deviceId} className={cx(
                    "px-2 py-1 rounded-full text-[11px] flex items-center gap-1.5 border",
                    state.guesses[p.deviceId]
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                      : "bg-white/[0.03] border-white/10 text-white/55"
                  )}>
                    <Avatar name={p.name} size={14} />
                    {p.name}
                    {state.guesses[p.deviceId] && <span>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : myGuess ? (
            <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 text-center">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80 mb-2">Your guess</div>
              <div className="flex items-center justify-center gap-2">
                <Avatar name={state.players.find(p => p.deviceId === myGuess)?.name} size={32} />
                <div className="text-lg font-semibold">{state.players.find(p => p.deviceId === myGuess)?.name}</div>
              </div>
              <div className="mt-3 text-[11px] text-white/45">Waiting for {guessers.length - lockedCount} more…</div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {state.players.map(p => {
                const self = p.deviceId === deviceId;
                const isSongOwner = p.deviceId === song.ownerDeviceId;
                const disabled = self || isSongOwner; // can't pick yourself; can't pick the song's owner (you don't know who that is yet, but it'd be self for owner)
                // Actually we DO want owner pickable (they're a real candidate)
                // Only self is disabled.
                const reallyDisabled = self;
                return (
                  <button
                    key={p.deviceId}
                    disabled={reallyDisabled}
                    onClick={() => setGuess(p.deviceId)}
                    className={cx(
                      "rounded-xl px-3 py-3 text-sm font-medium border text-left transition flex items-center gap-2",
                      reallyDisabled
                        ? "bg-white/[0.02] border-white/5 text-white/25 cursor-not-allowed"
                        : "bg-black/30 border-white/10 hover:border-white/25"
                    )}
                  >
                    <Avatar name={p.name} size={26} dim={reallyDisabled} />
                    <div className="min-w-0">
                      <div className="truncate">{p.name}</div>
                      {self && <div className="text-[10px] text-white/30">that's you</div>}
                      {p.online === false && !self && <div className="text-[10px] text-white/30">offline</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pt-6 pb-10 text-center">
          {!isHost && (
            <div className="text-[11px] text-white/35">
              {lockedCount === guessers.length ? "All in — host is revealing…" : "Reveal happens when everyone's locked in."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- ResultsScreen ----------
function ResultsScreen({ state, dispatch, deviceId, isHost }) {
  const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
  if (!song) return null;

  const playersById = Object.fromEntries(state.players.map(p => [p.deviceId, p]));
  const guessers = state.players.filter(p => p.deviceId !== song.ownerDeviceId);
  const guessedIds = guessers.filter(g => state.guesses[g.deviceId]).map(g => g.deviceId);
  const wrongCount = guessedIds.filter(id => state.guesses[id] !== song.ownerDeviceId).length;
  const sneaky = guessedIds.length > 0 && wrongCount * 2 > guessedIds.length;

  const sorted = state.players
    .map(p => ({ deviceId: p.deviceId, name: p.name, score: state.scores[p.deviceId] || 0, delta: state.scoreDeltas[p.deviceId] || 0 }))
    .sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  const isFinal = state.roundIdx + 1 >= state.order.length;

  return (
    <div className="fade-enter relative">
      <TopBar subtitle="Reveal" />

      <div className="mx-6 mt-1 rounded-3xl border border-white/10 bg-gradient-to-b from-purple-600/[0.22] to-white/[0.02] p-5 grain relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl"></div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-amber-300/90">It was…</div>
        <div className="mt-2 flex items-center gap-3">
          <Avatar name={song.ownerName} size={48} />
          <div className="min-w-0">
            <div className="text-3xl font-semibold tracking-tight leading-none truncate">{song.ownerName}</div>
            <div className="mt-1 text-sm text-white/60 truncate">
              <span className="text-white/90">{song.title}</span> · {song.artist}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sneaky && (
            <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
              ✦ Sneaky pick · {song.ownerName} +1
            </span>
          )}
          {state.fastestCorrect && (
            <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/40">
              ⚡ Fastest · {playersById[state.fastestCorrect]?.name} +1
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 px-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Guesses</div>
        <div className="mt-3 space-y-2">
          {guessers.map(guesser => {
            const target = state.guesses[guesser.deviceId];
            const right = target === song.ownerDeviceId;
            const t = state.guessTimes[guesser.deviceId];
            const seconds = t != null ? (t / 1000).toFixed(1) : null;
            const delta = state.scoreDeltas[guesser.deviceId] || 0;
            const noGuess = target == null;
            return (
              <div key={guesser.deviceId} className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                noGuess ? "border-white/10 bg-white/[0.02] opacity-60" :
                right ? "border-emerald-500/30 bg-emerald-500/[0.08]" : "border-white/10 bg-white/[0.03]"
              )}>
                <Avatar name={guesser.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">
                    <span className="font-medium">{guesser.name}</span>
                    <span className="text-white/40"> → </span>
                    <span className="font-medium">{noGuess ? "—" : playersById[target]?.name}</span>
                  </div>
                  <div className="text-[11px] text-white/40 font-mono tabular">
                    {noGuess ? "didn't lock in" : right ? "correct" : "wrong"}{seconds ? ` · ${seconds}s` : ""}
                    {state.streaks[guesser.deviceId] >= 2 && right && <span className="ml-1 text-amber-300">🔥 {state.streaks[guesser.deviceId]}</span>}
                  </div>
                </div>
                <div className={cx(
                  "text-[12px] font-semibold px-2 py-1 rounded-full tabular",
                  delta > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.06] text-white/40"
                )}>
                  {delta > 0 ? `+${delta}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Leaderboard</div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {sorted.map((row, i) => (
            <div key={row.deviceId} className={cx(
              "flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0",
              row.score === topScore && row.score > 0 && "bg-purple-600/[0.10]"
            )}>
              <div className="w-5 text-xs font-mono text-white/40 tabular">{i + 1}</div>
              <Avatar name={row.name} size={26} />
              <div className="text-sm font-medium flex-1 truncate">
                {row.name}
                {row.deviceId === deviceId && <span className="ml-1 text-[10px] text-amber-300/80">you</span>}
              </div>
              {row.delta > 0 && (
                <div className="text-[11px] font-mono tabular text-emerald-300/90">+{row.delta}</div>
              )}
              <div className="text-sm font-mono tabular w-7 text-right">{row.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6 pb-10">
        {isHost ? (
          <button
            onClick={() => dispatch({ type: "nextRound" })}
            className="w-full rounded-xl py-4 text-base font-semibold transition bg-gradient-to-b from-purple-600 to-purple-800 hover:brightness-110 shadow-[0_14px_36px_-12px_rgba(126,58,142,0.9)] border border-amber-400/40"
          >
            {isFinal ? "See final results →" : "Next round →"}
          </button>
        ) : (
          <div className="w-full rounded-xl py-4 text-center bg-white/[0.03] border border-white/10 text-white/55 text-sm">
            Waiting for host to {isFinal ? "wrap up" : "advance"}…
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- FinalScreen ----------
function FinalScreen({ state, dispatch, deviceId, isHost }) {
  const sorted = state.players
    .map(p => ({ deviceId: p.deviceId, name: p.name, score: state.scores[p.deviceId] || 0 }))
    .sort((a, b) => b.score - a.score);

  const winnerScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter(s => s.score === winnerScore && winnerScore > 0);

  const confetti = useMemoApp(() =>
    new Array(28).fill(0).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      dur: 3 + Math.random() * 3,
      color: ["#7e3a8e","#d4a843","#fbbf24","#a855f7","#ffffff"][i % 5],
      rot: Math.random() * 360,
      key: i,
    })), []);

  const podium = sorted.slice(0, 3);
  const podiumOrder = [1, 0, 2];
  const heights = { 0: 132, 1: 96, 2: 72 };
  const podiumColors = [
    "from-amber-400 to-amber-600",
    "from-zinc-300 to-zinc-500",
    "from-orange-500 to-orange-700",
  ];

  return (
    <div className="fade-enter relative min-h-[100dvh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map(c => (
          <div key={c.key} className="confetti" style={{
            left: c.left + "%", background: c.color,
            animationDuration: c.dur + "s", animationDelay: c.delay + "s",
            transform: `rotate(${c.rot}deg)`, borderRadius: "2px",
          }} />
        ))}
      </div>

      <TopBar subtitle="Final score" />

      <div className="mx-6 mt-2 rounded-3xl border border-amber-400/40 bg-gradient-to-b from-purple-600/[0.30] to-amber-500/[0.06] p-6 grain relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-amber-400/25 blur-3xl"></div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-amber-200/90">
          {winners.length > 1 ? "It's a tie" : "Winner"}
        </div>
        <div className="mt-1 text-4xl font-semibold tracking-tight leading-tight">
          {winners.length === 0 ? "Nobody, somehow" : winners.map(w => w.name).join(" & ")}
        </div>
        <div className="mt-2 text-sm text-white/65 tabular">
          {winnerScore} point{winnerScore === 1 ? "" : "s"} · taste validated.
        </div>
      </div>

      {podium.length >= 2 && (
        <div className="mt-6 px-6">
          <div className="flex items-end justify-center gap-2 h-[200px]">
            {podiumOrder.map(idx => {
              const row = podium[idx];
              if (!row) return <div key={idx} className="flex-1" />;
              return (
                <div key={row.deviceId} className="flex-1 flex flex-col items-center justify-end">
                  <div className="mb-2 flex flex-col items-center">
                    <Avatar name={row.name} size={idx === 0 ? 48 : 36} />
                    <div className="mt-1 text-xs font-medium truncate max-w-[100px] text-center">{row.name}</div>
                    <div className="text-[10px] text-white/40 font-mono tabular">{row.score} pt{row.score === 1 ? "" : "s"}</div>
                  </div>
                  <div
                    className={cx("w-full rounded-t-lg pt-2 font-black text-black/60 text-xl text-center bg-gradient-to-b", podiumColors[idx])}
                    style={{ height: heights[idx] }}
                  >{idx + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 px-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">All standings</div>
        <div className="mt-3 space-y-2">
          {sorted.map((row, i) => {
            const isWinner = row.score === winnerScore && winnerScore > 0;
            return (
              <div key={row.deviceId} className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                isWinner ? "border-purple-500/50 bg-purple-600/[0.12]" : "border-white/10 bg-white/[0.03]"
              )}>
                <div className={cx(
                  "w-7 h-7 rounded-full grid place-items-center text-xs font-semibold tabular",
                  i === 0 ? "bg-amber-400/20 text-amber-300" :
                  i === 1 ? "bg-zinc-400/20 text-zinc-200" :
                  i === 2 ? "bg-orange-400/20 text-orange-300" :
                            "bg-white/[0.05] text-white/40"
                )}>{i + 1}</div>
                <Avatar name={row.name} size={26} />
                <div className="text-sm font-medium flex-1 truncate">
                  {row.name}
                  {row.deviceId === deviceId && <span className="ml-1 text-[10px] text-amber-300/80">you</span>}
                </div>
                <div className="text-sm font-mono tabular">{row.score}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 pt-8 pb-10">
        {isHost ? (
          <button onClick={() => dispatch({ type: "reset" })} className="w-full rounded-xl py-4 text-base font-semibold transition bg-white text-black hover:bg-white/90">
            Play again
          </button>
        ) : (
          <div className="w-full rounded-xl py-4 text-center bg-white/[0.03] border border-white/10 text-white/55 text-sm">
            Waiting for host to start a new round…
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- GameView (after start screen, with session) ----------
function GameView({ choice, onReset }) {
  const mode = useMemoApp(() => ({ kind: choice.kind, code: choice.code }), [choice.kind, choice.code]);
  const { deviceId, state, dispatch, status, isHost } = useSession(mode, choice.name);

  // Splash auto-advances; only host triggers it
  const enterRound = useRefApp(() => {});
  useEffectApp(() => {
    enterRound.current = () => dispatch({ type: "enterRound", now: performance.now() });
  }, [dispatch]);

  if (status.kind !== "ready") {
    return <ConnectionGate status={status} mode={mode} onReset={onReset} />;
  }

  const common = { state, dispatch, deviceId, isHost, code: choice.code, mode };

  return (
    <>
      {state.phase === "lobby" && <LobbyScreen {...common} />}
      {state.phase === "splash" && (
        <SplashScreen
          roundNumber={state.roundIdx + 1}
          totalRounds={state.order.length}
          onDone={() => enterRound.current && enterRound.current()}
          isHost={isHost}
        />
      )}
      {state.phase === "round" && <RoundScreen {...common} />}
      {state.phase === "results" && <ResultsScreen {...common} />}
      {state.phase === "final" && <FinalScreen {...common} />}
    </>
  );
}

// ---------- App ----------
function App() {
  const [choice, setChoice] = useStateApp(null);
  return (
    <div className="shell">
      {!choice && <StartScreen onChoose={setChoice} />}
      {choice && <GameView choice={choice} onReset={() => setChoice(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
