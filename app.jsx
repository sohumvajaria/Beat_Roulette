// Beat Roulette, UI

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp, useMemo: useMemoApp, useCallback: useCallbackApp, useReducer: useReducerApp } = React;

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

// ---------- Homepage: Roulette Wheel SVG ----------
function WheelSVG() {
  const SEGMENTS = 12;
  // gold, magenta, neon green, paper-white, cycled
  const palette = ["#F5C518", "#FF2D95", "#1DB954", "#F4ECD3"];
  // Note glyphs alternate
  const notes = ["\u266A", "\u266B", "\u266C", "\u2669"];
  const cx0 = 200, cy0 = 200;
  const rOuter = 180, rInner = 56;

  const segs = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const a0 = (i * 360 / SEGMENTS - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 360 / SEGMENTS - 90) * Math.PI / 180;
    const x0o = cx0 + rOuter * Math.cos(a0), y0o = cy0 + rOuter * Math.sin(a0);
    const x1o = cx0 + rOuter * Math.cos(a1), y1o = cy0 + rOuter * Math.sin(a1);
    const x0i = cx0 + rInner * Math.cos(a0), y0i = cy0 + rInner * Math.sin(a0);
    const x1i = cx0 + rInner * Math.cos(a1), y1i = cy0 + rInner * Math.sin(a1);
    const d = `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 0 0 ${x0i} ${y0i} Z`;
    const am = (a0 + a1) / 2;
    const rMid = (rOuter * 0.78 + rInner) / 1.6;
    const mx = cx0 + rMid * Math.cos(am);
    const my = cy0 + rMid * Math.sin(am);
    const fill = palette[i % palette.length];
    const dark = fill === "#F4ECD3" ? "#1a0d22" : "#0b0710";
    segs.push({ d, fill, mx, my, note: notes[i % notes.length], textColor: dark, rotDeg: (i * 360 / SEGMENTS) + 15 });
  }

  // Rivets on outer ring
  const rivets = Array.from({ length: 24 }, (_, i) => {
    const ang = (i * 360 / 24) * Math.PI / 180;
    const rR = 192;
    return { x: cx0 + rR * Math.cos(ang), y: cy0 + rR * Math.sin(ang) };
  });

  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="hubGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F8D85A" />
          <stop offset="55%" stopColor="#F5C518" />
          <stop offset="100%" stopColor="#9A7505" />
        </radialGradient>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1326" />
          <stop offset="100%" stopColor="#08060d" />
        </linearGradient>
      </defs>

      {/* Outer dark ring */}
      <circle cx={cx0} cy={cy0} r={196} fill="url(#ringGrad)" stroke="#000" strokeWidth="2" />
      <circle cx={cx0} cy={cy0} r={184} fill="none" stroke="#F5C518" strokeWidth="1.5" opacity="0.9" />

      {/* Segments */}
      <g>
        {segs.map((s, i) => (
          <g key={i}>
            <path d={s.d} fill={s.fill} stroke="#08080C" strokeWidth="2" />
            <g transform={`translate(${s.mx} ${s.my}) rotate(${s.rotDeg})`}>
              <text
                x="0" y="6"
                textAnchor="middle"
                fontFamily="'Bricolage Grotesque', sans-serif"
                fontSize="34"
                fill={s.textColor}
                style={{ paintOrder: "stroke", stroke: s.fill === "#F4ECD3" ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.2)", strokeWidth: 0.5 }}
              >{s.note}</text>
            </g>
          </g>
        ))}
      </g>

      {/* Inner hub */}
      <circle cx={cx0} cy={cy0} r={rInner} fill="url(#hubGrad)" stroke="#08080C" strokeWidth="3" />
      <circle cx={cx0} cy={cy0} r={rInner - 8} fill="none" stroke="#08080C" strokeWidth="1" opacity="0.4" />
      <text
        x={cx0} y={cy0 + 9}
        textAnchor="middle"
        fontFamily="'Bricolage Grotesque', sans-serif"
        fontSize="32"
        fill="#08080C"
        fontWeight="800"
        letterSpacing="2"
      >BR</text>

      {/* Rivets */}
      {rivets.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r="2.2" fill="#F5C518" opacity="0.85" />
      ))}
    </svg>
  );
}

function WheelPin() {
  return (
    <svg viewBox="0 0 60 80" width="44" height="58" aria-hidden="true">
      <defs>
        <linearGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE587" />
          <stop offset="55%" stopColor="#F5C518" />
          <stop offset="100%" stopColor="#8E6904" />
        </linearGradient>
      </defs>
      {/* Pin body, triangle pointing down */}
      <path d="M30 70 L8 18 Q30 6 52 18 Z" fill="url(#pinGrad)" stroke="#08080C" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 70 L20 32" stroke="rgba(0,0,0,0.25)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="14" r="6" fill="#F5C518" stroke="#08080C" strokeWidth="2.5" />
    </svg>
  );
}

function DriftingNotes({ count = 18 }) {
  const items = useMemoApp(() => {
    const glyphs = ["\u266A", "\u266B", "\u266C", "\u2669", "\u266E"];
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: Math.random() * 100,
      size: 18 + Math.random() * 36,
      delay: -Math.random() * 22,
      dur: 18 + Math.random() * 16,
      rot: Math.random() * 360 - 180,
      dx: (Math.random() * 80 - 40) + "px",
      op: 0.18 + Math.random() * 0.28,
      glyph: glyphs[i % glyphs.length],
      color: i % 7 === 0 ? "rgba(245,197,24,0.7)" : i % 5 === 0 ? "rgba(255,45,149,0.55)" : i % 3 === 0 ? "rgba(29,185,84,0.55)" : "rgba(255,255,255,0.55)",
    }));
  }, [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map(it => (
        <span
          key={it.key}
          className="drift-note"
          style={{
            left: it.left + "%",
            bottom: "-10vh",
            fontSize: it.size + "px",
            color: it.color,
            animationDelay: it.delay + "s",
            animationDuration: it.dur + "s",
            "--rot": it.rot + "deg",
            "--dx": it.dx,
            "--op": it.op,
          }}
        >{it.glyph}</span>
      ))}
    </div>
  );
}

function HpStageBackdrop({ noteCount = 18, topStrip = true, bottomStrip = false }) {
  return (
    <div className="hp-stage-backdrop hp-vignette hp-grain" aria-hidden="true">
      <DriftingNotes count={noteCount} />
      {topStrip && (
        <div className="absolute top-0 left-0 right-0 h-[26px] hp-screenprint pointer-events-none" />
      )}
      {bottomStrip && (
        <div className="absolute bottom-0 left-0 right-0 h-[14px] hp-screenprint pointer-events-none" />
      )}
    </div>
  );
}

// Generic disc/sound-wave glyph (NOT the Spotify wordmark)
function MusicDiscGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path d="M7 14.2c2.7-1 5.7-1.1 8.6-.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.4 11c3.3-1 7-1 10 .3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 7.8c3.4-.6 6.9-.2 9.6 1.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const initials = (name) => {
  const parts = (name || "?").trim().split(/\s+/);
  return (parts[0]?.[0] || "?").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
};
const AVATAR_HUES = [280, 320, 250, 200, 160, 30, 350, 220, 120, 60];
const colorFor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = AVATAR_HUES[Math.abs(h) % AVATAR_HUES.length];
  return `hsl(${hue} 32% 52%)`;
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

// ---------- Deezer (JSONP first, then CORS proxies) ----------
const DEEZER_API = "https://api.deezer.com";
const DEEZER_SEARCH_RETRY_MSG =
  "Deezer search unavailable, check your connection and try again.";

async function fetchJsonWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry a JSON fetch on any failure, network error, timeout (abort), or a
// non-OK response, backing off between attempts. Defaults to two retries
// (~400ms then ~900ms) so an intermittent rate-limit or flaky CORS proxy
// doesn't lose data that's actually there. Re-throws the last error if every
// attempt fails, so callers can fall through to the next proxy or classify
// the failure as transient.
async function fetchJsonWithRetry(url, timeoutMs, delays = [400, 900]) {
  let lastErr;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fetchJsonWithTimeout(url, timeoutMs);
    } catch (err) {
      lastErr = err;
      if (attempt < delays.length) await sleepMs(delays[attempt]);
    }
  }
  throw lastErr;
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

async function fetchDeezerApi(apiPath) {
  const directUrl = apiPath.startsWith("http") ? apiPath : `${DEEZER_API}${apiPath}`;
  try {
    return await deezerJsonp(directUrl);
  } catch (e) {}

  const proxyTimeout = 7000;
  const proxies = [
    (target) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
    (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  ];
  for (const toProxy of proxies) {
    try {
      return await fetchJsonWithTimeout(toProxy(directUrl), proxyTimeout);
    } catch (err) {}
  }
  throw new Error("deezer_unavailable");
}

async function deezerSearch(query, limit = 25) {
  return fetchDeezerApi(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

function normalizeDeezerTrack(track) {
  if (!track) return null;
  const title = (track.title_short || track.title || "").trim();
  if (!title) return null;
  const artist = (track.artist && track.artist.name) ? track.artist.name.trim() : "";
  return {
    deezerId: String(track.id),
    title,
    artist: artist || "Unknown artist",
    cover: (track.album && (track.album.cover_small || track.album.cover_medium || track.album.cover)) || null,
    preview: track.preview || null,
  };
}

async function searchTracks(query) {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await deezerSearch(q, 14);
    const tracks = ((res && res.data) || [])
      .map(normalizeDeezerTrack)
      .filter(Boolean);
    tracks.sort((a, b) => (b.preview ? 1 : 0) - (a.preview ? 1 : 0));
    return tracks.slice(0, 8);
  } catch (e) {
    return [];
  }
}
function deezerArtistSearch(name) {
  return fetchDeezerApi(`/search/artist?q=${encodeURIComponent(name)}&limit=1`);
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

// ---------- Song search autocomplete (Deezer) ----------
function SongSearchPicker({ variant, onAdd, disabled, error, onClearError, autoFocus, onOpenChange }) {
  const isHome = variant === "home";
  const [query, setQuery] = useStateApp("");
  const [results, setResults] = useStateApp([]);
  const [searching, setSearching] = useStateApp(false);
  const [adding, setAdding] = useStateApp(false);
  const [open, setOpen] = useStateApp(false);
  const [activeIdx, setActiveIdx] = useStateApp(-1);
  const wrapRef = useRefApp(null);
  const inputRef = useRefApp(null);
  const debounceRef = useRefApp(null);
  const reqIdRef = useRefApp(0);

  useEffectApp(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    setSearching(true);
    setOpen(true);
    const reqId = ++reqIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const tracks = await searchTracks(q);
      if (reqId !== reqIdRef.current) return;
      setResults(tracks);
      setSearching(false);
      setActiveIdx(-1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffectApp(() => {
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  const pickTrack = async (track) => {
    if (!track || adding || disabled) return;
    setAdding(true);
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIdx(-1);
    if (onClearError) onClearError();
    try {
      await onAdd({
        title: track.title,
        artist: track.artist,
        url: track.preview,
        cover: track.cover,
        noPreview: !track.preview,
      });
      if (onOpenChange) onOpenChange(false);
    } finally {
      setAdding(false);
      if (inputRef.current && !disabled) inputRef.current.focus();
    }
  };

  const onInputKeyDown = (e) => {
    if (!open || results.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pickTrack(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const inputClass = isHome
    ? "w-full rounded-lg bg-black/45 border border-[var(--border-neutral)] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--hp-gold)] focus:bg-black/60 transition"
    : "w-full rounded-lg bg-[#282828] border border-[#3a3a3a] px-3 py-2.5 text-sm outline-none placeholder:text-[#535353] focus:border-[#1DB954] focus:bg-[#3a3a3a] transition";

  const panelClass = isHome
    ? "mt-2 rounded-xl border border-[var(--border-neutral)] bg-[#0a0a10] overflow-hidden"
    : "mt-2 rounded-xl border border-[#3a3a3a] bg-[#121212] overflow-hidden";

  const panelHeaderClass = isHome
    ? "px-3 py-2 border-b border-[var(--border-neutral)] bg-[#12121a] ui-label"
    : "px-3 py-2 border-b border-[var(--border-neutral)] bg-[#181818] ui-label";

  const panelListClass = isHome ? "bg-[#0a0a10]" : "bg-[#121212]";
  const panelRowBaseClass = isHome ? "bg-[#0a0a10]" : "bg-[#121212]";

  const showDropdown = open && query.trim().length >= 2;

  useEffectApp(() => {
    if (onOpenChange) onOpenChange(showDropdown);
  }, [showDropdown, onOpenChange]);

  useEffectApp(() => {
    return () => {
      if (onOpenChange) onOpenChange(false);
    };
  }, [onOpenChange]);

  if (isHome) {
    return (
      <div ref={wrapRef}>
        <label className="block">
          <div className="ui-label mb-1.5">Search song</div>
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={query}
              autoFocus={autoFocus}
              disabled={disabled || adding}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onClearError) onClearError();
              }}
              onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
              onKeyDown={onInputKeyDown}
              placeholder="Start typing a song name…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="song-suggest-input"
            />
            {(searching || adding) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--hp-gold)" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              </div>
            )}
          </div>
        </label>

        {showDropdown && (
          <div className="song-suggest-panel" role="listbox">
            <div className="song-suggest-panel-header">
              {searching ? "Searching…" : `${results.length} suggestion${results.length === 1 ? "" : "s"}`}
            </div>
            <div className="song-suggest-list">
              {!searching && results.length === 0 && (
                <div className="px-3 py-4 text-center ui-body">
                  No matches, try another spelling
                </div>
              )}
              {results.map((track, i) => {
                const active = i === activeIdx;
                return (
                  <button
                    key={track.deezerId}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => pickTrack(track)}
                    className={cx("song-suggest-row", active && "is-active")}
                  >
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-[var(--border-neutral)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-md shrink-0 border border-[var(--border-neutral)] bg-[#282828]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{track.title}</div>
                      <div className="text-[11px] truncate text-white/55">{track.artist}</div>
                    </div>
                    {!track.preview && (
                      <span className="shrink-0 ui-label text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a36]">
                        no preview
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!showDropdown && (
          <div className="mt-2 flex items-center gap-2 ui-body text-[12px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Pick a match, cover, artist &amp; preview load automatically</span>
          </div>
        )}

        {error && (
          <div className="mt-2 ui-body text-[var(--hp-magenta)]">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative isolate">
      <label className="block">
        <div className="ui-label mb-1.5">Search song</div>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            disabled={disabled || adding}
            onChange={(e) => {
              setQuery(e.target.value);
              if (onClearError) onClearError();
            }}
            onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
            onKeyDown={onInputKeyDown}
            placeholder="Start typing a song name…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
          />
          {(searching || adding) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "#1DB954" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
            </div>
          )}
        </div>
      </label>

      {showDropdown && (
        <div className={panelClass} role="listbox">
          <div className={panelHeaderClass}>
            {searching ? "Searching…" : `${results.length} suggestion${results.length === 1 ? "" : "s"}`}
          </div>
          <div className={cx("max-h-[min(260px,40vh)] overflow-y-auto overscroll-contain", panelListClass)}>
            {!searching && results.length === 0 && (
              <div className="px-3 py-4 text-sm text-center text-white/45">
                No matches, try another spelling
              </div>
            )}
            {results.map((track, i) => {
              const active = i === activeIdx;
              return (
                <button
                  key={track.deezerId}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pickTrack(track)}
                  className={cx(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left border-b last:border-b-0 transition",
                    "border-[#282828]",
                    active ? "bg-[#1f1f1f]" : `${panelRowBaseClass} hover:bg-[#1a1a1a]`
                  )}
                >
                  {track.cover ? (
                    <img src={track.cover} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-[var(--border-neutral)]" />
                  ) : (
                    <div className="w-10 h-10 rounded-md shrink-0 border bg-[#282828] border-[#3a3a3a]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate text-white">{track.title}</div>
                    <div className="text-[11px] truncate text-white/55">{track.artist}</div>
                  </div>
                  {!track.preview && (
                    <span className="shrink-0 ui-label text-[10px] px-1.5 py-0.5 rounded bg-[#282828] text-[#535353]">
                      no preview
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showDropdown && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/40">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Pick a match, cover, artist &amp; preview load automatically</span>
        </div>
      )}

      {error && (
        <div className={cx(
          "mt-2",
          isHome
            ? "ui-body text-[var(--hp-magenta)]"
            : "text-[12px] text-rose-400"
        )}>{error}</div>
      )}
    </div>
  );
}

// ---------- Atoms ----------
function Avatar({ name, size = 36, dim = false }) {
  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-white shrink-0"
      style={{
        width: size, height: size,
        background: colorFor(name),
        fontSize: size * 0.4,
        opacity: dim ? 0.4 : 1,
        boxShadow: `0 2px 6px rgba(0,0,0,0.4)`,
      }}
    >
      {initials(name)}
    </div>
  );
}

function TopBar({ subtitle, right, onBack, backLabel }) {
  return (
    <div className="px-6 pt-6 pb-3 flex items-start justify-between relative z-10 gap-2">
      <div className="flex items-start gap-2 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            aria-label={backLabel || "Back"}
            className="shrink-0 w-8 h-8 -ml-1 grid place-items-center rounded-full bg-[#282828] hover:bg-[#3a3a3a] active:scale-95 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1DB954] grid place-items-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-black"></div>
            </div>
            <div className="text-[15px] font-semibold tracking-tight truncate">Beat Roulette</div>
          </div>
          {subtitle && (
            <div className="mt-1 ui-body truncate">{subtitle}</div>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, maxLength, autoFocus }) {
  return (
    <label className="block">
      <div className="ui-label mb-1">{label}</div>
      <input
        value={value}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg bg-[#282828] border border-[#3a3a3a] px-3 py-2.5 text-sm outline-none",
          "placeholder:text-[#535353] focus:border-[#1DB954] focus:bg-[#3a3a3a] transition",
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
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(18,18,18,0.45) 0%, rgba(18,18,18,0.65) 30%, rgba(18,18,18,0.92) 65%, var(--bg) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.04), transparent 60%)" }} />
          <div className="absolute bottom-2 left-0 right-0 text-center ui-body text-[11px] opacity-50">ft. {photo.name}</div>
        </>
      )}
      {!photo && (
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 40% at 50% 10%, rgba(40,40,40,0.6), transparent 70%)" }} />
      )}
    </div>
  );
}

// ---------- Home-style stage (local / cinematic flows) ----------
function HomeStageShell({ children }) {
  return (
    <div className="hp-stage relative h-full max-h-[100dvh] overflow-hidden fade-enter flex flex-col">
      <HpStageBackdrop topStrip bottomStrip />
      <div className="hp-stage-inner relative z-10 flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">{children}</div>
    </div>
  );
}

function HomeHeader({ subtitle, onBack, backLabel, right }) {
  return (
    <>
      <div className="hp-header-bar pt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label={backLabel || "Back"}
              className="shrink-0 w-9 h-9 -ml-0.5 grid place-items-center rounded-full border border-[var(--border-neutral)] bg-black/40 hover:bg-black/60 hover:border-[var(--hp-gold)] active:scale-95 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-[var(--hp-gold)] shrink-0"></div>
          <div className="font-display landing-nav tracking-[0.32em] text-white/85 truncate">BEAT ROULETTE</div>
        </div>
        {right}
      </div>
      {subtitle && (
        <div className="hp-header-bar mt-1 ui-body">{subtitle}</div>
      )}
    </>
  );
}

function HpPanel({ children, className, center }) {
  return (
    <div className={cx(
      "theme-panel bg-black/40 backdrop-blur-sm p-4 relative",
      center && "text-center",
      className
    )}>
      {children}
    </div>
  );
}

function HpField({ label, value, onChange, placeholder, mono, maxLength, autoFocus }) {
  return (
    <label className="block">
      <div className="ui-label mb-1.5">{label}</div>
      <input
        value={value}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg bg-black/45 border border-[var(--border-neutral)] px-3 py-2.5 text-sm text-white outline-none",
          "placeholder:text-white/30 focus:border-[var(--hp-gold)] focus:bg-black/60 transition",
          mono && "font-mono text-[14px] tracking-[0.2em] uppercase"
        )}
      />
    </label>
  );
}

function HpPrimaryBtn({ children, onClick, disabled, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full rounded-xl px-5 py-3.5 font-semibold tracking-wide text-base transition",
        disabled
          ? "bg-white/10 text-white/35 cursor-not-allowed border border-[var(--border-neutral)]"
          : "btn-spotify",
        className
      )}
    >
      {children}
    </button>
  );
}

function HpGoldBtn({ children, onClick, disabled, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full rounded-xl px-5 py-3.5 font-semibold tracking-wide text-base transition",
        disabled
          ? "border border-[var(--border-neutral)] text-white/35 cursor-not-allowed"
          : "btn-gold",
        className
      )}
    >
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

function HpMutedBtn({ children, onClick, disabled, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full rounded-xl px-5 py-3 text-sm font-medium border transition",
        disabled
          ? "border-[var(--border-neutral)] bg-black/20 text-white/30 cursor-not-allowed"
          : "border-[var(--border-neutral)] bg-black/35 text-[var(--text-body)] hover:border-[var(--hp-gold)] hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

function HpSectionTitle({ children }) {
  return (
    <h1
      className="font-display text-white leading-[0.92] tracking-[0.01em]"
      style={{ fontSize: "clamp(32px, 9vw, 48px)" }}
    >
      {children}
    </h1>
  );
}

function HpSectionDesc({ children }) {
  return (
    <p className="ui-body mt-2">
      {children}
    </p>
  );
}

function RoundsPicker({ value, onChange }) {
  return (
    <div className="theme-panel bg-[#16161e] p-4">
      <div className="ui-label mb-3">Songs per player</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cx(
              "min-w-[52px] h-[52px] rounded-xl text-[26px] tabular font-semibold border transition",
              value === n
                ? "bg-[var(--hp-gold)] text-[#08080C] border-[var(--hp-gold)]"
                : "bg-[#22222c] text-white/80 border-[var(--border-neutral)] hover:bg-[var(--hp-gold)] hover:text-[#08080C] hover:border-[var(--hp-gold)]"
            )}
          >{n}</button>
        ))}
      </div>
      <div className="mt-4 text-center ui-body">
        Each player adds {value} song{value === 1 ? "" : "s"} across {value} round{value === 1 ? "" : "s"}.
      </div>
    </div>
  );
}

function PlayerCountSlider({ value, onChange }) {
  return (
    <div className="theme-panel bg-[#16161e] p-4">
      <div className="ui-label mb-3">How many players?</div>
      <div className="flex items-center gap-4">
        <span className="ui-label w-4 text-right opacity-60">3</span>
        <input
          type="range"
          min={3}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="player-count-slider flex-1"
          aria-label="Number of players"
        />
        <span className="ui-label w-6 opacity-60">10</span>
      </div>
      <div className="mt-4 text-center">
        <span className="font-display text-[44px] leading-none tabular" style={{ color: "var(--hp-gold)" }}>{value}</span>
        <span className="ml-2 ui-body">
          player{value === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

// ---------- Home mode cards ----------
function ModeIconBlitz() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ModeIconParty() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5M14 20c0-2.5 1.5-4 4-4" strokeLinecap="round" />
    </svg>
  );
}

function ModeIconStage() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="2" width="6" height="10" rx="3" />
      <path d="M6 12h12v2a6 6 0 0 1-12 0v-2z" />
      <line x1="12" y1="20" x2="12" y2="22" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" />
    </svg>
  );
}

function HomeModeCard({ title, description, icon, onClick, delayClass, variant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "home-mode-card btn-in w-full rounded-2xl text-left bg-black/45 backdrop-blur-sm",
        variant === "blitz" && "home-mode-card--blitz",
        variant === "party" && "home-mode-card--party",
        variant === "stage" && "home-mode-card--stage",
        delayClass
      )}
    >
      <div className="home-mode-card__inner">
        <div
          className="home-mode-card__icon rounded-xl grid place-items-center shrink-0"
          style={{ background: "rgba(var(--mode-accent-rgb), 0.14)", color: "var(--mode-accent)" }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="home-mode-card__title font-display tracking-[0.12em]"
            style={{ color: "var(--mode-accent)" }}
          >
            {title}
          </div>
          <div className="home-mode-card__desc mt-1">
            {description}
          </div>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--mode-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          className="home-mode-card__arrow shrink-0 mt-1"
        >
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </button>
  );
}

// ---------- HomeScreen, cinematic landing ----------
function getWheelRotationDeg(el) {
  const tr = window.getComputedStyle(el).transform;
  if (!tr || tr === "none") return 0;
  const m = new DOMMatrixReadOnly(tr);
  let deg = Math.atan2(m.b, m.a) * (180 / Math.PI);
  if (deg < 0) deg += 360;
  return deg;
}

const WHEEL_IDLE_MS_PER_REV = 22000;
const WHEEL_IDLE_DEG_PER_MS = 360 / WHEEL_IDLE_MS_PER_REV;
const WHEEL_SPIN_DECAY_PER_MS = 0.00105;
const WHEEL_SPIN_BOOST_DEG_PER_MS = 1.2;
const WHEEL_SPIN_MIN_BOOST_MS = 3200;
const WHEEL_SPIN_IDLE_SETTLE_MS = 2800;

function setWheelTransform(el, angleDeg) {
  el.style.transform = `rotate3d(0, 0, 1, ${angleDeg}deg)`;
}

function HomeScreen({ onPartyMode, onBlitzMode, onStageMode }) {
  const [howToOpen, setHowToOpen] = useStateApp(false);
  const wheelRef = useRefApp(null);
  const wheelMotionRef = useRefApp({
    angle: 0,
    velocity: WHEEL_IDLE_DEG_PER_MS,
    lastTs: null,
    rafId: null,
    nearIdleMs: 0,
    totalBoostMs: 0,
  });

  const stopWheelRaf = () => {
    const motion = wheelMotionRef.current;
    if (motion.rafId !== null) cancelAnimationFrame(motion.rafId);
    motion.rafId = null;
  };

  const resumeCssIdleSpin = (el) => {
    const motion = wheelMotionRef.current;
    const settledDeg = ((motion.angle % 360) + 360) % 360;
    el.style.willChange = "";
    el.style.transform = "";
    el.classList.remove("wheel-spin-js");
    el.style.setProperty("--wheel-start", `${settledDeg}deg`);
    void el.offsetWidth;
    el.classList.add("wheel-spin");
    motion.velocity = WHEEL_IDLE_DEG_PER_MS;
    motion.nearIdleMs = 0;
    motion.totalBoostMs = 0;
  };

  useEffectApp(() => {
    const el = wheelRef.current;
    if (!el) return;
    el.classList.add("wheel-spin");
    return () => stopWheelRaf();
  }, []);

  const handlePressSpin = () => {
    const el = wheelRef.current;
    if (!el) return;

    const motion = wheelMotionRef.current;
    stopWheelRaf();

    const startAngle = getWheelRotationDeg(el);
    motion.angle = startAngle;
    motion.velocity = Math.max(WHEEL_IDLE_DEG_PER_MS * 52, WHEEL_SPIN_BOOST_DEG_PER_MS);
    motion.lastTs = null;
    motion.nearIdleMs = 0;
    motion.totalBoostMs = 0;

    el.classList.remove("wheel-spin");
    el.classList.add("wheel-spin-js");
    el.style.willChange = "transform";
    setWheelTransform(el, startAngle);

    const tick = (ts) => {
      if (motion.lastTs === null) motion.lastTs = ts;
      let dt = ts - motion.lastTs;
      motion.lastTs = ts;
      if (dt > 20) dt = 20;

      motion.totalBoostMs += dt;

      if (motion.velocity > WHEEL_IDLE_DEG_PER_MS * 1.01) {
        motion.velocity = WHEEL_IDLE_DEG_PER_MS
          + (motion.velocity - WHEEL_IDLE_DEG_PER_MS) * Math.exp(-WHEEL_SPIN_DECAY_PER_MS * dt);
        motion.nearIdleMs = 0;
      } else {
        motion.velocity = WHEEL_IDLE_DEG_PER_MS;
        motion.nearIdleMs += dt;
      }

      motion.angle += motion.velocity * dt;
      setWheelTransform(el, motion.angle);

      if (
        motion.totalBoostMs >= WHEEL_SPIN_MIN_BOOST_MS
        && motion.nearIdleMs >= WHEEL_SPIN_IDLE_SETTLE_MS
      ) {
        stopWheelRaf();
        resumeCssIdleSpin(el);
        return;
      }

      motion.rafId = requestAnimationFrame(tick);
    };

    motion.rafId = requestAnimationFrame(tick);
  };

  return (
    <div className="home-viewport hp-stage relative h-full w-full max-w-full overflow-hidden flex flex-col">
      <HpStageBackdrop topStrip />

      <div className="landing-layout relative z-10 flex-1 min-h-0">
        {/* Copy, left on desktop, below wheel on mobile */}
        <div className="landing-copy px-6 md:px-0 text-center md:text-left">
          <h1 className="fade-up landing-title font-display text-white tracking-[0.01em]">
            BEAT<br/>
            <span style={{ color: "var(--hp-gold)" }}>ROULETTE</span>
          </h1>
          <div className="fade-up d1 landing-tagline-block ui-body">
            <span style={{ color: "var(--hp-magenta)" }}>★</span> Name the tune and win the night. <span style={{ color: "var(--hp-magenta)" }}>★</span>
          </div>

          <div className="landing-cta-group mode-cards-grid relative z-10">
            <HomeModeCard
              variant="blitz"
              title="BLITZ MODE"
              description="Spin the wheel, name the tune. Quick matches, up to 5 rounds."
              icon={<ModeIconBlitz />}
              onClick={onBlitzMode}
              delayClass="btn-in s1"
            />
            <HomeModeCard
              variant="party"
              title="PARTY MODE"
              description="Everyone plays on their own phone. Host a room or join one."
              icon={<ModeIconParty />}
              onClick={onPartyMode}
              delayClass="btn-in s2"
            />
            <HomeModeCard
              variant="stage"
              title="STAGE MODE"
              description="Pick a song, sing the preview, get a pitch score."
              icon={<ModeIconStage />}
              onClick={onStageMode}
              delayClass="btn-in s3"
            />
          </div>

          <div className="relative z-10 mt-4 flex justify-center md:justify-start">
            <button
              type="button"
              onClick={() => setHowToOpen(true)}
              className="btn-in s3 inline-flex items-center gap-2 rounded-full border border-[var(--hp-gold)]/60 bg-[var(--hp-gold)]/10 backdrop-blur-sm px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--hp-gold)] transition hover:border-[var(--hp-gold)] hover:bg-[var(--hp-gold)]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hp-gold)]"
              style={{ boxShadow: "0 6px 24px -8px rgba(245, 197, 24, 0.45)" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              How to play
            </button>
          </div>
        </div>

        {/* Wheel + pin, right on desktop */}
        <div className="landing-wheel relative z-10">
          <button
            type="button"
            onClick={handlePressSpin}
            aria-label="Press spin"
            className="absolute right-0 md:-right-2 top-0 z-20 hidden sm:grid star-burst cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hp-gold)]"
          >
            <span className="text-white pointer-events-none leading-none">
              <span className="block text-[11px] tracking-[0.08em]">PRESS</span>
              <span className="block text-[24px] mt-0.5">SPIN</span>
            </span>
          </button>

          <div className="wheel-size">
            <div className="absolute inset-0 wheel-glow"></div>
            <div className="absolute inset-0 wheel-in">
              <div ref={wheelRef} className="absolute inset-0">
                <WheelSVG />
              </div>
              <div
                className="absolute left-1/2 z-10 -translate-x-1/2 pointer-events-none"
                style={{ top: "1%", marginTop: "-24px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}
              >
                <div className="pin-bounce inline-flex justify-center">
                  <WheelPin />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee strip at bottom */}
      <div className="hp-marquee-full relative z-10 shrink-0 border-y border-[var(--border-neutral)] bg-black/30 overflow-hidden">
        <div className="marquee-track flex whitespace-nowrap py-2 font-display tracking-[0.2em] text-[clamp(14px,2.5dvh,18px)]">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center shrink-0" style={{ width: "max-content" }}>
              {["NAME THAT TUNE", "SPIN", "GUESS", "SCORE", "NAME THAT TUNE", "SPIN", "REPEAT"].map((w, i) => (
                <span key={i} className="px-6 flex items-center gap-6" style={{
                  color: i % 3 === 0 ? "var(--hp-gold)" : i % 3 === 1 ? "var(--hp-magenta)" : "#fff"
                }}>
                  {w}
                  <span className="text-white/40">★</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom screen-print strip */}
      <div className="hp-home-footer hp-screenprint shrink-0" />

      {howToOpen && <HowToPlayModal onClose={() => setHowToOpen(false)} />}
    </div>
  );
}

// ---------- HowToPlayModal — mode rundown overlay ----------
const HOW_TO_PLAY_MODES = [
  {
    name: "Party Mode",
    accent: "#1DB954",
    description:
      "Everyone joins a room from their own phone and throws songs into the pool. Each round one plays and you guess who picked it. The faster you nail it the more you score, and if your song fools everyone, that pays off too.",
  },
  {
    name: "Blitz Mode",
    accent: "var(--hp-gold)",
    description:
      "A public match for up to 5 people. A chart song plays and you pick its title out of four. Answer correctly before everyone else to score the most.",
  },
  {
    name: "Stage Mode",
    accent: "#FF2D78",
    description:
      "Just you. Pick a song and sing its 30 second preview while the app scores your pitch and timing. If we have the lyrics they show on screen. If not, you freestyle.",
  },
];

function HowToPlayModal({ onClose }) {
  useEffectApp(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fade-enter fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
    >
      <div
        className="relative my-auto w-full max-w-md rounded-2xl border border-white/12 bg-[#12121a]/95 backdrop-blur-sm p-6 shadow-2xl"
        style={{ boxShadow: "0 24px 80px -16px rgba(0,0,0,0.85)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-black/40 text-white/55 transition hover:border-[var(--hp-magenta)] hover:text-[var(--hp-magenta)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hp-gold)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="font-display text-[34px] leading-none tracking-[0.1em] text-white">HOW TO PLAY</div>
        <div className="mt-1 h-px w-16 bg-[var(--hp-gold)]"></div>

        <div className="mt-6 space-y-6">
          {HOW_TO_PLAY_MODES.map((m) => (
            <div key={m.name}>
              <div
                className="font-display text-[24px] tracking-[0.1em]"
                style={{ color: m.accent }}
              >
                {m.name}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- StartScreen, BLITZ / PARTY / STAGE modes ----------
function StartScreen({ onChoose }) {
  const [view, setView] = useStateApp("home"); // home | party | host | join | blitz
  const [name, setName] = useStateApp("");
  const [code, setCode] = useStateApp("");
  const [roundPick, setRoundPick] = useStateApp(3);

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
    onChoose({
      game: "beat",
      kind: "host",
      code: randomCode(),
      name: name.trim(),
      songsPerPlayer: roundPick,
    });
  };
  const startJoin = () => {
    if (!name.trim() || code.trim().length < 4) return;
    onChoose({
      game: "beat",
      kind: "client",
      code: code.trim().toUpperCase(),
      name: name.trim(),
    });
  };

  // ---- Home view = cinematic landing ----
  if (view === "home") {
    return (
      <HomeScreen
        onPartyMode={() => setView("party")}
        onBlitzMode={() => setView("blitz")}
        onStageMode={() => onChoose({ game: "stage" })}
      />
    );
  }

  // ---- Multi-device: host or join ----
  if (view === "party") {
    return (
      <HomeStageShell>
        <HomeHeader onBack={() => setView("home")} backLabel="Back" />
        <div className="stage-content px-6 mt-4 flex-1">
          <HpSectionTitle>
            YOUR PHONE, <span style={{ color: "var(--hp-gold)" }}>YOUR TURN</span>
          </HpSectionTitle>
          <HpSectionDesc>
            Host a room, share the code, and everyone joins from their phone.
          </HpSectionDesc>
          <div className="mt-8 space-y-3">
            <HpPrimaryBtn onClick={() => setView("host")}>HOST A ROOM →</HpPrimaryBtn>
            <HpGoldBtn onClick={() => setView("join")}>JOIN WITH CODE →</HpGoldBtn>
          </div>
        </div>
      </HomeStageShell>
    );
  }

  if (view === "host") {
    return (
      <HomeStageShell>
        <HomeHeader subtitle="Hosting" onBack={() => setView("party")} backLabel="Back" />
        <div className="stage-content px-6 mt-4 flex-1 pb-8">
          <HpSectionTitle>
            OPEN A <span style={{ color: "var(--hp-gold)" }}>ROOM</span>
          </HpSectionTitle>
          <HpSectionDesc>
            Set the rounds, add your name, then send the code to your friends.
          </HpSectionDesc>
          <div className="mt-6 space-y-4">
            <RoundsPicker value={roundPick} onChange={setRoundPick} />
            <HpPanel>
              <HpField label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
            </HpPanel>
            <HpPrimaryBtn disabled={!name.trim()} onClick={startHost}>OPEN ROOM →</HpPrimaryBtn>
          </div>
        </div>
      </HomeStageShell>
    );
  }

  if (view === "join") {
    return (
      <HomeStageShell>
        <HomeHeader subtitle="Joining" onBack={() => setView("party")} backLabel="Back" />
        <div className="stage-content px-6 mt-4 flex-1 pb-8">
          <HpSectionTitle>
            GOT THE <span style={{ color: "var(--hp-gold)" }}>CODE?</span>
          </HpSectionTitle>
          <HpSectionDesc>
            Drop in the code and your name to join.
          </HpSectionDesc>
          <div className="mt-6 space-y-4">
            <HpPanel className="space-y-3">
              <HpField
                label="Room code"
                value={code}
                onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
                placeholder="ABCDE"
                mono
                maxLength={5}
                autoFocus
              />
              <HpField label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" maxLength={20} />
            </HpPanel>
            <HpGoldBtn disabled={!name.trim() || code.length < 4} onClick={startJoin}>
              JOIN PARTY →
            </HpGoldBtn>
          </div>
        </div>
      </HomeStageShell>
    );
  }

  if (view === "blitz") {
    return <BlitzModeSetupScreen onChoose={onChoose} onBack={() => setView("home")} />;
  }

  return null;
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
      <div className="mx-6 max-w-sm w-full rounded-2xl border border-[#282828] bg-[#181818] p-5 text-center">
        {status.kind === "error" ? (
          <>
            <div className="ui-label text-rose-400">Couldn't connect</div>
            <div className="mt-2 ui-body">{status.message || "Something went wrong."}</div>
            <button onClick={onReset} className="mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-black w-full">Back to start</button>
          </>
        ) : (
          <>
            <div className="mx-auto w-10 h-10 rounded-full border-2 border-[#282828] border-t-[#1DB954] animate-spin"></div>
            <div className="mt-3 ui-body">
              {mode.kind === "host" ? "Opening room" : mode.kind === "blitz" ? "Finding match" : "Joining room"}
            </div>
            <div className="mt-1 text-base font-medium tabular">{mode.code}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Blitz Mode ----------
const BLITZ_LENGTHS = [
  { id: "short", label: "Short", rounds: 3 },
  { id: "medium", label: "Medium", rounds: 5 },
  { id: "long", label: "Long", rounds: 7 },
];

function hashStringToSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const LOBBY_MUSIC_QUOTES = [
  { text: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { text: "Music can change the world because it can change people.", author: "Bono" },
  { text: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
  { text: "Music is the universal language of mankind.", author: "Henry Wadsworth Longfellow" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { text: "Music is what feelings sound like.", author: "Georgia Cates" },
  { text: "The only truth is music.", author: "Jack Kerouac" },
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { text: "Music expresses that which cannot be said and on which it is impossible to be silent.", author: "Victor Hugo" },
  { text: "If I were not a physicist, I would probably be a musician.", author: "Albert Einstein" },
  { text: "Music is the shorthand of emotion.", author: "Leo Tolstoy" },
  { text: "Where words leave off, music begins.", author: "Heinrich Heine" },
  { text: "Music is the divine way to tell beautiful, poetic things to the heart.", author: "Pablo Casals" },
  { text: "Music is the strongest form of magic.", author: "Marilyn Manson" },
  { text: "Music is life itself.", author: "Louis Armstrong" },
  { text: "Music is the moonlight in the gloomy night of life.", author: "Jean Paul Friedrich Richter" },
  { text: "After silence, that which comes nearest to expressing the inexpressible is music.", author: "Aldous Huxley" },
  { text: "Music washes away from the soul the dust of everyday life.", author: "Berthold Auerbach" },
  { text: "Music is the great uniter. An incredible force.", author: "Billy Joel" },
  { text: "Music is the soundtrack of your life.", author: "Dick Clark" },
];

function pickLobbyMusicQuote(roomCode) {
  const idx = hashStringToSeed("lobby-quote-v1-" + String(roomCode || "")) % LOBBY_MUSIC_QUOTES.length;
  return LOBBY_MUSIC_QUOTES[idx];
}

function blitzRoomIdForLength(lengthId) {
  return `blitz-${lengthId}`;
}

function BlitzLengthPicker({ value, onChange }) {
  const selected = BLITZ_LENGTHS.find(x => x.id === value) || BLITZ_LENGTHS[0];
  return (
    <div className="theme-panel bg-[#16161e] p-4">
      <div className="ui-label mb-3">Game length</div>
      <div className="grid grid-cols-3 gap-2">
        {BLITZ_LENGTHS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cx(
              "group rounded-xl px-2 py-3 text-center border transition",
              value === opt.id
                ? "bg-[var(--hp-gold)] text-[#08080C] border-[var(--hp-gold)]"
                : "bg-[#22222c] text-white/80 border-[var(--border-neutral)] hover:bg-[var(--hp-gold)] hover:text-[#08080C] hover:border-[var(--hp-gold)]"
            )}
          >
            <div className={cx(
              "font-semibold tracking-wide text-[17px] leading-none",
              value === opt.id ? "text-[#08080C]" : "text-white/80 group-hover:text-[#08080C]"
            )}>
              {opt.label.toUpperCase()}
            </div>
            <div className={cx(
              "mt-1 ui-body tabular text-[12px]",
              value === opt.id ? "text-[#08080C]/70" : "opacity-80 group-hover:text-[#08080C]/65"
            )}>
              {opt.rounds} RND
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center ui-body">
        {selected.rounds} round{selected.rounds === 1 ? "" : "s"} of chart hits, up to 5 players.
      </div>
    </div>
  );
}

function BlitzModeSetupScreen({ onChoose, onBack }) {
  const [name, setName] = useStateApp("");
  const [lengthId, setLengthId] = useStateApp("short");
  const selected = BLITZ_LENGTHS.find(x => x.id === lengthId) || BLITZ_LENGTHS[0];

  const start = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const roomId = blitzRoomIdForLength(lengthId);
    onChoose({
      game: "blitz",
      name: trimmed,
      lengthId,
      roundCount: selected.rounds,
      roomId,
      seed: hashStringToSeed(roomId),
    });
  };

  return (
    <HomeStageShell>
      <HomeHeader onBack={onBack} backLabel="Back" />
      <div className="stage-content px-6 mt-4 flex-1 pb-8">
        <HpSectionTitle>
          FIND A <span style={{ color: "var(--hp-gold)" }}>MATCH</span>
        </HpSectionTitle>
        <HpSectionDesc>
          Pick a length and a name. Once two people are in, everyone votes to start.
        </HpSectionDesc>

        <div className="mt-6 space-y-4">
          <BlitzLengthPicker value={lengthId} onChange={setLengthId} />
          <HpPanel>
            <HpField label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
          </HpPanel>
          <HpPrimaryBtn disabled={!name.trim()} onClick={start}>FIND MATCH →</HpPrimaryBtn>
        </div>
      </div>
    </HomeStageShell>
  );
}

function BlitzLobbyScreen({ state, dispatch, deviceId, onLeave }) {
  const players = state.players || [];
  const onlinePlayers = players.filter(p => p.online !== false);
  const songsReady = state.chartTracks && state.chartTracks.length >= 8;
  const canVote = onlinePlayers.length >= 2 && songsReady;
  const myVoted = !!(state.startVotes && state.startVotes[deviceId]);
  const voteCount = onlinePlayers.filter(p => state.startVotes && state.startVotes[p.deviceId]).length;
  const [now, setNow] = useStateApp(Date.now());

  useEffectApp(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const joinWindowEndsAtMs = state.joinWindowEndsAtMs;
  const joinWindowOpen = onlinePlayers.length >= 2 && joinWindowEndsAtMs && now < joinWindowEndsAtMs;
  const joinSecondsLeft = joinWindowOpen ? Math.max(0, Math.ceil((joinWindowEndsAtMs - now) / 1000)) : 0;

  const toggleVote = () => {
    dispatch({ type: "voteStart", voted: !myVoted, startedAtMs: Date.now() + 1500 });
  };

  return (
    <HomeStageShell>
      <HomeHeader
        onBack={onLeave}
        backLabel="Leave room"
      />

      <div className="stage-content px-6 mt-2 flex-1 pb-6">
        <HpSectionTitle>
          {onlinePlayers.length < 2 ? (
            <>WAITING FOR <span style={{ color: "var(--hp-gold)" }}>PLAYERS</span></>
          ) : (
            <>READY TO <span style={{ color: "var(--hp-magenta)" }}>VOTE</span></>
          )}
        </HpSectionTitle>
        <HpSectionDesc>
          {onlinePlayers.length < 2
            ? "You're in the room, waiting for at least one more player to join."
            : joinWindowOpen
              ? `${joinSecondsLeft}s left for others to join. Everyone must vote to start.`
              : "Everyone must vote to start the round."}
        </HpSectionDesc>

        <div className="mt-5">
          <div className="ui-label mb-2">
            In the room ({onlinePlayers.length}{joinWindowOpen ? `, ${joinSecondsLeft}s to join` : ""})
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {players.map(p => {
              const isMe = p.deviceId === deviceId;
              const hasVoted = !!(state.startVotes && state.startVotes[p.deviceId]);
              return (
                <div key={p.deviceId} className="flex flex-col items-center gap-1 min-w-[64px] shrink-0 pt-2">
                  <div className="relative overflow-visible">
                    <Avatar name={p.name} size={42} dim={p.online === false} />
                    {hasVoted && onlinePlayers.length >= 2 && (
                      <div
                        className="absolute -top-2 -right-1 text-[10px] rounded-full w-4 h-4 grid place-items-center font-semibold border border-[#08080C] z-10"
                        style={{ background: "var(--hp-gold)", color: "#08080C" }}
                      >✓</div>
                    )}
                  </div>
                  <div
                    className={cx("text-[11px] truncate max-w-[64px] font-medium", isMe ? "" : "text-white/75")}
                    style={isMe ? { color: "var(--hp-gold)" } : undefined}
                  >{p.name}</div>
                  <div className={cx(
                    "ui-label text-[11px]",
                    p.online === false ? "opacity-50" : hasVoted && onlinePlayers.length >= 2 ? "text-[var(--hp-gold)]" : ""
                  )}>
                    {p.online === false ? "Out" : hasVoted && onlinePlayers.length >= 2 ? "Voted" : "Here"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pb-2">
          {canVote ? (
            <>
              <HpPrimaryBtn onClick={toggleVote}>
                {myVoted ? "Revoke vote" : `Vote to start (${voteCount}/${onlinePlayers.length})`}
              </HpPrimaryBtn>
              {voteCount > 0 && voteCount < onlinePlayers.length && (
                <div className="mt-3 text-center ui-body">
                  Waiting for {onlinePlayers.length - voteCount} more vote{onlinePlayers.length - voteCount === 1 ? "" : "s"}…
                </div>
              )}
            </>
          ) : (
            <HpPanel center className="py-4">
              <HpSectionDesc>
                {!songsReady
                  ? "Loading chart tracks…"
                  : "Need at least 2 players before you can vote to start."}
              </HpSectionDesc>
            </HpPanel>
          )}
        </div>
      </div>
    </HomeStageShell>
  );
}

function BlitzRoundScreen({ state, dispatch, isCoordinator, deviceId, onLeave }) {
  const round = state.round;
  const tracks = state.chartTracks || [];
  const audioRef = useRefApp(null);
  const [now, setNow] = useStateApp(Date.now());
  const [playing, setPlaying] = useStateApp(false);
  const [audioError, setAudioError] = useStateApp(false);

  const correct = round ? tracks.find(t => t.deezerId === round.correctId) : null;
  const choices = round ? round.choiceIds.map(id => tracks.find(t => t.deezerId === id)).filter(Boolean) : [];

  useEffectApp(() => {
    const id = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(id);
  }, []);

  useEffectApp(() => {
    setAudioError(false);
    setPlaying(false);
    const a = audioRef.current;
    if (!a || !correct || !correct.preview) return;
    a.currentTime = 0;
    const p = a.play();
    if (p && p.then) p.then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [round && round.correctId]);

  useEffectApp(() => {
    const a = audioRef.current;
    if (!a) return;
    const onErr = () => { setAudioError(true); setPlaying(false); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("error", onErr);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("error", onErr);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  const msLeft = round ? Math.max(0, round.endsAtMs - now) : 0;
  const progress = round ? Math.max(0, Math.min(1, (now - round.startedAtMs) / 30000)) : 0;
  const secondsLeft = Math.ceil(msLeft / 1000);

  const onlinePlayers = (state.players || []).filter(p => p.online !== false).map(p => p.deviceId);
  const answersThisRound = state.answers && state.answers[state.roundIdx] ? state.answers[state.roundIdx] : {};
  const everyoneAnswered = onlinePlayers.length > 0 && onlinePlayers.every(id => answersThisRound[id]);

  useEffectApp(() => {
    if (!isCoordinator) return;
    if (state.phase !== "round") return;
    if (!round) return;
    if (everyoneAnswered || now >= round.endsAtMs) {
      dispatch({ type: "revealRound" });
    }
  }, [isCoordinator, state.phase, round, everyoneAnswered, now, dispatch]);

  if (!round || !correct) return null;

  const submit = (choiceId) => {
    dispatch({ type: "submitAnswer", choiceId, answeredAtMs: Date.now() });
  };

  const myAnswer = answersThisRound[deviceId];
  const lockedCount = Object.keys(answersThisRound).length;

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle="Round in play"
        onBack={onLeave}
        backLabel="Leave game"
        right={
          <div className="text-right shrink-0">
            <div className="ui-label">Round</div>
            <div className="font-display text-[22px] leading-none tabular" style={{ color: "var(--hp-gold)" }}>
              {state.roundIdx + 1}<span className="text-white/35">/{state.roundCount}</span>
            </div>
          </div>
        }
      />

      <div className="stage-content px-6 mt-2 flex-1 pb-28">
        <HpPanel className="p-5 overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="relative grid place-items-center" style={{ width: 168, height: 168 }}>
              <div className="absolute inset-0"><TimerRing progress={progress} gold /></div>
              <div className={cx("w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-[var(--hp-gold)]/40 grid place-items-center relative spin-slow", !playing && "spin-paused")}>
                <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, #000 0 18%, #282828 18.5% 60%, #181818 60.5% 100%)" }}></div>
                <div className="relative w-6 h-6 rounded-full bg-[var(--hp-gold)]"></div>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-[var(--border-neutral)] font-mono text-[11px] tabular text-white/60">
                0:{String(Math.max(0, secondsLeft)).padStart(2, "0")}
              </div>
            </div>
            <div className="mt-3 ui-label" style={{ color: "var(--hp-magenta)" }}>Now spinning</div>
            <div className="mt-1 font-display text-[22px] leading-tight text-center px-4 tracking-[0.02em]">
              Name that tune
            </div>
            <div className="ui-body text-center px-4">
              Just the audio. You&apos;re on your own.
            </div>
            {audioError && (
              <div className="mt-2 ui-body text-center">
                Preview unavailable, pick your best guess.
              </div>
            )}
          </div>
          {correct.preview && <audio ref={audioRef} src={correct.preview} preload="auto" />}
        </HpPanel>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div className="ui-label">
              {myAnswer ? "Locked in" : "Which song is it?"}
            </div>
            <div className="font-mono text-[10px] text-[var(--hp-gold)] tabular">{lockedCount}/{onlinePlayers.length} locked in</div>
          </div>

          <HpPanel className="mt-4 p-3 min-h-[180px]">
            {myAnswer ? (
              <div className="text-center py-6">
                <div className="ui-label mb-2" style={{ color: "var(--hp-gold)" }}>
                  You locked in
                </div>
                <div className="font-semibold text-lg tracking-tight px-4 truncate">
                  {choices.find(c => c.deezerId === myAnswer.choiceId)?.title || "-"}
                </div>
                <HpSectionDesc>Waiting for {onlinePlayers.length - lockedCount} more…</HpSectionDesc>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 ui-body opacity-90">
                  Tap the track you think you heard
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {choices.map((t) => (
                    <button
                      key={t.deezerId}
                      type="button"
                      onClick={() => submit(t.deezerId)}
                      className="rounded-xl px-3 py-3 text-sm font-medium border-2 text-left transition bg-black/35 border-[var(--border-neutral)] hover:border-[var(--hp-gold)]"
                    >
                      <div className="truncate">{t.title}</div>
                      <div className="ui-body text-[12px] opacity-85 truncate">{t.artist}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </HpPanel>
        </div>
      </div>
      <RoundReactionBar variant="cinematic" />
    </HomeStageShell>
  );
}

function BlitzResultsScreen({ state, dispatch, isCoordinator, deviceId, onLeave }) {
  const tracks = state.chartTracks || [];
  const round = state.round;
  const correct = round ? tracks.find(t => t.deezerId === round.correctId) : null;
  const answersThisRound = state.answers && state.answers[state.roundIdx] ? state.answers[state.roundIdx] : {};

  useEffectApp(() => {
    if (!isCoordinator) return;
    if (state.phase !== "results") return;
    const t = setTimeout(() => {
      if (state.roundIdx + 1 >= state.roundCount) {
        dispatch({ type: "nextRound" });
        return;
      }
      dispatch({ type: "nextRound" });
      dispatch({ type: "startRound", startedAtMs: Date.now() + 1800 });
    }, 4200);
    return () => clearTimeout(t);
  }, [isCoordinator, state.phase, state.roundIdx, state.roundCount, dispatch]);

  const sorted = [...(state.players || [])]
    .map(p => ({
      deviceId: p.deviceId,
      name: p.name,
      points: (answersThisRound[p.deviceId] && answersThisRound[p.deviceId].points) || 0,
      correct: (answersThisRound[p.deviceId] && answersThisRound[p.deviceId].correct) || false,
      total: state.scores[p.deviceId] || 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topScore = sorted[0]?.total ?? 0;

  return (
    <HomeStageShell>
      <HomeHeader subtitle="Reveal" onBack={onLeave} backLabel="Leave game" />
      <div className="stage-content flex-1 pb-6">
        <div className="px-6 mt-2">
          <HpSectionTitle>
            IT WAS <span style={{ color: "var(--hp-gold)" }}>{correct ? correct.title.toUpperCase() : "-"}</span>
          </HpSectionTitle>
          {correct && (
            <HpSectionDesc>{correct.artist}</HpSectionDesc>
          )}
        </div>

        <div className="mt-6 px-6">
          <div className="ui-label">This round</div>
          <div className="mt-3 space-y-2">
            {sorted.map(row => (
              <div key={row.deviceId} className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                row.correct ? "border-[var(--hp-gold)]/40 bg-[var(--hp-gold)]/10" : "border-[var(--border-neutral)] bg-black/35"
              )}>
                <Avatar name={row.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {row.name}
                    {row.deviceId === deviceId && (
                      <span className="ml-1 text-[10px]" style={{ color: "var(--hp-gold)" }}>you</span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/40 font-mono tabular">
                    {row.correct ? "correct" : "wrong"}
                  </div>
                </div>
                <div
                  className="text-[12px] font-semibold px-2 py-1 rounded-full tabular"
                  style={row.points > 0 ? { color: "var(--hp-gold)", background: "rgba(245,197,24,0.15)" } : { background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.35)" }}
                >
                  {row.points > 0 ? `+${row.points}` : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 px-6">
          <div className="ui-label">Leaderboard</div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border-neutral)] bg-black/40 backdrop-blur-sm">
            {sorted.map((row, i) => (
              <div key={row.deviceId} className={cx(
                "flex items-center gap-3 px-4 py-3 border-b border-[var(--border-neutral)] last:border-b-0",
                row.total === topScore && topScore > 0 && "bg-[var(--hp-gold)]/10"
              )}>
                <div className="w-5 text-xs font-mono text-white/40 tabular">{i + 1}</div>
                <Avatar name={row.name} size={26} />
                <div className="text-sm font-medium flex-1 truncate">
                  {row.name}
                  {row.deviceId === deviceId && (
                    <span className="ml-1 text-[10px]" style={{ color: "var(--hp-gold)" }}>you</span>
                  )}
                </div>
                {row.points > 0 && (
                  <div className="text-[11px] font-mono tabular" style={{ color: "var(--hp-gold)" }}>+{row.points}</div>
                )}
                <div className="text-sm font-mono tabular w-7 text-right">{row.total}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pt-6 pb-10">
          <div className="w-full rounded-xl py-4 text-center border border-[var(--border-neutral)] bg-black/35 ui-body">
            {state.roundIdx + 1 >= state.roundCount ? "Final scores soon…" : "Next round soon…"}
          </div>
        </div>
      </div>
    </HomeStageShell>
  );
}

// ---------- Shareable results image ----------
// Renders the final standings to a 1080x1920 PNG (phone-story sized) in the
// cinematic style, then shares it via the Web Share API (so it can go straight
// to a story or chat) or falls back to downloading the file. Pure
// presentation, never touches game state or scoring.
const SHARE_W = 1080, SHARE_H = 1920;

function shareRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, rr); return; }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function shareFitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

// Simplified canvas take on WheelSVG, same palette, gold hub, BR mark.
function drawShareWheel(ctx, cx0, cy0, rOuter) {
  const palette = ["#F5C518", "#FF2D95", "#1DB954", "#F4ECD3"];
  const rInner = rOuter * 0.31;
  ctx.beginPath(); ctx.arc(cx0, cy0, rOuter * 1.09, 0, Math.PI * 2);
  ctx.fillStyle = "#120d1c"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "#000"; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx0, cy0, rOuter * 1.02, 0, Math.PI * 2);
  ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(245,197,24,0.9)"; ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a0 = (i * 30 - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 30 - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(cx0, cy0, rOuter, a0, a1);
    ctx.arc(cx0, cy0, rInner, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#08080C"; ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const ang = (i * 15) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(cx0 + rOuter * 1.055 * Math.cos(ang), cy0 + rOuter * 1.055 * Math.sin(ang), Math.max(2, rOuter * 0.018), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(245,197,24,0.85)"; ctx.fill();
  }
  const hub = ctx.createRadialGradient(cx0, cy0 - rInner * 0.4, rInner * 0.1, cx0, cy0, rInner);
  hub.addColorStop(0, "#F8D85A"); hub.addColorStop(0.55, "#F5C518"); hub.addColorStop(1, "#9A7505");
  ctx.beginPath(); ctx.arc(cx0, cy0, rInner, 0, Math.PI * 2);
  ctx.fillStyle = hub; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = "#08080C"; ctx.stroke();
  ctx.fillStyle = "#08080C";
  ctx.font = `${Math.round(rInner * 0.62)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("BR", cx0, cy0 + rInner * 0.05);
}

async function buildResultsImage({ modeLabel, rows, winnerScore, winners }) {
  // Make sure the display fonts are actually loaded before drawing, canvas
  // silently falls back to a system font otherwise.
  try {
    await Promise.all([
      document.fonts.load("100px 'Bebas Neue'"),
      document.fonts.load("600 30px Inter"),
      document.fonts.load("700 30px Inter"),
    ]);
  } catch { /* draw with fallback fonts */ }

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_W; canvas.height = SHARE_H;
  const ctx = canvas.getContext("2d");
  const setSpacing = (px) => { try { ctx.letterSpacing = px; } catch { /* unsupported */ } };

  // Backdrop: near-black with a gold glow up top and magenta glow below.
  ctx.fillStyle = "#08080C";
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);
  let glow = ctx.createRadialGradient(540, 240, 0, 540, 240, 760);
  glow.addColorStop(0, "rgba(245,197,24,0.10)"); glow.addColorStop(1, "rgba(245,197,24,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
  glow = ctx.createRadialGradient(540, SHARE_H, 0, 540, SHARE_H, 700);
  glow.addColorStop(0, "rgba(255,45,149,0.08)"); glow.addColorStop(1, "rgba(255,45,149,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  drawShareWheel(ctx, 540, 240, 125);

  // Title: BEAT in white, ROULETTE in gold, same split as the homepage.
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  setSpacing("2px");
  ctx.font = "118px 'Bebas Neue', sans-serif";
  const beat = "BEAT ", roulette = "ROULETTE";
  const beatW = ctx.measureText(beat).width;
  const tx = 540 - (beatW + ctx.measureText(roulette).width) / 2;
  ctx.fillStyle = "#FFFFFF"; ctx.fillText(beat, tx, 525);
  ctx.fillStyle = "#F5C518"; ctx.fillText(roulette, tx + beatW, 525);

  ctx.textAlign = "center";
  setSpacing("6px");
  ctx.font = "600 28px Inter, sans-serif";
  ctx.fillStyle = "#FF2D95";
  ctx.fillText(`★  ${(modeLabel || "").toUpperCase()} · FINAL SCORE  ★`, 540, 585);
  setSpacing("0px");

  // Winner panel.
  const panelY = 640, panelH = 250;
  shareRoundRect(ctx, 80, panelY, 920, panelH, 32);
  ctx.fillStyle = "rgba(245,197,24,0.08)"; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(245,197,24,0.4)"; ctx.stroke();

  setSpacing("5px");
  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillStyle = "#FF2D95";
  ctx.fillText(winners.length > 1 ? "IT'S A TIE" : "WINNER", 540, panelY + 62);
  setSpacing("0px");

  const winnerName = winners.length === 0
    ? "NOBODY WON, SOMEHOW"
    : winners.map(w => w.name.toUpperCase()).join(" & ");
  let nameSize = 96;
  ctx.font = `${nameSize}px 'Bebas Neue', sans-serif`;
  while (nameSize > 40 && ctx.measureText(winnerName).width > 840) {
    nameSize -= 4;
    ctx.font = `${nameSize}px 'Bebas Neue', sans-serif`;
  }
  ctx.fillStyle = "#F5C518";
  ctx.fillText(winnerName, 540, panelY + 162);

  ctx.font = "500 27px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(`${winnerScore} POINT${winnerScore === 1 ? "" : "S"} · TASTE VALIDATED`, 540, panelY + 214);

  // Standings list. Row height adapts to player count; very large lobbies
  // overflow into a "+N more" line instead of shrinking below readable.
  const listX = 80, listW = 920;
  let y = panelY + panelH + 64;
  ctx.textAlign = "left";
  setSpacing("4px");
  ctx.font = "600 24px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("ALL STANDINGS", listX + 4, y);
  setSpacing("0px");
  y += 30;

  const bottom = SHARE_H - 110;
  const maxVisible = 11;
  const visible = rows.length > maxVisible ? rows.slice(0, maxVisible - 1) : rows;
  const overflow = rows.length - visible.length;
  const gap = 16;
  const avail = bottom - y - gap * Math.max(0, visible.length - 1) - (overflow > 0 ? 56 : 0);
  const rowH = Math.max(64, Math.min(112, Math.floor(avail / Math.max(1, visible.length))));

  visible.forEach((row, i) => {
    const isWinner = row.score === winnerScore && winnerScore > 0;
    shareRoundRect(ctx, listX, y, listW, rowH, 24);
    ctx.fillStyle = isWinner ? "rgba(245,197,24,0.10)" : "rgba(0,0,0,0.45)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isWinner ? "rgba(245,197,24,0.4)" : "rgba(255,255,255,0.12)";
    ctx.stroke();

    const cy = y + rowH / 2;
    ctx.textBaseline = "middle";

    // Rank badge.
    const badgeR = rowH * 0.26;
    ctx.beginPath(); ctx.arc(listX + 58, cy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? "rgba(245,197,24,0.2)" : "rgba(0,0,0,0.4)";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.font = `700 ${Math.round(rowH * 0.26)}px Inter, sans-serif`;
    ctx.fillStyle = i === 0 ? "#F5C518" : "rgba(255,255,255,0.55)";
    ctx.fillText(String(i + 1), listX + 58, cy + 1);

    // Avatar disc, same hash colors and initials as the in-app Avatar.
    const avR = rowH * 0.3;
    const avX = listX + 128;
    ctx.beginPath(); ctx.arc(avX, cy, avR, 0, Math.PI * 2);
    ctx.fillStyle = colorFor(row.name); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(avR * 0.78)}px Inter, sans-serif`;
    ctx.fillText(initials(row.name), avX, cy + 1);

    // Score, right-aligned; then the name fills whatever is left.
    ctx.textAlign = "right";
    ctx.font = `600 ${Math.round(rowH * 0.32)}px Inter, sans-serif`;
    ctx.fillStyle = isWinner ? "#F5C518" : "#FFFFFF";
    const scoreStr = String(row.score);
    ctx.fillText(scoreStr, listX + listW - 36, cy + 1);
    const scoreW = ctx.measureText(scoreStr).width;

    ctx.textAlign = "left";
    ctx.font = `600 ${Math.round(rowH * 0.3)}px Inter, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    const nameX = avX + avR + 26;
    ctx.fillText(
      shareFitText(ctx, row.name, listX + listW - 36 - scoreW - 28 - nameX),
      nameX, cy + 1
    );

    y += rowH + gap;
  });

  if (overflow > 0) {
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "600 24px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(`+ ${overflow} MORE PLAYER${overflow === 1 ? "" : "S"}`, 540, y + 24);
  }

  // Footer.
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  setSpacing("4px");
  ctx.font = "500 23px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  const dateStr = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  ctx.fillText(`BEAT ROULETTE · ${dateStr.toUpperCase()}`, 540, SHARE_H - 44);
  setSpacing("0px");

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas toBlob failed"))), "image/png");
  });
}

async function shareResultsImage(payload) {
  const blob = await buildResultsImage(payload);
  const file = new File([blob], "beat-roulette-results.png", { type: "image/png" });

  // Web Share with files (mobile): straight to story / chat.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Beat Roulette", text: "Beat Roulette, final standings" });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return; // user closed the share sheet
      // real failure, fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function ShareResultsButton({ cinematic = true, modeLabel, rows, winnerScore, winners, className }) {
  const [busy, setBusy] = useStateApp(false);
  const onShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareResultsImage({ modeLabel, rows, winnerScore, winners });
    } catch (e) {
      console.warn("Share results failed:", e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      className={cx(
        "w-full rounded-xl px-5 py-3 transition",
        cinematic
          ? "font-mono text-[11px] uppercase tracking-[0.2em] border border-white/20 bg-black/35 text-white/75 hover:border-[var(--hp-gold)]/40 hover:text-white"
          : "text-sm bg-[#181818] border border-[#282828] text-[#B3B3B3] hover:border-[#1DB954]/40 hover:text-white",
        busy && "opacity-60 cursor-wait",
        className
      )}
    >
      {busy ? (cinematic ? "RENDERING…" : "Rendering…") : (cinematic ? "SHARE RESULTS" : "Share results")}
    </button>
  );
}

function BlitzFinalScreen({ state, dispatch, deviceId, onLeave }) {
  const sorted = [...(state.players || [])]
    .map(p => ({ deviceId: p.deviceId, name: p.name, score: state.scores[p.deviceId] || 0 }))
    .sort((a, b) => b.score - a.score);
  const winnerScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter(s => s.score === winnerScore && winnerScore > 0);
  const onlinePlayers = (state.players || []).filter(p => p.online !== false);
  const myReplayVoted = !!(state.replayVotes && state.replayVotes[deviceId]);
  const replayVoteCount = onlinePlayers.filter(p => state.replayVotes && state.replayVotes[p.deviceId]).length;

  const toggleReplayVote = () => {
    dispatch({
      type: "voteReplay",
      voted: !myReplayVoted,
      seed: (Math.random() * 0xffffffff) >>> 0,
      startedAtMs: Date.now() + 1800,
    });
  };

  return (
    <HomeStageShell>
      <HomeHeader subtitle="Final score" onBack={onLeave} backLabel="Leave game" />
      <div className="stage-content relative z-10 flex-1 pb-10">
        <div className="mx-6 mt-2">
          <HpPanel className="p-6">
            <div className="ui-label" style={{ color: "var(--hp-magenta)" }}>
              {winners.length > 1 ? "It's a tie" : "Winner"}
            </div>
            <div className="mt-2 font-display leading-[0.9] tracking-[0.02em]" style={{ fontSize: "clamp(36px, 10vw, 52px)", color: "var(--hp-gold)" }}>
              {(winners[0] || sorted[0])?.name || "-"}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 tabular">
              {winnerScore} point{winnerScore === 1 ? "" : "s"} · You Know Ball
            </div>
            {winners.length > 1 && (
              <HpSectionDesc>{winners.map(w => w.name).join(", ")}</HpSectionDesc>
            )}
          </HpPanel>
        </div>

        <div className="mt-6 px-6">
          <div className="ui-label">All standings</div>
          <div className="mt-3 space-y-2">
            {sorted.map((row, i) => {
              const isWinner = row.score === winnerScore && winnerScore > 0;
              return (
                <div key={row.deviceId} className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                  isWinner ? "border-[var(--hp-gold)]/40 bg-[var(--hp-gold)]/10" : "border-[var(--border-neutral)] bg-black/35"
                )}>
                  <div className={cx(
                    "w-7 h-7 rounded-full grid place-items-center text-xs font-semibold tabular",
                    i === 0 ? "bg-[var(--hp-gold)]/20 text-[var(--hp-gold)]" : "bg-black/40 text-white/55"
                  )}>{i + 1}</div>
                  <Avatar name={row.name} size={26} />
                  <div className="text-sm font-medium flex-1 truncate">
                    {row.name}
                    {row.deviceId === deviceId && (
                      <span className="ml-1 text-[10px]" style={{ color: "var(--hp-gold)" }}>you</span>
                    )}
                  </div>
                  <div className="text-sm font-mono tabular">{row.score}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pt-8 pb-4">
          <HpGoldBtn onClick={toggleReplayVote}>
            {myReplayVoted ? "Revoke play again vote" : `Vote play again (${replayVoteCount}/${onlinePlayers.length})`}
          </HpGoldBtn>
          {replayVoteCount > 0 && replayVoteCount < onlinePlayers.length && (
                <div className="mt-3 text-center ui-body">
              Everyone must vote to play again
            </div>
          )}
        </div>
        <div className="px-6 space-y-3">
          <ShareResultsButton modeLabel="Blitz mode" rows={sorted} winnerScore={winnerScore} winners={winners} />
          <HpMutedBtn onClick={onLeave}>LEAVE</HpMutedBtn>
        </div>
      </div>
    </HomeStageShell>
  );
}

function BlitzModeView({ choice, onReset }) {
  const mode = useMemoApp(
    () => ({ roomId: choice.roomId, roundCount: choice.roundCount, seed: choice.seed }),
    [choice.roomId, choice.roundCount, choice.seed]
  );
  const useBlitz = window.useBlitzSession;
  if (!useBlitz) {
    return (
      <div className="p-8 text-center ui-body">
        Blitz Mode failed to load. Refresh the page.
        <button type="button" onClick={onReset} className="block mx-auto mt-4 btn-spotify rounded-xl px-5 py-2.5 font-semibold">BACK</button>
      </div>
    );
  }
  const { deviceId, state, dispatch, status, isCoordinator } = useBlitz(mode, choice.name);

  if (status.kind !== "ready") {
    return <ConnectionGate status={status} mode={{ kind: "blitz", code: choice.roomId }} onReset={onReset} />;
  }

  const common = { state, dispatch, deviceId, onLeave: onReset };
  if (state.phase === "lobby") return <BlitzLobbyScreen {...common} />;
  if (state.phase === "round") return <BlitzRoundScreen {...common} isCoordinator={isCoordinator} />;
  if (state.phase === "results") return <BlitzResultsScreen {...common} isCoordinator={isCoordinator} />;
  if (state.phase === "final") return <BlitzFinalScreen {...common} />;
  return null;
}

// ---------- RoomChip ----------
function RoomChip({ code, mode, variant }) {
  const hp = variant === "home";
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
    <button type="button" onClick={copy} className="text-right group shrink-0">
      <div className="ui-label">Room{mode.kind === "client" ? " (joined)" : ""}</div>
      <div
        className={cx(
          "font-mono font-semibold tracking-[0.2em] transition",
          hp ? "text-[18px] group-hover:opacity-90" : "text-sm group-hover:text-[#1ed760]"
        )}
        style={hp ? { color: "var(--hp-gold)" } : { color: "#1DB954" }}
      >
        {code}
      </div>
      <div className="mt-0.5 ui-body text-[12px] opacity-80">
        {copied ? "Link copied!" : "Tap to copy link"}
      </div>
    </button>
  );
}

// ---------- SpotifyImporter, pick from top tracks ----------
function SpotifyImporter({ token, dispatch, deviceId, onDisconnect, existingTitles }) {
  const [open, setOpen] = useStateApp(false);
  const [tracks, setTracks] = useStateApp(null);
  const [loading, setLoading] = useStateApp(false);
  const [err, setErr] = useStateApp(null);
  const [selected, setSelected] = useStateApp(() => new Set());
  const [adding, setAdding] = useStateApp(false);
  const [progress, setProgress] = useStateApp({ done: 0, total: 0 });

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const items = await spotifyFetchTopTracks(token, { limit: 20 });
      setTracks(items);
    } catch (e) {
      if (e && e.message === "unauthorized") {
        setErr("Session expired. Please log in again.");
        onDisconnect && onDisconnect();
      } else {
        setErr("Couldn't load your top tracks.");
      }
    } finally { setLoading(false); }
  };

  useEffectApp(() => {
    if (open && tracks === null) load();
  }, [open]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSelected = async () => {
    if (selected.size === 0 || !tracks) return;
    setAdding(true);
    const picked = tracks.filter(t => selected.has(t.id));
    setProgress({ done: 0, total: picked.length });
    for (let i = 0; i < picked.length; i++) {
      const t = picked[i];
      let found = null;
      try { found = await findPreview(t.title, t.artist); } catch (e) {}
      dispatch({
        type: "addSong",
        ownerDeviceId: deviceId,
        title: t.title,
        artist: t.artist,
        url: found ? found.preview : null,
        cover: found ? found.cover : (t.cover || null),
        noPreview: !found,
      });
      setProgress({ done: i + 1, total: picked.length });
    }
    setAdding(false);
    setSelected(new Set());
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-[#1DB954]/30 bg-[#0e1a12] p-3 relative z-10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#1DB954]/20 text-[#1DB954] grid place-items-center shrink-0">
            <MusicDiscGlyph size={16} />
          </div>
          <div className="min-w-0">
            <div className="ui-label" style={{ color: "#1DB954" }}>Spotify connected</div>
            <div className="ui-body text-[12px] truncate">Import from your top tracks</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className="px-3 py-1.5 rounded-md bg-[#1DB954] hover:bg-[#1ed760] text-black text-[12px] font-semibold transition"
          >{open ? "Close" : "Browse"}</button>
          <button
            onClick={onDisconnect}
            title="Disconnect"
            className="px-2 py-1.5 rounded-md text-white/40 hover:text-white/80 text-[11px]"
          >disconnect</button>
        </div>
      </div>

      {open && (
        <div className="mt-3">
          {loading && (
            <div className="py-6 text-center text-[12px] text-white/50 flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              Loading your top tracks…
            </div>
          )}
          {err && <div className="py-3 text-center text-[12px] text-rose-400">{err}</div>}
          {!loading && tracks && tracks.length === 0 && (
            <div className="py-4 text-center text-[12px] text-white/50">
              No top tracks yet. Listen on Spotify for a bit and try again.
            </div>
          )}
          {!loading && tracks && tracks.length > 0 && (
            <>
              <div className="max-h-[320px] overflow-y-auto pr-1 -mr-1 space-y-1.5">
                {tracks.map(t => {
                  const isSel = selected.has(t.id);
                  const isDup = existingTitles && existingTitles.has((t.title + "|" + t.artist).toLowerCase());
                  return (
                    <button
                      key={t.id}
                      disabled={isDup || adding}
                      onClick={() => toggle(t.id)}
                      className={cx(
                        "sp-track w-full flex items-center gap-2 rounded-xl px-2 py-1.5 border text-left",
                        isSel ? "selected" : "border-[#3a3a3a] bg-[#181818] hover:border-[#1DB954]",
                        isDup && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="w-10 h-10 rounded-md bg-[#282828] shrink-0 overflow-hidden">
                        {t.cover && <img src={t.cover} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-[11px] text-white/50 truncate">{t.artist}</div>
                      </div>
                      <div className={cx(
                        "w-5 h-5 rounded-full border-2 grid place-items-center shrink-0",
                        isSel ? "border-[#1DB954] bg-[#1DB954]" : "border-[#3a3a3a]"
                      )}>
                        {isSel && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#08080C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                disabled={selected.size === 0 || adding}
                onClick={addSelected}
                className={cx(
                  "w-full mt-3 rounded-xl py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2",
                  selected.size > 0 && !adding
                    ? "bg-[#1DB954] hover:bg-[#1ed760] text-black"
                    : "bg-[#282828] text-[#535353] cursor-not-allowed"
                )}
              >
                {adding ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    Adding {progress.done}/{progress.total}…
                  </>
                ) : selected.size === 0 ? "Pick at least one track" : `Add ${selected.size} selected song${selected.size === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- LobbyScreen, multi-device room (cinematic) ----------
function LobbyScreen({ state, dispatch, isHost, deviceId, code, mode, onLeave }) {
  const [err, setErr] = useStateApp("");
  const [songSearchOpen, setSongSearchOpen] = useStateApp(false);

  const me = state.players.find(p => p.deviceId === deviceId);
  const mySongs = state.songs.filter(s => s.ownerDeviceId === deviceId);
  const songsPerPlayer = state.songsPerPlayer || 1;
  const poolTarget = state.songsPerPlayer ? state.players.length * songsPerPlayer : null;
  const atSongLimit = state.songsPerPlayer && mySongs.length >= songsPerPlayer;

  const playersReady = state.songsPerPlayer
    ? state.players.length >= 3 && state.players.every(p =>
        state.songs.filter(s => s.ownerDeviceId === p.deviceId).length >= songsPerPlayer
      )
    : false;
  const owners = new Set(state.songs.map(s => s.ownerDeviceId));
  const canStart = state.songsPerPlayer
    ? playersReady
    : state.songs.length >= 3 && owners.size >= 2;

  const lobbyQuote = useMemoApp(() => pickLobbyMusicQuote(code), [code]);

  const addSongFromSearch = async (song) => {
    if (atSongLimit) {
      setErr(`You already added ${songsPerPlayer} song${songsPerPlayer === 1 ? "" : "s"}.`);
      return;
    }
    const key = (song.title + "|" + song.artist).toLowerCase();
    if (mySongs.some(s => (s.title + "|" + s.artist).toLowerCase() === key)) {
      setErr("You already added that song.");
      return;
    }
    setErr("");
    dispatch({
      type: "addSong",
      ownerDeviceId: deviceId,
      title: song.title,
      artist: song.artist,
      url: song.url,
      cover: song.cover,
      noPreview: song.noPreview,
    });
  };

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle={
          state.songsPerPlayer
            ? `Lobby, ${state.songsPerPlayer} round${state.songsPerPlayer === 1 ? "" : "s"} each`
            : "Lobby"
        }
        onBack={onLeave}
        backLabel="Leave room"
        right={<RoomChip code={code} mode={mode} variant="home" />}
      />

      <div className="stage-content px-6 mt-2 flex-1 pb-6">
        <HpSectionTitle>
          {isHost ? (
            <>YOU'RE <span style={{ color: "var(--hp-gold)" }}>HOSTING</span></>
          ) : (
            <>YOU'RE <span style={{ color: "var(--hp-magenta)" }}>IN</span></>
          )}
        </HpSectionTitle>
        <HpSectionDesc>
          {isHost
            ? "Share the code. Everyone adds songs, then you start when the pool's full."
            : state.songsPerPlayer
              ? `Add ${songsPerPlayer} song${songsPerPlayer === 1 ? "" : "s"}, the host starts when everyone's ready.`
              : "Add your songs below. The host starts when everyone's ready."}
        </HpSectionDesc>

        <div className="mt-5">
          <div className="ui-label mb-2">
            In the room ({state.players.length})
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {state.players.map(p => {
              const isMe = p.deviceId === deviceId;
              const isHostP = p.deviceId === state.hostDeviceId;
              const songCount = state.songs.filter(s => s.ownerDeviceId === p.deviceId).length;
              return (
                <div key={p.deviceId} className="flex flex-col items-center gap-1 min-w-[64px] shrink-0 pt-2">
                  <div className="relative overflow-visible">
                    <Avatar name={p.name} size={42} dim={p.online === false} />
                    {isHostP && (
                      <div
                        className="absolute -top-2 -right-1 text-[10px] rounded-full w-4 h-4 grid place-items-center font-semibold border border-[#08080C] z-10"
                        style={{ background: "var(--hp-gold)", color: "#08080C" }}
                      >★</div>
                    )}
                  </div>
                  <div
                    className={cx("text-[11px] truncate max-w-[64px] font-medium", isMe ? "" : "text-white/75")}
                    style={isMe ? { color: "var(--hp-gold)" } : undefined}
                  >{p.name}</div>
                  <div className="text-[10px] font-mono text-[var(--hp-gold)] tabular">
                    {state.songsPerPlayer ? `${songCount}/${songsPerPlayer}♪` : `${songCount}♪`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {mySongs.length > 0 && !songSearchOpen && (
          <div className="mt-4 rounded-2xl border border-[var(--border-neutral)] bg-[#16161e] p-3 space-y-1.5">
            <div className="ui-label mb-2 px-1">Your picks</div>
            {mySongs.map(s => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl border border-[var(--border-neutral)] bg-[#22222c] px-3 py-2">
                {s.cover ? (
                  <img src={s.cover} alt="" className="w-9 h-9 rounded-md object-cover border border-[var(--border-neutral)]" />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-black/50 border border-[var(--border-neutral)]"></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate font-medium">{s.title}</div>
                  <div className="ui-body text-[12px] truncate">
                    {s.artist}{s.noPreview && <span className="ml-1.5 opacity-70">, no preview</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "removeSong", songId: s.id })}
                  className="ui-label text-[12px] hover:text-[var(--hp-magenta)] px-2 py-1 transition-colors"
                >Remove</button>
              </div>
            ))}
          </div>
        )}

        {!atSongLimit && (
          <div className="song-suggest-shell mt-4">
            {state.songsPerPlayer && (
              <div className="ui-label mb-2" style={{ color: "var(--hp-magenta)" }}>
                Song {mySongs.length + 1} of {songsPerPlayer}
              </div>
            )}
            <SongSearchPicker
              variant="home"
              error={err}
              onClearError={() => setErr("")}
              onOpenChange={setSongSearchOpen}
              onAdd={addSongFromSearch}
            />
          </div>
        )}

        {atSongLimit && (
          <div className="mt-4 rounded-2xl border border-[var(--hp-neon)]/30 bg-[var(--hp-neon)]/10 px-4 py-3 text-center ui-body" style={{ color: "var(--hp-neon)" }}>
            {songsPerPlayer === 1 ? "1 song added, waiting for host" : `All ${songsPerPlayer} songs added, waiting for host`}
          </div>
        )}

        <div className="mt-6">
          <PoolCounter count={state.songs.length} variant="home" quote={lobbyQuote} />
        </div>

        <div className="mt-6 pb-2">
          {isHost ? (
            <HpPrimaryBtn disabled={!canStart} onClick={() => dispatch({ type: "start" })}>
              {canStart
                ? `START ${state.songs.length} ROUND${state.songs.length === 1 ? "" : "S"} →`
                : state.players.length < 3
                  ? state.players.length === 1
                    ? "NEED AT LEAST 2 MORE PLAYERS"
                    : `NEED ${3 - state.players.length} MORE PLAYER${3 - state.players.length === 1 ? "" : "S"}`
                  : poolTarget
                    ? `NEED ${poolTarget - state.songs.length} MORE SONG${poolTarget - state.songs.length === 1 ? "" : "S"}`
                    : "NEED AT LEAST 2 PLAYERS WITH SONGS"}
            </HpPrimaryBtn>
          ) : (
            <HpPanel center className="py-4">
              <HpSectionDesc>
                {canStart ? "Ready, waiting for host to start…" : "Waiting on more songs…"}
              </HpSectionDesc>
            </HpPanel>
          )}
        </div>
      </div>
    </HomeStageShell>
  );
}

function PoolCounter({ count, variant, quote }) {
  const discs = Math.min(count, 8);
  const hp = variant === "home";
  return (
    <div className={cx(
      "theme-panel px-5 py-5 text-center relative overflow-hidden",
      hp ? "bg-black/40 backdrop-blur-sm" : "bg-[#181818] grain"
    )}>
      <div className="ui-label">Songs in the pool</div>
      <div className="relative mt-1 flex items-baseline justify-center">
        <span className={cx("pool-number", hp && "pool-number--home")} style={hp ? { color: "var(--hp-gold)" } : undefined}>{count}</span>
      </div>
      {quote && (
        <blockquote className="pool-quote">
          <p className="pool-quote-text">&ldquo;{quote.text}&rdquo;</p>
          <footer className="pool-quote-author">&mdash; {quote.author}</footer>
        </blockquote>
      )}
      {discs > 0 && (
        <div className="mt-3 flex items-center justify-center -space-x-2">
          {Array.from({ length: discs }).map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border"
              style={{
                borderColor: hp ? "var(--hp-gold)" : "var(--border-neutral)",
                background: hp
                  ? "radial-gradient(circle at center, var(--hp-gold) 0 14%, #282828 16% 55%, #181818 56% 100%)"
                  : "radial-gradient(circle at center, #1DB954 0 14%, #282828 16% 55%, #181818 56% 100%)",
                transform: `translateY(${(i % 2) * -1}px)`,
              }}
            />
          ))}
          {count > 8 && (
            <div className="ml-3 text-[11px] font-mono text-white/40 tabular">+{count - 8}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Splash ----------
function SplashScreen({ roundNumber, totalRounds, onDone, isHost, cinematic }) {
  useEffectApp(() => {
    if (!isHost) return; // only host advances state
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone, isHost]);
  if (cinematic) {
    return (
      <div className="fade-enter absolute inset-0 z-30 hp-stage overflow-hidden">
        <HpStageBackdrop noteCount={14} topStrip={false} />
        <div className="absolute inset-0 z-10 grid place-items-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 splash-strip bg-gradient-to-r from-transparent via-[var(--hp-gold)]/20 to-transparent"></div>
          <div className="relative text-center splash-num px-6">
            <div className="ui-label">Round</div>
            <div
              className="mt-1 font-display leading-none text-white"
              style={{ fontSize: "clamp(88px, 24vw, 120px)" }}
            >
              <span style={{ color: "var(--hp-gold)" }}>{roundNumber}</span>
            </div>
            <div className="-mt-1 ui-body tabular text-center">
              of {totalRounds}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fade-enter absolute inset-0 grid place-items-center bg-[var(--bg)] z-30">
      <div className="relative w-full">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 splash-strip bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="relative text-center splash-num">
          <div className="ui-label">Round</div>
          <div className="mt-1 text-[96px] leading-none font-display tracking-tighter text-white">
            {roundNumber}
          </div>
          <div className="-mt-2 ui-body tabular">of {totalRounds}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Timer ring ----------
function TimerRing({ progress, size = 168, stroke = 6, gold, accentColor }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gradId = gold ? "ringGold" : accentColor ? "ringAccent" : "ring";
  const accent = accentColor || (gold ? "#F5C518" : "#1DB954");
  return (
    <svg width={size} height={size} className="pulse-glow">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 120ms linear" }}
      />
    </svg>
  );
}

// ---------- Round reactions (local float; Twemoji for cartoon look) ----------
const TWEMOJI_CDN = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";

const ROUND_REACTIONS = [
  { id: "fire", code: "1f525", glyph: "🔥", label: "Fire", tone: "pos" },
  { id: "hearts", code: "1f60d", glyph: "😍", label: "Love", tone: "pos" },
  { id: "star", code: "2b50", glyph: "⭐", label: "Star", tone: "pos" },
  { id: "trash", code: "1f5d1", glyph: "🗑️", label: "Trash", tone: "neg" },
  { id: "poop", code: "1f4a9", glyph: "💩", label: "Poop", tone: "neg" },
  { id: "vomit", code: "1f92e", glyph: "🤮", label: "Sick", tone: "neg" },
];

function twemojiSrc(code) {
  return `${TWEMOJI_CDN}/${code}.png`;
}

function useAutoRevealWhenAllVoted(song, voterIds, guesses, dispatch, audioRef, setPlaying) {
  const revealScheduledRef = useRefApp(false);
  const voteKey = voterIds.map(id => (guesses[id] != null ? "1" : "0")).join("");

  useEffectApp(() => {
    revealScheduledRef.current = false;
  }, [song && song.id]);

  useEffectApp(() => {
    if (!song || voterIds.length === 0) return;
    const allIn = voterIds.every(id => guesses[id] != null);
    if (!allIn || revealScheduledRef.current) return;
    revealScheduledRef.current = true;
    const a = audioRef.current;
    if (a) a.pause();
    if (setPlaying) setPlaying(false);
    const t = window.setTimeout(() => dispatch({ type: "revealRound" }), 200);
    return () => window.clearTimeout(t);
  }, [song, voteKey, voterIds.length, dispatch, audioRef, setPlaying]);
}

function RoundReactionBar({ variant }) {
  const [floats, setFloats] = useStateApp([]);
  const nextIdRef = useRefApp(0);

  const spawnFloat = (reaction, ev) => {
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    const id = ++nextIdRef.current;
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    const topMargin = 28;
    const lift = Math.min(Math.max(y - topMargin, 72), window.innerHeight - topMargin - 48);
    const sway = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 8);
    setFloats(prev => [...prev, {
      id,
      code: reaction.code,
      glyph: reaction.glyph,
      x: Math.round(x),
      y: Math.round(y),
      lift: Math.round(lift),
      sway: Math.round(sway),
    }]);
    window.setTimeout(() => {
      setFloats(prev => prev.filter(f => f.id !== id));
    }, 2800);
  };

  const positive = ROUND_REACTIONS.filter(r => r.tone === "pos");
  const negative = ROUND_REACTIONS.filter(r => r.tone === "neg");

  const floatLayer = (
    <div className="reaction-float-layer" aria-hidden="true">
      {floats.map(f => (
        <span
          key={f.id}
          className="reaction-float-emoji"
          style={{
            left: `${f.x}px`,
            top: `${f.y}px`,
            "--lift": `${f.lift}px`,
            "--sway": `${f.sway}px`,
          }}
        >
          <img
            src={twemojiSrc(f.code)}
            alt=""
            className="reaction-float-img"
            draggable={false}
            onError={(e) => e.currentTarget.parentElement.classList.add("is-fallback")}
          />
          <span className="reaction-float-glyph" aria-hidden="true">{f.glyph}</span>
        </span>
      ))}
    </div>
  );

  return (
    <>
      {typeof ReactDOM !== "undefined" && ReactDOM.createPortal
        ? ReactDOM.createPortal(floatLayer, document.body)
        : floatLayer}
      <div className={cx("reaction-bar", variant === "cinematic" && "reaction-bar--cinematic")}>
        <div className="reaction-bar-inner">
          <div className="reaction-bar-group reaction-bar-group--pos">
            {positive.map(r => (
              <button
                key={r.id}
                type="button"
                className="reaction-btn reaction-btn--pos"
                aria-label={r.label}
                onClick={(ev) => spawnFloat(r, ev)}
              >
                <img
                  src={twemojiSrc(r.code)}
                  alt=""
                  className="reaction-btn-img"
                  draggable={false}
                  onError={(e) => e.currentTarget.parentElement.classList.add("is-fallback")}
                />
                <span className="reaction-btn-glyph" aria-hidden="true">{r.glyph}</span>
              </button>
            ))}
          </div>
          <div className="reaction-bar-divider" aria-hidden="true" />
          <div className="reaction-bar-group reaction-bar-group--neg">
            {negative.map(r => (
              <button
                key={r.id}
                type="button"
                className="reaction-btn reaction-btn--neg"
                aria-label={r.label}
                onClick={(ev) => spawnFloat(r, ev)}
              >
                <img
                  src={twemojiSrc(r.code)}
                  alt=""
                  className="reaction-btn-img"
                  draggable={false}
                  onError={(e) => e.currentTarget.parentElement.classList.add("is-fallback")}
                />
                <span className="reaction-btn-glyph" aria-hidden="true">{r.glyph}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- RoundScreen (multi-device, cinematic home theme) ----------
function RoundScreen({ state, dispatch, deviceId, isHost, onLeave }) {
  const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
  const audioRef = useRefApp(null);
  const [progress, setProgress] = useStateApp(0);
  const [duration, setDuration] = useStateApp(30);
  const [playing, setPlaying] = useStateApp(false);
  const [audioError, setAudioError] = useStateApp(false);

  // The song owner is never a guesser, exclude them from the people we wait on.
  const isOwner = !!song && song.ownerDeviceId === deviceId;
  const voters = state.players.filter(p => p.online !== false && (!song || p.deviceId !== song.ownerDeviceId));
  const lockedCount = voters.filter(p => state.guesses[p.deviceId] != null).length;
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

  const voterIds = voters.map(p => p.deviceId);
  useAutoRevealWhenAllVoted(song, voterIds, state.guesses, dispatch, audioRef, setPlaying);

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
    if (myGuess || isOwner) return;
    if (targetDeviceId === deviceId) return; // can't guess yourself
    // Elapsed guess time is computed server-side (server receive time minus
    // the server-recorded round start), no client timestamp is sent.
    dispatch({ type: "submitGuess", targetDeviceId });
  };

  const secondsLeft = Math.max(0, Math.ceil((1 - progress) * (duration || 30)));
  const guessTarget = myGuess ? state.players.find(p => p.deviceId === myGuess) : null;

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle="Round in play, multi-device"
        onBack={onLeave}
        backLabel="Leave game"
        right={
          <div className="text-right shrink-0">
            <div className="ui-label">Round</div>
            <div className="font-display text-[22px] leading-none tabular" style={{ color: "var(--hp-gold)" }}>
              {state.roundIdx + 1}<span className="text-white/35">/{state.order.length}</span>
            </div>
          </div>
        }
      />

      <div className="stage-content px-6 mt-2 flex-1 pb-28">
        <HpPanel className="p-5 overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="relative grid place-items-center" style={{ width: 168, height: 168 }}>
              <div className="absolute inset-0"><TimerRing progress={progress} gold /></div>
              <div className={cx("w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-[var(--hp-gold)]/40 grid place-items-center relative spin-slow", !playing && "spin-paused")}>
                {song.cover ? (
                  <>
                    <img src={song.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(0,0,0,0.85) 0 14%, transparent 14.5% 60%, rgba(0,0,0,0.55) 60.5% 100%)" }}></div>
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, #000 0 18%, #282828 18.5% 60%, #181818 60.5% 100%)" }}></div>
                )}
                <div className="relative w-6 h-6 rounded-full bg-[var(--hp-gold)]"></div>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-[var(--border-neutral)] font-mono text-[11px] tabular text-white/60">
                0:{secondsLeft.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mt-3 ui-label" style={{ color: "var(--hp-magenta)" }}>Now spinning</div>
            <div className="mt-1 font-display text-[22px] leading-tight text-center px-4 truncate w-full tracking-[0.02em]">{song.title}</div>
            <div className="ui-body text-center truncate w-full px-4">{song.artist}</div>

            <div className="mt-3 flex items-center gap-3 ui-body text-[12px]">
              {playing ? (
                <div className="flex items-end gap-[2px] h-3">
                  <div className="w-[2px] eq-bar" style={{ background: "var(--hp-gold)" }}></div>
                  <div className="w-[2px] eq-bar" style={{ background: "var(--hp-gold)", animationDelay: "120ms" }}></div>
                  <div className="w-[2px] eq-bar" style={{ background: "var(--hp-gold)", animationDelay: "240ms" }}></div>
                </div>
              ) : <div className="w-2 h-2 rounded-full bg-white/30"></div>}
              <button onClick={togglePlay} disabled={!song.url} className={cx("hover:text-[var(--hp-gold)] transition", !song.url && "opacity-30 cursor-not-allowed")}>
                {playing ? "pause" : "play"}
              </button>
            </div>
            {audioError && (
              <div className="mt-2 ui-body text-center">
                Preview unavailable, guess from title and artist.
              </div>
            )}
          </div>
          {song.url && <audio ref={audioRef} src={song.url} preload="auto" />}
        </HpPanel>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div className="ui-label">
              {myGuess ? "Locked in" : "Who picked it?"}
            </div>
            <div className="font-mono text-[10px] text-[var(--hp-gold)] tabular">{lockedCount}/{voters.length} locked in</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {voters.map(p => {
              const locked = state.guesses[p.deviceId] != null;
              const isMe = p.deviceId === deviceId;
              return (
                <div
                  key={p.deviceId}
                  className={cx(
                    "px-2.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5",
                    locked
                      ? "bg-black/40 border-[var(--hp-neon)]/40 text-[var(--hp-neon)]"
                      : isMe && !myGuess
                        ? "bg-[var(--hp-magenta)]/20 border-[var(--hp-magenta)]/50 text-white"
                        : "bg-black/35 border-[var(--border-neutral)] text-white/50"
                  )}
                >
                  <Avatar name={p.name} size={18} />
                  <span>{p.name}</span>
                  {locked && <span>✓</span>}
                  {isMe && !locked && <span className="ui-body text-[11px] opacity-80">you</span>}
                </div>
              );
            })}
          </div>

          <HpPanel className="mt-4 p-3 min-h-[180px]">
            {isOwner ? (
              <>
                <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--hp-magenta)" }}>
                  This is your track, tap any to ride it out
                </div>
                {/* Decoy buttons: same motion as everyone else's guess grid, but
                    blank and scoring-inert, the owner can never guess. */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {state.players.filter(p => p.deviceId !== deviceId).map(p => (
                    <button
                      key={p.deviceId}
                      type="button"
                      className="rounded-xl px-3 py-3 text-sm font-medium border text-left transition flex items-center gap-2 bg-black/35 border-white/15 hover:border-[var(--hp-gold)]/50 hover:bg-black/50 active:scale-[0.97]"
                    >
                      <div className="w-[26px] h-[26px] rounded-full bg-white/10 border border-white/15 shrink-0"></div>
                      <div className="h-2.5 w-16 rounded-full bg-white/10"></div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <HpSectionDesc>Waiting for {voters.length - lockedCount} more…</HpSectionDesc>
                </div>
              </>
            ) : myGuess ? (
              <div className="text-center py-6">
                <div className="ui-label mb-2" style={{ color: "var(--hp-gold)" }}>
                  You locked in
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Avatar name={guessTarget?.name} size={32} />
                  <div className="font-semibold text-xl tracking-tight">{guessTarget?.name}</div>
                </div>
                <HpSectionDesc>Waiting for {voters.length - lockedCount} more…</HpSectionDesc>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 ui-body opacity-90">
                  Who submitted this track?
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {state.players.filter(p => p.deviceId !== deviceId).map(p => (
                    <button
                      key={p.deviceId}
                      onClick={() => setGuess(p.deviceId)}
                      className="rounded-xl px-3 py-3 text-sm font-medium border-2 text-left transition flex items-center gap-2 bg-black/35 border-[var(--border-neutral)] hover:border-[var(--hp-gold)] hover:bg-black/50"
                    >
                      <Avatar name={p.name} size={26} />
                      <div className="min-w-0">
                        <div className="truncate">{p.name}</div>
                        {p.online === false && (
                          <div className="ui-body text-[11px] opacity-60">Offline</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </HpPanel>
        </div>

        <div className="pt-6 pb-28 text-center ui-body opacity-80">
          {isHost
            ? (lockedCount === voters.length ? "Everyone's in, revealing…" : "Reveal when everyone's locked in")
            : (lockedCount === voters.length ? "All in, host is revealing…" : "Reveal happens when everyone's locked in")}
        </div>
      </div>
      <RoundReactionBar variant="cinematic" />
    </HomeStageShell>
  );
}

// ---------- ResultsScreen ----------
function ResultsScreen({ state, dispatch, deviceId, isHost, onLeave, cinematic }) {
  const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
  if (!song) return null;

  const playersById = Object.fromEntries(state.players.map(p => [p.deviceId, p]));
  // The owner is never a guesser, keep them out of the guess list and the
  // sneaky ratio so this view matches the reducer's scoring exactly.
  const guessers = state.players.filter(p => p.deviceId !== song.ownerDeviceId);
  const guessedIds = guessers.filter(g => state.guesses[g.deviceId]).map(g => g.deviceId);
  const wrongCount = guessedIds.filter(id => state.guesses[id] !== song.ownerDeviceId).length;
  const sneaky = guessedIds.length > 0 && wrongCount * 2 > guessedIds.length;

  const sorted = state.players
    .map(p => ({ deviceId: p.deviceId, name: p.name, score: state.scores[p.deviceId] || 0, delta: state.scoreDeltas[p.deviceId] || 0 }))
    .sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  const isFinal = state.roundIdx + 1 >= state.order.length;

  const content = (
    <>
      <div className="mx-6 mt-1">
        {cinematic ? (
          <HpPanel>
            <div className="ui-label" style={{ color: "var(--hp-magenta)" }}>It was…</div>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={song.ownerName} size={48} />
              <div className="min-w-0">
                <div className="font-display text-[36px] leading-none tracking-[0.02em] truncate">{song.ownerName}</div>
                <div className="mt-1 ui-body truncate">
                  <span className="text-white/90">{song.title}</span>, {song.artist}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sneaky && (
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-black/40 text-white/60 border border-[var(--border-neutral)] ui-body">
                  Sneaky · {song.ownerName} +1
                </span>
              )}
              {!state.localPassAround && state.fastestCorrect && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ui-body"
                  style={{ background: "rgba(245,197,24,0.12)", color: "var(--hp-gold)", borderColor: "rgba(245,197,24,0.35)" }}
                >
                  Fastest: {playersById[state.fastestCorrect]?.name} +1
                </span>
              )}
            </div>
          </HpPanel>
        ) : (
          <div className="rounded-3xl border border-[#282828] bg-[#181818] p-5 grain relative overflow-hidden">
            <div className="ui-label" style={{ color: "#1DB954" }}>It was…</div>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={song.ownerName} size={48} />
              <div className="min-w-0">
                <div className="text-3xl font-semibold tracking-tight leading-none truncate">{song.ownerName}</div>
                <div className="mt-1 ui-body truncate">
                  <span className="text-white/90">{song.title}</span>, {song.artist}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sneaky && (
                <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-[#282828] text-[#B3B3B3] border border-[var(--border-neutral)] ui-body">
                  Sneaky pick · {song.ownerName} +1
                </span>
              )}
              {!state.localPassAround && state.fastestCorrect && (
                <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 ui-body">
                  Fastest: {playersById[state.fastestCorrect]?.name} +1
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 px-6">
        <div className="ui-label">Guesses</div>
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
                cinematic
                  ? (noGuess ? "border-[var(--border-neutral)] bg-black/30 opacity-60" : right ? "border-[var(--hp-gold)]/40 bg-[var(--hp-gold)]/10" : "border-[var(--border-neutral)] bg-black/35")
                  : (noGuess ? "border-[#282828] bg-[#181818] opacity-60" : right ? "border-[#1DB954]/40 bg-[#1DB954]/[0.08]" : "border-[#282828] bg-[#181818]")
              )}>
                <Avatar name={guesser.name} size={28} />
                <div className="min-w-0 flex-1">
                  {/* Deliberately never show WHO they guessed: revealing wrong
                      targets would let players deduce later answers by
                      elimination. Only right/wrong, points, and time. */}
                  <div className="text-sm truncate">
                    <span className="font-medium">{guesser.name}</span>
                  </div>
                  <div className="ui-body text-[12px] tabular">
                    {noGuess ? "Didn't lock in" : right ? "Correct" : "Wrong"}{!state.localPassAround && seconds ? `, ${seconds}s` : ""}
                    {state.streaks[guesser.deviceId] >= 2 && right && (
                      <span className="ml-1" style={cinematic ? { color: "var(--hp-gold)" } : undefined}>
                        🔥 {state.streaks[guesser.deviceId]}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cx(
                  "text-[12px] font-semibold px-2 py-1 rounded-full tabular",
                  delta > 0
                    ? (cinematic ? "text-[var(--hp-gold)]" : "bg-[#1DB954]/15 text-[#1DB954]")
                    : (cinematic ? "bg-black/40 text-white/35" : "bg-[#282828] text-[#535353]")
                )} style={delta > 0 && cinematic ? { background: "rgba(245,197,24,0.15)" } : undefined}>
                  {delta > 0 ? `+${delta}` : "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-6">
        <div className="ui-label">Leaderboard</div>
        <div className={cx(
          "mt-3 overflow-hidden",
          cinematic ? "rounded-2xl border border-[var(--border-neutral)] bg-black/40 backdrop-blur-sm" : "rounded-2xl border border-[#282828] bg-[#181818]"
        )}>
          {sorted.map((row, i) => (
            <div key={row.deviceId} className={cx(
              "flex items-center gap-3 px-4 py-3 border-b last:border-b-0",
              cinematic ? "border-[var(--border-neutral)]" : "border-[#282828]",
              row.score === topScore && row.score > 0 && (cinematic ? "bg-[var(--hp-gold)]/10" : "bg-[#1DB954]/[0.08]")
            )}>
              <div className="w-5 text-xs font-mono text-white/40 tabular">{i + 1}</div>
              <Avatar name={row.name} size={26} />
              <div className="text-sm font-medium flex-1 truncate">
                {row.name}
                {row.deviceId === deviceId && (
                  <span className={cx("ml-1 text-[10px]", !cinematic && "text-[#1DB954]")} style={cinematic ? { color: "var(--hp-gold)" } : undefined}>
                    you
                  </span>
                )}
              </div>
              {row.delta > 0 && (
                <div className="text-[11px] font-mono tabular" style={cinematic ? { color: "var(--hp-gold)" } : undefined}>
                  +{row.delta}
                </div>
              )}
              <div className="text-sm font-mono tabular w-7 text-right">{row.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6 pb-10">
        {isHost ? (
          cinematic ? (
            <HpPrimaryBtn onClick={() => dispatch({ type: "nextRound" })}>
              {isFinal ? "SEE FINAL RESULTS →" : "NEXT ROUND →"}
            </HpPrimaryBtn>
          ) : (
            <button
              onClick={() => dispatch({ type: "nextRound" })}
              className="w-full rounded-xl py-4 text-base font-semibold transition bg-[#1DB954] hover:bg-[#1ed760] text-black"
            >
              {isFinal ? "See final results →" : "Next round →"}
            </button>
          )
        ) : (
          <div className={cx(
            "w-full rounded-xl py-4 text-center text-sm",
            cinematic ? "border border-[var(--border-neutral)] bg-black/35 ui-body text-center" : "bg-[#181818] border border-[#282828] text-[#B3B3B3]"
          )}>
            Waiting for host to {isFinal ? "wrap up" : "advance"}…
          </div>
        )}
      </div>
    </>
  );

  if (cinematic) {
    return (
      <HomeStageShell>
        <HomeHeader subtitle="Reveal" onBack={onLeave} backLabel="Leave game" />
        <div className="stage-content flex-1">{content}</div>
      </HomeStageShell>
    );
  }

  return (
    <div className="fade-enter relative">
      <TopBar subtitle="Reveal" onBack={onLeave} backLabel="Leave game" />
      <div className="stage-content">{content}</div>
    </div>
  );
}

// ---------- FinalScreen ----------
function FinalScreen({ state, dispatch, deviceId, isHost, onLeave, cinematic }) {
  const sorted = state.players
    .map(p => ({ deviceId: p.deviceId, name: p.name, score: state.scores[p.deviceId] || 0 }))
    .sort((a, b) => b.score - a.score);

  const winnerScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter(s => s.score === winnerScore && winnerScore > 0);

  const playersById = Object.fromEntries(state.players.map(p => [p.deviceId, p]));
  // Per-round guess history retained by the server through the final phase.
  // This is the ONE screen allowed to show who guessed whom, the game is over.
  const roundHistory = Array.isArray(state.roundHistory) ? state.roundHistory : [];

  const confetti = useMemoApp(() =>
    new Array(28).fill(0).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      dur: 3 + Math.random() * 3,
      color: cinematic
        ? ["#F5C518", "#FF2D95", "#1DB954", "#F4ECD3", "#FFFFFF"][i % 5]
        : ["#1DB954", "#1ed760", "#FFFFFF", "#B3B3B3", "#535353"][i % 5],
      rot: Math.random() * 360,
      key: i,
    })), [cinematic]);

  const podium = sorted.slice(0, 3);
  const podiumOrder = [1, 0, 2];
  const heights = { 0: 132, 1: 96, 2: 72 };
  const podiumColors = cinematic
    ? ["bg-[var(--hp-gold)]", "bg-[#535353]", "bg-[#282828]"]
    : ["bg-[#1DB954]", "bg-[#535353]", "bg-[#282828]"];

  const inner = (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {confetti.map(c => (
          <div key={c.key} className="confetti" style={{
            left: c.left + "%", background: c.color,
            animationDuration: c.dur + "s", animationDelay: c.delay + "s",
            transform: `rotate(${c.rot}deg)`, borderRadius: "2px",
          }} />
        ))}
      </div>

      <div className="relative z-10 stage-content">
        {cinematic ? (
          <HomeHeader subtitle="Final score" onBack={onLeave} backLabel="Leave game" />
        ) : (
          <TopBar subtitle="Final score" onBack={onLeave} backLabel="Leave game" />
        )}

      <div className="mx-6 mt-2">
        {cinematic ? (
          <HpPanel className="p-6">
            <div className="ui-label" style={{ color: "var(--hp-magenta)" }}>
              {winners.length > 1 ? "It's a tie" : "Winner"}
            </div>
            <div className="mt-1 font-display text-[44px] leading-[0.95] tracking-[0.02em]">
              {winners.length === 0 ? "NOBODY WON, SOMEHOW" : winners.map(w => w.name.toUpperCase()).join(" & ")}
            </div>
            <div className="mt-2 ui-body tabular">
              {winnerScore} point{winnerScore === 1 ? "" : "s"} · They Don&apos;t Know You Son
            </div>
          </HpPanel>
        ) : (
          <div className="rounded-3xl border border-[#282828] bg-[#181818] p-6 grain relative overflow-hidden">
            <div className="ui-label" style={{ color: "#1DB954" }}>
              {winners.length > 1 ? "It's a tie" : "Winner"}
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight leading-tight">
              {winners.length === 0 ? "Nobody won, somehow" : winners.map(w => w.name).join(" & ")}
            </div>
            <div className="mt-2 ui-body tabular">
              {winnerScore} point{winnerScore === 1 ? "" : "s"} · They Don&apos;t Know You Son.
            </div>
          </div>
        )}
      </div>

      {podium.length >= 2 && (
        <div className="mt-12 px-6 pt-2">
          <div className="flex items-end justify-center gap-2 h-[228px]">
            {podiumOrder.map(idx => {
              const row = podium[idx];
              if (!row) return <div key={idx} className="flex-1" />;
              return (
                <div key={row.deviceId} className="flex-1 flex flex-col items-center justify-end">
                  <div className="mb-2 flex flex-col items-center shrink-0">
                    <Avatar name={row.name} size={idx === 0 ? 44 : 36} />
                    <div className="mt-1 text-xs font-medium truncate max-w-[100px] text-center">{row.name}</div>
                    <div className="text-[10px] text-white/40 font-mono tabular">{row.score} pt{row.score === 1 ? "" : "s"}</div>
                  </div>
                  <div
                    className={cx("w-full rounded-t-lg pt-2 font-display text-white text-xl text-center", podiumColors[idx])}
                    style={{ height: heights[idx] }}
                  >{idx + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 px-6">
        <div className="ui-label">All standings</div>
        <div className="mt-3 space-y-2">
          {sorted.map((row, i) => {
            const isWinner = row.score === winnerScore && winnerScore > 0;
            return (
              <div key={row.deviceId} className={cx(
                "flex items-center gap-3 rounded-2xl px-4 py-4 border",
                cinematic
                  ? (isWinner ? "border-[var(--hp-gold)]/40 bg-[var(--hp-gold)]/10" : "border-[var(--border-neutral)] bg-black/35")
                  : (isWinner ? "border-[#1DB954]/40 bg-[#1DB954]/[0.08]" : "border-[#282828] bg-[#181818]")
              )}>
                <div className={cx(
                  "w-9 h-9 rounded-full grid place-items-center text-sm font-semibold tabular",
                  cinematic
                    ? (i === 0 ? "bg-[var(--hp-gold)]/20 text-[var(--hp-gold)]" : i === 1 ? "bg-[#3a3a3a] text-[#B3B3B3]" : i === 2 ? "bg-[#282828] text-[#B3B3B3]" : "bg-black/40 text-[#535353]")
                    : (i === 0 ? "bg-[#1DB954]/20 text-[#1DB954]" : i === 1 ? "bg-[#3a3a3a] text-[#B3B3B3]" : i === 2 ? "bg-[#282828] text-[#B3B3B3]" : "bg-[#181818] text-[#535353]")
                )}>{i + 1}</div>
                <Avatar name={row.name} size={34} />
                <div className="text-base font-medium flex-1 truncate">
                  {row.name}
                  {row.deviceId === deviceId && (
                    <span className={cx("ml-1 text-[11px]", !cinematic && "text-[#1DB954]")} style={cinematic ? { color: "var(--hp-gold)" } : undefined}>you</span>
                  )}
                </div>
                <div className="text-base font-mono tabular">{row.score}</div>
              </div>
            );
          })}
        </div>
      </div>

      {roundHistory.length > 0 && (
        <div className="mt-6 px-6">
          <div className={cx(
            "uppercase tracking-[0.18em]",
            cinematic ? "font-mono text-[10px] text-white/40" : "text-[11px] text-white/40"
          )}>Round by round</div>
          <div className="mt-3 space-y-2">
            {roundHistory.map((entry, i) => {
              const guessPairs = Object.entries(entry.guesses || {});
              return (
                <div key={`${i}-${entry.songId}`} className={cx(
                  "rounded-xl px-3.5 py-3 border",
                  cinematic ? "border-white/12 bg-black/35" : "border-[#282828] bg-[#181818]"
                )}>
                  <div className="text-[13px] leading-snug">
                    <span className="font-semibold">Round {i + 1}</span>
                    <span className="text-white/65"> ({entry.title} – {entry.artist})</span>
                    <span className="text-white/40 text-[11px]"> · {entry.ownerName}'s pick</span>
                  </div>
                  <div className="mt-1 text-[12px] leading-relaxed text-white/60">
                    {guessPairs.length === 0 ? (
                      <span className="text-white/35">no guesses locked in</span>
                    ) : (
                      guessPairs.map(([gid, tid], j) => {
                        const right = tid === entry.ownerDeviceId;
                        return (
                          <span key={gid}>
                            <span className={right ? "font-medium" : undefined} style={right ? { color: cinematic ? "var(--hp-gold)" : "#1DB954" } : undefined}>
                              {playersById[gid]?.name || "?"} guessed {playersById[tid]?.name || "?"}{right ? " ✓" : ""}
                            </span>
                            {j < guessPairs.length - 1 ? ", " : ""}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-6 pt-8 pb-10">
        {isHost ? (
          cinematic ? (
            <HpGoldBtn onClick={() => dispatch({ type: "reset" })}>PLAY AGAIN →</HpGoldBtn>
          ) : (
            <button onClick={() => dispatch({ type: "reset" })} className="w-full rounded-xl py-4 text-base font-semibold transition bg-white text-black hover:bg-white/90">
              Play again
            </button>
          )
        ) : (
          <div className={cx(
            "w-full rounded-xl py-4 text-center text-sm",
            cinematic ? "border border-[var(--border-neutral)] bg-black/35 ui-body text-center" : "bg-[#181818] border border-[#282828] text-[#B3B3B3]"
          )}>
            Waiting for host to start a new round…
          </div>
        )}
        <ShareResultsButton
          cinematic={cinematic}
          modeLabel="Party mode"
          rows={sorted}
          winnerScore={winnerScore}
          winners={winners}
          className="mt-3"
        />
      </div>
      </div>
    </>
  );

  if (cinematic) {
    return <HomeStageShell>{inner}</HomeStageShell>;
  }

  return (
    <div className="fade-enter relative h-full max-h-[100dvh] overflow-hidden flex flex-col">
      {inner}
    </div>
  );
}

// (single-device / pass-around mode removed)

// ---------- GameView (after start screen, with session) ----------
function GameView({ choice, onReset }) {
  if (choice.game !== "beat") return null;
  const mode = useMemoApp(
    () => ({ kind: choice.kind, code: choice.code, songsPerPlayer: choice.songsPerPlayer }),
    [choice.kind, choice.code, choice.songsPerPlayer]
  );
  const useSess = window.useSession;
  if (!useSess) {
    return (
      <div className="p-8 text-center ui-body">
        Party Mode failed to load. Refresh the page.
        <button type="button" onClick={onReset} className="block mx-auto mt-4 btn-spotify rounded-xl px-5 py-2.5 font-semibold">BACK</button>
      </div>
    );
  }
  const { deviceId, state, dispatch, status, isHost } = useSess(mode, choice.name);

  // Splash auto-advances; only host triggers it
  const enterRound = useRefApp(() => {});
  useEffectApp(() => {
    // roundStartedAt is recorded server-side when this action arrives.
    enterRound.current = () => dispatch({ type: "enterRound" });
  }, [dispatch]);

  if (status.kind !== "ready") {
    return <ConnectionGate status={status} mode={mode} onReset={onReset} />;
  }

  const common = {
    state, dispatch, deviceId, isHost,
    code: choice.code, mode, onLeave: onReset,
  };

  return (
    <>
      {state.phase === "lobby" && (
        <LobbyScreen {...common} />
      )}
      {state.phase === "splash" && (
        <SplashScreen
          roundNumber={state.roundIdx + 1}
          totalRounds={state.order.length}
          onDone={() => enterRound.current && enterRound.current()}
          isHost={isHost}
          cinematic
        />
      )}
      {state.phase === "round" && (
        <RoundScreen {...common} />
      )}
      {state.phase === "results" && <ResultsScreen {...common} cinematic />}
      {state.phase === "final" && <FinalScreen {...common} cinematic />}
    </>
  );
}

// ---------- STAGE MODE ----------
const STAGE_ACCENT = "#FF2D78";
const STAGE_PREVIEW_MAX_SEC = 30;
const MIC_INPUT_GAIN = 5;
const PITCH_CLARITY_MIN = 0.82;
const PITCH_CLARITY_VOICE_MIN = 0.84;
const PITCH_CLARITY_SCORE_MIN = 0.8;
const PITCH_RMS_MIN = 0.004;
const PITCH_SCORE_RMS_MIN = 0.002;
const PITCH_HZ_MIN = 80;
const PITCH_HZ_MAX = 1200;
const VOICE_PITCH_MIN = 100;
const VOICE_PITCH_MAX = 900;
const VOICE_BAND_RATIO_MIN = 0.26;
const VOICE_RMS_ABOVE_NOISE_FACTOR = 2.0;
const MIC_BLEED_RMS_FACTOR = 1.1;
const PITCH_MATCH_CENTS = 80;
const PITCH_SCORE_MATCH_CENTS = 110;

const SCORE_LABELS = [
  { min: 100, max: 100, label: "⭐ PITCH PERFECT" },
  { min: 80, max: 99, label: "🎤 STAGE READY" },
  { min: 60, max: 79, label: "🎵 FEELING IT" },
  { min: 40, max: 59, label: "🚿 SHOWER SINGER" },
  { min: 20, max: 39, label: "📻 STATIC ENERGY" },
  { min: 0, max: 19, label: "🔇 THE MIC WAS ON?" },
];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function formatStageTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Deezer 30s previews: 30–60s for long tracks, last 30s for medium, full song if short. */
function computeDeezerPreviewStartSec(durationSec) {
  const d = durationSec > 0 ? durationSec : 0;
  if (d > 60) return 30;
  if (d > 30) return d - 30;
  return 0;
}

function stageTrackFromDeezer(t) {
  if (!t || !t.id) return null;
  const durationSec = t.duration ? Number(t.duration) : 0;
  return {
    deezerTrackId: String(t.id),
    title: String(t.title_short || t.title || "").trim(),
    artist: (t.artist && t.artist.name) ? String(t.artist.name).trim() : "Unknown artist",
    albumName: (t.album && t.album.title) ? String(t.album.title).trim() : "",
    albumArt: (t.album && t.album.cover_medium) || (t.album && t.album.cover_small) || null,
    previewUrl: t.preview ? String(t.preview) : null,
    durationSec,
    previewStartSec: computeDeezerPreviewStartSec(durationSec),
  };
}

async function enrichStageTrack(track) {
  if (track.durationSec > 0 && track.albumName) return track;
  try {
    const url = `https://api.deezer.com/track/${track.deezerTrackId}`;
    const data = await fetchDeezerApi(url);
    const durationSec = data && data.duration ? Number(data.duration) : track.durationSec || 0;
    const albumName = (data && data.album && data.album.title)
      ? String(data.album.title).trim()
      : (track.albumName || "");
    return {
      ...track,
      durationSec,
      albumName,
      previewStartSec: computeDeezerPreviewStartSec(durationSec),
    };
  } catch (e) {
    return {
      ...track,
      durationSec: track.durationSec || 0,
      previewStartSec: track.previewStartSec != null ? track.previewStartSec : 30,
    };
  }
}

/**
 * Where the Deezer 30s MP3 begins in the full song (seconds).
 * Try candidate start times; pick the 30s window with lyrics that begin soon in the clip.
 */
function pickPreviewStartSec(lyrics, durationSec) {
  const fallback = computeDeezerPreviewStartSec(durationSec);
  if (!lyrics || lyrics.length === 0) return fallback;
  const d = durationSec > 0 ? durationSec : 240;
  const window = STAGE_PREVIEW_MAX_SEC;
  const maxStart = Math.max(0, Math.floor(d) - window);
  const candidates = new Set([fallback, 0]);
  for (let s = 0; s <= maxStart; s += 5) candidates.add(s);

  let bestStart = fallback;
  let bestScore = -Infinity;
  candidates.forEach((start) => {
    const inWindow = lyrics.filter(
      (l) => l.timeSeconds >= start && l.timeSeconds < start + window
    );
    if (inWindow.length === 0) return;
    const firstInClip = inWindow[0].timeSeconds - start;
    const score = inWindow.length * 8
      + (start === fallback ? 6 : 0)
      + (firstInClip <= 6 ? 10 : 0)
      - firstInClip * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestStart = start;
    }
  });
  return bestStart;
}

/** Lines whose timestamps fall inside [previewStart, previewStart + 30s) of the full song. */
function clipLyricsForPreview(lyrics, previewStartSec) {
  if (!lyrics || lyrics.length === 0) return [];
  const start = previewStartSec != null ? previewStartSec : 0;
  const end = start + STAGE_PREVIEW_MAX_SEC;
  let clip = lyrics.filter((l) => l.timeSeconds >= start - 0.02 && l.timeSeconds < end + 0.02);
  if (clip.length > 0) return clip;
  clip = lyrics.filter((l) => l.timeSeconds < end && l.timeSeconds + 1 >= start);
  if (clip.length > 0) return clip;
  return lyrics;
}

/** Full-song playback time while the preview MP3 is playing. */
function getStageSongTime(audioCurrentTime, previewStartSec) {
  const start = previewStartSec != null ? previewStartSec : 0;
  return start + audioCurrentTime;
}

function medianLyricLineGapSec(lines) {
  if (!lines || lines.length < 2) return 1.5;
  const gaps = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i].timeSeconds - lines[i - 1].timeSeconds;
    if (gap > 0.08 && gap < 14) gaps.push(gap);
  }
  if (gaps.length === 0) return 1.5;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

/**
 * LRC tags often mark when a phrase ends / next begins, so naive matching lags ~1 line.
 * Advance timing by a fraction of the typical gap between lines.
 */
function findActiveLyricIndex(lines, audioTimeSec, previewStartSec) {
  if (!lines || lines.length === 0) return -1;
  const start = previewStartSec != null ? previewStartSec : 0;
  const gap = medianLyricLineGapSec(lines);
  const lineLead = clamp(gap * 0.65, 0.75, 3.5);
  const t = audioTimeSec + lineLead;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    const relStart = lines[i].timeSeconds - start;
    if (t >= relStart - 0.05) idx = i;
    else break;
  }
  return idx;
}

function pitchCentsDiff(hzA, hzB) {
  if (hzA <= 0 || hzB <= 0) return 9999;
  return Math.abs(1200 * Math.log2(hzA / hzB));
}

function pitchMatchesReference(micHz, refHz, maxCents) {
  if (micHz <= 0 || refHz <= 0) return false;
  const raw = pitchCentsDiff(micHz, refHz);
  const wrapped = [raw, Math.abs(raw - 1200), Math.abs(raw + 1200), Math.abs(raw - 2400), Math.abs(raw + 2400)];
  return Math.min(...wrapped) <= maxCents;
}

function detectVoicedPitch(detector, buffer, sampleRate, rms) {
  const [pitch, clarity] = detector.findPitch(buffer, sampleRate);
  if (
    clarity <= PITCH_CLARITY_MIN
    || pitch <= PITCH_HZ_MIN
    || pitch >= PITCH_HZ_MAX
    || rms <= PITCH_RMS_MIN
  ) {
    return null;
  }
  return pitch;
}

/**
 * Pitch gate for scoring, looser than the meter (no bleed / spectrum filters,
 * which can zero out real singing) but a frame only counts as sung when BOTH:
 *   1. pitchy clarity clears PITCH_CLARITY_SCORE_MIN (real voiced pitch), and
 *   2. rms clears the mic meter's adaptive volume gate (same noise-floor gate
 *      as micVoiceMeterLevel), so quiet room noise never registers as singing.
 * Frames that fail either gate return null and contribute ZERO to the score.
 */
function detectMicPitchForScore(detector, buffer, sampleRate, tracker) {
  const rms = rmsFromTimeDomain(buffer);
  if (rms <= PITCH_SCORE_RMS_MIN) return null;
  // Mic meter's volume gate: must rise above the adaptive noise floor.
  if (tracker && rms <= tracker.noiseFloor * VOICE_RMS_ABOVE_NOISE_FACTOR + 0.0025) return null;
  const [pitch, clarity] = detector.findPitch(buffer, sampleRate);
  if (clarity <= PITCH_CLARITY_SCORE_MIN) return null;
  if (pitch < 85 || pitch > 1100) return null;
  return pitch;
}

function rmsFromTimeDomain(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

function createMicVoiceTracker() {
  return { noiseFloor: 0.004, bleedRms: 0.005 };
}

function updateMicNoiseFloor(tracker, rms, clarity) {
  if (rms < tracker.noiseFloor * 2.2 && clarity < 0.78) {
    tracker.noiseFloor = tracker.noiseFloor * 0.92 + rms * 0.08;
  }
  tracker.noiseFloor = clamp(tracker.noiseFloor, 0.0015, 0.045);
}

function voiceBandEnergyRatio(analyser, sampleRate) {
  const binCount = analyser.frequencyBinCount;
  const spectrum = new Float32Array(binCount);
  analyser.getFloatFrequencyData(spectrum);
  const binHz = sampleRate / analyser.fftSize;
  const lowBin = Math.max(1, Math.floor(280 / binHz));
  const highBin = Math.min(binCount - 1, Math.ceil(3500 / binHz));
  let voiceSum = 0;
  let totalSum = 0;
  for (let i = 1; i < binCount; i++) {
    const mag = Math.pow(10, spectrum[i] / 20);
    totalSum += mag;
    if (i >= lowBin && i <= highBin) voiceSum += mag;
  }
  return totalSum > 1e-9 ? voiceSum / totalSum : 0;
}

/**
 * Distinguish sung human voice from room noise / speaker bleed using pitch clarity,
 * vocal frequency range, speech-band spectrum, adaptive noise floor, and bleed baseline.
 */
function detectHumanVoicePitch(detector, analyser, buffer, sampleRate, tracker, refHz) {
  const rms = rmsFromTimeDomain(buffer);
  const [pitch, clarity] = detector.findPitch(buffer, sampleRate);
  updateMicNoiseFloor(tracker, rms, clarity);

  const bandRatio = voiceBandEnergyRatio(analyser, sampleRate);
  const aboveNoise = rms > tracker.noiseFloor * VOICE_RMS_ABOVE_NOISE_FACTOR + 0.0025;
  const inVocalRange = pitch >= VOICE_PITCH_MIN && pitch <= VOICE_PITCH_MAX;
  const clear = clarity >= PITCH_CLARITY_VOICE_MIN;
  const voiceSpectrum = bandRatio >= VOICE_BAND_RATIO_MIN;

  if (refHz > 0 && (clarity < PITCH_CLARITY_VOICE_MIN || !inVocalRange)) {
    tracker.bleedRms = tracker.bleedRms * 0.965 + rms * 0.035;
  }
  tracker.bleedRms = clamp(tracker.bleedRms, tracker.noiseFloor, 0.2);

  let isVoice = inVocalRange && clear && aboveNoise && voiceSpectrum && rms > PITCH_RMS_MIN;
  if (isVoice && refHz > 0) {
    const aboveBleed = rms > tracker.bleedRms * MIC_BLEED_RMS_FACTOR + tracker.noiseFloor * 0.35;
    const clearVoice = clarity >= 0.88 && bandRatio >= VOICE_BAND_RATIO_MIN + 0.04;
    isVoice = aboveBleed || clearVoice;
  }

  const voiceLevel = isVoice
    ? clamp((rms - tracker.noiseFloor) / 0.07, 0, 1) * clamp(clarity, 0, 1)
    : 0;

  return {
    pitch: isVoice ? pitch : null,
    isVoice,
    voiceLevel,
    rms,
    clarity,
  };
}

function micVoiceMeterLevel(analyser, buffer, sampleRate, tracker, detector) {
  if (detector) {
    return detectHumanVoicePitch(detector, analyser, buffer, sampleRate, tracker, 0).voiceLevel;
  }
  const rms = rmsFromTimeDomain(buffer);
  updateMicNoiseFloor(tracker, rms, 0);
  const bandRatio = voiceBandEnergyRatio(analyser, sampleRate);
  const aboveNoise = rms > tracker.noiseFloor * VOICE_RMS_ABOVE_NOISE_FACTOR + 0.0025;
  if (!aboveNoise || bandRatio < VOICE_BAND_RATIO_MIN * 0.85) return 0;
  return clamp((rms - tracker.noiseFloor) / 0.07, 0, 1);
}

function connectStageMicAnalyser(ctx, stream) {
  const source = ctx.createMediaStreamSource(stream);
  const gain = ctx.createGain();
  gain.gain.value = MIC_INPUT_GAIN;
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 100;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3400;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.25;
  source.connect(gain);
  gain.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(analyser);
  return {
    analyser,
    buffer: new Float32Array(analyser.fftSize),
  };
}

const STAGE_MIC_CONSTRAINTS = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

function initialStageState() {
  return {
    screen: "search",
    selectedTrack: null,
    lyrics: [],
    previewClipLyrics: [],
    plainLyrics: "",
    lyricsStatus: "idle",
    lyricsTrackId: null,
    lyricsLoadKey: 0,
    micStatus: "idle",
    performanceStatus: "idle",
    recordedPitches: [],
    totalFrames: 0,
    voicedFrames: 0,
    score: null,
    scoreLabel: null,
    previewError: null,
    searchLoading: false,
    searchError: null,
    micStream: null,
    performanceRun: 0,
  };
}

function scoreLabelFor(score, pitchSampleCount) {
  if (score === 0 && pitchSampleCount < 8) return "NO SIGNAL, was your mic on?";
  if (score === 0) return "🔇 THE MIC WAS ON?";
  const row = SCORE_LABELS.find((r) => score >= r.min && score <= r.max);
  return row ? row.label : SCORE_LABELS[SCORE_LABELS.length - 1].label;
}

/**
 * Pitch stability: fraction of consecutive voiced samples whose pitch moves
 * smoothly (held notes / glides) rather than jumping erratically the way
 * noise-triggered detections do. 0 when there's too little voiced input.
 */
function computePitchStability(pitchSamples) {
  const voiced = pitchSamples.filter((s) => s.hz > 0);
  if (voiced.length < 8) return 0;
  let steady = 0;
  let pairs = 0;
  for (let i = 1; i < voiced.length; i++) {
    const dt = voiced[i].time - voiced[i - 1].time;
    if (dt <= 0 || dt > 0.25) continue; // gap between phrases, not consecutive
    pairs += 1;
    if (Math.abs(pitchCentsDiff(voiced[i].hz, voiced[i - 1].hz)) <= 150) steady += 1;
  }
  if (pairs < 6) return 0;
  return steady / pairs;
}

function computeRefMatchAccuracy(pitchSamples) {
  const withRef = pitchSamples.filter((s) => s.hz > 0 && s.refHz > 0);
  if (withRef.length < 4) return null;
  const hits = withRef.filter((s) => pitchMatchesReference(s.hz, s.refHz, PITCH_SCORE_MATCH_CENTS)).length;
  return hits / withRef.length;
}

/**
 * Score is driven by how much of the clip had a CLEAR voiced pitch (frames
 * that passed both the clarity gate and the mic meter's volume gate) combined
 * with pitch stability. There is no neutral baseline: frames with no voiced
 * input contribute zero, so silence or background noise scores ~0.
 */
function computeStageScore(pitchSamples, totalFrames, voicedFrames) {
  if (totalFrames <= 0) return { score: 0, label: "NO SIGNAL, was your mic on?" };

  const sampleCount = pitchSamples.length;
  const voicedRatio = clamp(voicedFrames / totalFrames, 0, 1);
  // Silent (or noise-only) take: nothing cleared the gates, hard zero.
  if (sampleCount < 6 || voicedRatio < 0.04) {
    return { score: 0, label: scoreLabelFor(0, sampleCount) };
  }

  // Presence saturates around 55% of frames voiced, previews have
  // instrumental stretches, so nobody sings every frame.
  const presence = clamp(voicedRatio / 0.55, 0, 1);
  const stability = computePitchStability(pitchSamples);
  const refMatch = computeRefMatchAccuracy(pitchSamples);
  // Melody component: match against the track's pitch when we have a usable
  // reference, otherwise fall back to stability (sustained controlled notes).
  const melody = refMatch != null ? refMatch : stability;

  // Everything scales with presence: stability/melody can only add points in
  // proportion to how much actual singing there was.
  const rawScore = clamp(presence * (50 + stability * 25 + melody * 25), 0, 100);
  const score = Math.round(rawScore);
  return { score, label: scoreLabelFor(score, sampleCount) };
}

function parseLrc(syncedLyrics) {
  if (!syncedLyrics || typeof syncedLyrics !== "string") return [];
  const parsed = [];
  const text = syncedLyrics.replace(/\r\n/g, "\n");
  let offsetSec = 0;
  const offsetTagRe = /\[offset\s*:\s*([+-]?\d+)\]/gi;
  let offsetMatch;
  while ((offsetMatch = offsetTagRe.exec(text)) !== null) {
    const raw = parseInt(offsetMatch[1], 10);
    if (!Number.isNaN(raw)) offsetSec += raw / 1000;
  }
  const timeTagRe = /\[(\d+):(\d+(?:\.\d+)?)\]/g;
  const hourTagRe = /\[(\d+):(\d+):(\d+(?:\.\d+)?)\]/g;
  for (const rawLine of text.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed || /^\[offset\s*:/i.test(trimmed)) continue;
    const times = [];
    let tagMatch;
    hourTagRe.lastIndex = 0;
    while ((tagMatch = hourTagRe.exec(trimmed)) !== null) {
      times.push(
        parseInt(tagMatch[1], 10) * 3600
        + parseInt(tagMatch[2], 10) * 60
        + parseFloat(tagMatch[3])
        + offsetSec
      );
    }
    if (times.length === 0) {
      timeTagRe.lastIndex = 0;
      while ((tagMatch = timeTagRe.exec(trimmed)) !== null) {
        times.push(parseInt(tagMatch[1], 10) * 60 + parseFloat(tagMatch[2]) + offsetSec);
      }
    }
    if (times.length === 0) continue;
    const lyricText = trimmed
      .replace(/\[(\d+):(\d+):(\d+(?:\.\d+)?)\]/g, "")
      .replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, "")
      .trim();
    if (!lyricText) continue;
    for (const timeSeconds of times) {
      parsed.push({ timeSeconds, text: lyricText });
    }
  }
  return parsed.sort((a, b) => a.timeSeconds - b.timeSeconds);
}

async function fetchWithCorsFallback(url, timeoutMs = 6000) {
  // Each path, direct, then each CORS proxy, gets its own retry-with-backoff,
  // so a single transient hiccup on any one of them doesn't drop the request.
  try {
    return await fetchJsonWithRetry(url, timeoutMs);
  } catch (directErr) {
    const proxyTimeout = Math.min(6000, timeoutMs);
    const proxies = [
      (target) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
      (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    ];
    const results = await Promise.all(
      proxies.map((toProxy) =>
        fetchJsonWithRetry(toProxy(url), proxyTimeout).catch(() => null)
      )
    );
    for (const data of results) {
      if (data != null) return data;
    }
    throw new Error("cors");
  }
}

async function stageDeezerSearch(query) {
  const data = await fetchDeezerApi(`/search?q=${encodeURIComponent(query)}&limit=8`);
  const raw = (data && data.data) || [];
  return raw.map(stageTrackFromDeezer).filter((t) => t && t.title);
}

function lrclibHitToResult(hit) {
  if (!hit) return { status: "none", lyrics: [], plain: "" };
  if (hit.syncedLyrics) {
    const parsed = parseLrc(hit.syncedLyrics);
    if (parsed.length > 0) {
      return { status: "synced", lyrics: parsed, plain: hit.plainLyrics || "" };
    }
  }
  if (hit.plainLyrics) {
    return { status: "plain", lyrics: [], plain: String(hit.plainLyrics) };
  }
  return { status: "none", lyrics: [], plain: "" };
}

const stageLyricsCache = new Map();
const stageLyricsInflight = new Map();

function stageLyricsCacheKey(title, artist, durationSec) {
  return `${String(title).trim().toLowerCase()}|${String(artist).trim().toLowerCase()}|${Math.round(durationSec || 0)}`;
}

function pickBestLrcHit(exactHit, searchList, qList, durationSec) {
  if (exactHit && !exactHit.code && exactHit.syncedLyrics) {
    const exact = lrclibHitToResult(exactHit);
    if (exact.status === "synced") return exactHit;
  }

  const rawHits = [];
  if (exactHit && !exactHit.code) rawHits.push(exactHit);
  if (Array.isArray(searchList)) rawHits.push(...searchList);
  if (Array.isArray(qList)) {
    const seen = new Set(rawHits.map((h) => h && h.id).filter(Boolean));
    for (const hit of qList) {
      if (hit && hit.id && !seen.has(hit.id)) rawHits.push(hit);
    }
  }
  if (rawHits.length === 0) return null;

  let hit = rawHits.find((r) => r.syncedLyrics) || rawHits[0];
  if (durationSec > 0) {
    const durationMatch = rawHits.find(
      (r) => r.syncedLyrics && r.duration && Math.abs(Number(r.duration) - durationSec) <= 4
    );
    if (durationMatch) hit = durationMatch;
  }
  return hit;
}

async function fetchStageLyricsUncached(title, artist, durationSec, albumName) {
  const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
  const qUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
  const getUrl = durationSec > 0
    ? `https://lrclib.net/api/get?${new URLSearchParams({
      track_name: title,
      artist_name: artist,
      album_name: albumName || title,
      duration: String(Math.round(durationSec)),
    }).toString()}`
    : null;

  const timeoutMs = 8000;

  // Track whether ANY of the three requests actually reached LRCLIB (resolved
  // without throwing, even with an empty result). If every request fails after
  // its retries, network error, timeout, or every proxy down, then a "none"
  // outcome is transient, not a genuine not-found, and must not be cached.
  let anyReached = false;
  const run = async (url, fallback) => {
    if (!url) return fallback;
    try {
      const data = await fetchWithCorsFallback(url, timeoutMs);
      anyReached = true;
      return data;
    } catch {
      return fallback;
    }
  };

  const [exactHit, searchList, qList] = await Promise.all([
    run(getUrl, null),
    run(searchUrl, []),
    run(qUrl, []),
  ]);

  const hit = pickBestLrcHit(exactHit, searchList, qList, durationSec);
  const result = lrclibHitToResult(hit);

  // No lyrics found AND nothing reached LRCLIB → flag as transient so the
  // caller returns not-found for this call but leaves the cache untouched.
  if (result.status === "none" && !anyReached) {
    result.transient = true;
  }
  return result;
}

async function fetchStageLyrics(title, artist, durationSec, albumName) {
  const key = stageLyricsCacheKey(title, artist, durationSec);
  if (stageLyricsCache.has(key)) return stageLyricsCache.get(key);
  if (stageLyricsInflight.has(key)) return stageLyricsInflight.get(key);

  const promise = fetchStageLyricsUncached(title, artist, durationSec, albumName)
    .then((result) => {
      stageLyricsInflight.delete(key);
      // A transient all-requests-failed "none" is returned for this call but
      // deliberately NOT cached, so a later attempt for the same track can
      // still pick up its lyrics instead of being stuck on freestyle.
      if (result && result.transient) {
        const { transient, ...clean } = result;
        return clean;
      }
      // Genuine outcomes, synced, plain, or a real not-found, are cached.
      stageLyricsCache.set(key, result);
      return result;
    })
    .catch(() => {
      stageLyricsInflight.delete(key);
      // Unexpected throw: treat as transient and leave the cache untouched.
      return { status: "none", lyrics: [], plain: "" };
    });

  stageLyricsInflight.set(key, promise);
  return promise;
}

function prefetchStageLyrics(track) {
  if (!track || !track.title) return;
  fetchStageLyrics(
    track.title,
    track.artist,
    track.durationSec || 0,
    track.albumName || ""
  );
}

function buildStageLyricsPayload(track, lyricsRes) {
  const previewStartSec = lyricsRes.status === "synced" && lyricsRes.lyrics.length > 0
    ? pickPreviewStartSec(lyricsRes.lyrics, track.durationSec || 0)
    : computeDeezerPreviewStartSec(track.durationSec || 0);
  const previewClipLyrics = lyricsRes.status === "synced" && lyricsRes.lyrics.length > 0
    ? clipLyricsForPreview(lyricsRes.lyrics, previewStartSec)
    : [];
  return {
    ...lyricsRes,
    previewStartSec,
    previewClipLyrics,
  };
}

async function loadStageTrackAndLyrics(track) {
  const needsEnrich = !(track.durationSec > 0 && track.albumName);
  const [enriched, lyricsResInitial] = await Promise.all([
    needsEnrich ? enrichStageTrack(track) : Promise.resolve(track),
    fetchStageLyrics(
      track.title,
      track.artist,
      track.durationSec || 0,
      track.albumName || ""
    ),
  ]);
  let lyricsRes = lyricsResInitial;
  if (
    needsEnrich
    && enriched.durationSec > 0
    && Math.abs((track.durationSec || 0) - enriched.durationSec) > 2
  ) {
    lyricsRes = await fetchStageLyrics(
      enriched.title,
      enriched.artist,
      enriched.durationSec,
      enriched.albumName || ""
    );
  }
  return {
    track: enriched,
    lyrics: buildStageLyricsPayload(enriched, lyricsRes),
  };
}

function waitForPitchy() {
  return new Promise((resolve) => {
    if (window.PitchDetector) {
      resolve(window.PitchDetector);
      return;
    }
    const onReady = () => {
      window.removeEventListener("pitchy-ready", onReady);
      resolve(window.PitchDetector);
    };
    window.addEventListener("pitchy-ready", onReady);
    setTimeout(() => resolve(window.PitchDetector || null), 8000);
  });
}

function StageSearchScreen({ state, dispatch }) {
  const [query, setQuery] = useStateApp("");
  const [results, setResults] = useStateApp([]);
  // deezerTrackId -> "checking" | "synced" | "freestyle". Filled in the
  // background after results render so the list never waits on LRCLIB.
  const [lyricsBadges, setLyricsBadges] = useStateApp({});
  const debRef = useRefApp(null);
  const snippetRef = useRefApp(null);

  // Probe LRCLIB for each result to learn whether it has synced lyrics. Runs
  // off the render path with limited concurrency; reuses the shared lyrics
  // cache so a later SELECT is already warm. Slow/failed checks fall back to
  // the freestyle indicator rather than leaving a row blank.
  useEffectApp(() => {
    if (!results.length) {
      setLyricsBadges({});
      return;
    }
    let cancelled = false;
    setLyricsBadges(() => {
      const init = {};
      for (const t of results) init[t.deezerTrackId] = "checking";
      return init;
    });

    const queue = results.slice();
    const CONCURRENCY = 4;
    const worker = async () => {
      while (!cancelled && queue.length) {
        const t = queue.shift();
        let status = "freestyle";
        try {
          const res = await fetchStageLyrics(t.title, t.artist, t.durationSec || 0, t.albumName || "");
          status = res && res.status === "synced" ? "synced" : "freestyle";
        } catch {
          status = "freestyle";
        }
        if (cancelled) return;
        setLyricsBadges((prev) => ({ ...prev, [t.deezerTrackId]: status }));
      }
    };
    for (let i = 0; i < Math.min(CONCURRENCY, results.length); i++) worker();

    return () => { cancelled = true; };
  }, [results]);

  useEffectApp(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      dispatch({ type: "setSearchLoading", loading: false });
      return;
    }
    dispatch({ type: "setSearchLoading", loading: true });
    debRef.current = setTimeout(async () => {
      try {
        const tracks = await stageDeezerSearch(q);
        setResults(tracks);
        dispatch({ type: "setSearchError", error: null });
      } catch (e) {
        setResults([]);
        dispatch({ type: "setSearchError", error: DEEZER_SEARCH_RETRY_MSG });
      } finally {
        dispatch({ type: "setSearchLoading", loading: false });
      }
    }, 300);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [query, dispatch]);

  const playSnippet = (url) => {
    if (!url) return;
    if (snippetRef.current) {
      snippetRef.current.pause();
      snippetRef.current = null;
    }
    const a = new Audio(url);
    snippetRef.current = a;
    a.volume = 0.85;
    a.play().then(() => {
      setTimeout(() => { a.pause(); a.currentTime = 0; }, 2000);
    }).catch(() => {});
  };

  return (
    <div className="stage-shell stage-content flex-1 px-6 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STAGE_ACCENT }} />
        <h2 className="font-display text-[28px] tracking-[0.08em]" style={{ color: STAGE_ACCENT }}>STAGE MODE</h2>
      </div>
      <p className="ui-body mb-4">
        Search a song, sing the 30 second preview, get a score
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs on Deezer…"
        className="stage-search-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
        autoFocus
      />

      {state.searchLoading && (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stage-skeleton h-16 rounded-xl" />
          ))}
        </div>
      )}

      {!state.searchLoading && query.trim().length >= 2 && results.length === 0 && (
        <div className="mt-6 text-center ui-body">
          No tracks found, try another search.
        </div>
      )}

      {state.searchError && (
        <div className="mt-3 font-mono text-[11px] text-[var(--hp-magenta)]">{state.searchError}</div>
      )}

      <div className="mt-4 space-y-2">
        {results.map((track) => (
          <div
            key={track.deezerTrackId}
            className="stage-result-card rounded-xl border border-[var(--border-neutral)] bg-black/40 p-3 flex items-center gap-3"
          >
            {track.albumArt ? (
              <img src={track.albumArt} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[var(--border-neutral)]" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#222] shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{track.title}</div>
              <div className="text-[11px] text-white/50 truncate">{track.artist}</div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={!track.previewUrl}
                  onClick={() => playSnippet(track.previewUrl)}
                  className="ui-label hover:opacity-80 disabled:opacity-30"
                  style={{ color: STAGE_ACCENT }}
                >
                  ▶ Preview
                </button>
                <StageLyricsBadge status={lyricsBadges[track.deezerTrackId] || "checking"} />
              </div>
            </div>
            <button
              type="button"
              disabled={!track.previewUrl}
              onClick={() => {
                prefetchStageLyrics(track);
                dispatch({ type: "selectTrack", track });
              }}
              className="stage-select-btn shrink-0 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide"
            >
              SELECT
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fixed-capacity volume meter: a row of `slots` empty bars (thin gray outline,
// no fill) so the full range and maximum are always visible. The current input
// level fills the slots left-to-right with the pink stage accent. The fill has
// a fast attack and a slow release so it tracks the voice in real time but
// falls back naturally when the user stops. This is purely visual, the mic
// detection / level value is taken from `level` unchanged.
//
// Threshold marker positions (0–1 fraction along the bar row) with labels
// shown below so users know how loud is enough for a good score.
const MIC_THRESHOLDS = [
  { frac: 0.27, label: "OK" },
  { frac: 0.57, label: "GOOD" },
  { frac: 0.87, label: "GREAT" },
];

function MicLevelBars({ level, slots = 20, height = 28, className }) {
  const [display, setDisplay] = useStateApp(0);
  const displayRef = useRefApp(0);
  const targetRef = useRefApp(0);

  useEffectApp(() => {
    targetRef.current = clamp(level, 0, 1);
  }, [level]);

  useEffectApp(() => {
    let raf = null;
    let mounted = true;
    const tick = () => {
      const target = targetRef.current;
      const cur = displayRef.current;
      // Fast attack when rising, slow release (decay) when falling back.
      const coeff = target > cur ? 0.5 : 0.12;
      let next = cur + (target - cur) * coeff;
      if (Math.abs(next - target) < 0.001) next = target;
      if (next !== cur) {
        displayRef.current = next;
        setDisplay(next);
      }
      if (mounted) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const v = clamp(display, 0, 1);
  const filled = v * slots;
  return (
    <div className={cx("w-full", className)} aria-hidden="true" role="meter" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      {/* Bar row */}
      <div
        className="relative flex items-stretch gap-[3px] w-full"
        style={{ height: `${height}px` }}
      >
        {Array.from({ length: slots }).map((_, i) => {
          const slotFill = clamp(filled - i, 0, 1);
          return (
            <div
              key={i}
              className="relative flex-1 min-w-0 rounded-[2px] border border-[var(--border-neutral)]"
            >
              <div
                className="absolute inset-y-[1px] left-[1px] rounded-[1px]"
                style={{
                  width: `calc(${slotFill * 100}% - 1px)`,
                  background: "var(--stage-accent)",
                  opacity: slotFill > 0.02 ? 1 : 0,
                  boxShadow: slotFill > 0.4 ? "0 0 6px var(--stage-accent)" : undefined,
                  transition: "opacity 60ms linear",
                }}
              />
            </div>
          );
        })}
        {/* Threshold marker lines overlaid on the bar row */}
        {MIC_THRESHOLDS.map(({ frac }) => (
          <div
            key={frac}
            className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
            style={{ left: `calc(${frac * 100}% - 1px)`, background: "rgba(255,255,255,0.35)" }}
          />
        ))}
      </div>
      {/* Labels row, positioned below each marker */}
      <div className="relative w-full" style={{ height: "11px", marginTop: "2px" }}>
        {MIC_THRESHOLDS.map(({ frac, label }) => (
          <span
            key={label}
            className="absolute ui-label opacity-80"
            style={{
              left: `${frac * 100}%`,
              transform: "translateX(-50%)",
              fontSize: "8px",
              lineHeight: 1,
              top: 0,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Intentional "Freestyle" state for tracks with no synced lyrics from LRCLIB.
// LRCLIB's synced coverage is thin, so a missing lyric track is a designed mode
// (sing freely, pitch + timing still scored) rather than an error/fallback.
// `compact` renders a small card for the Ready screen; the full version is the
// hero state shown in place of lyrics during the performance.
function StageFreestyleState({ compact }) {
  if (compact) {
    return (
      <div
        className="rounded-xl border p-3.5 flex items-center gap-3"
        style={{ borderColor: `${STAGE_ACCENT}55`, background: `${STAGE_ACCENT}14` }}
      >
        <span
          className="font-display text-[18px] tracking-[0.12em] shrink-0"
          style={{ color: STAGE_ACCENT, textShadow: `0 0 18px ${STAGE_ACCENT}66` }}
        >
          FREESTYLE
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55 leading-relaxed">
          No synced lyrics for this one. Sing freely, you&apos;re still scored on pitch and timing.
        </span>
      </div>
    );
  }
  return (
    <div className="text-center px-6 select-none">
      <div className="inline-flex items-center gap-2 ui-label opacity-80 mb-4">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: STAGE_ACCENT, boxShadow: `0 0 10px ${STAGE_ACCENT}` }}
        />
        No lyrics found for this one
      </div>
      <div
        className="font-display leading-none tracking-[0.1em]"
        style={{
          fontSize: "clamp(2.5rem, 11vw, 4rem)",
          color: STAGE_ACCENT,
          textShadow: `0 0 44px ${STAGE_ACCENT}66`,
        }}
      >
        FREESTYLE
      </div>
      <div
        className="mt-1 font-display tracking-[0.42em] text-white/70"
        style={{ fontSize: "clamp(1rem, 4vw, 1.4rem)" }}
      >
        MODE
      </div>
      <p className="mt-5 max-w-xs mx-auto ui-body leading-relaxed">
        No lyrics here. Sing whatever, your pitch and timing still count.
      </p>
    </div>
  );
}

// Lyrics-availability indicator for a search result row. Binary by design:
// synced lyrics available, or freestyle (no synced lyrics). `checking` is a
// brief, unobtrusive placeholder while the LRCLIB probe is still in flight.
function StageLyricsBadge({ status }) {
  if (status === "synced") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
        style={{ color: STAGE_ACCENT, background: `${STAGE_ACCENT}1f`, border: `1px solid ${STAGE_ACCENT}55` }}
      >
        ♪ Synced lyrics
      </span>
    );
  }
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30 border border-white/10 animate-pulse">
        Checking…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 border border-white/15">
      ✦ Freestyle
    </span>
  );
}

function StageReadyScreen({ state, dispatch, onBack }) {
  const track = state.selectedTrack;
  const micStreamRef = useRefApp(null);
  const analyserRef = useRefApp(null);
  const bufferRef = useRefApp(null);
  const ctxRef = useRefApp(null);
  const rafRef = useRefApp(null);
  const micSmoothRef = useRefApp(0);
  const micVoiceTrackerRef = useRefApp(createMicVoiceTracker());
  const [micLevel, setMicLevel] = useStateApp(0);

  useEffectApp(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch (e) {}
      ctxRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
  }, []);

  useEffectApp(() => {
    if (state.micStatus !== "granted") return;
    let cancelled = false;
    const tick = () => {
      const analyser = analyserRef.current;
      const buffer = bufferRef.current;
      if (analyser && buffer && !cancelled) {
        analyser.getFloatTimeDomainData(buffer);
        const sampleRate = ctxRef.current ? ctxRef.current.sampleRate : 44100;
        const instant = micVoiceMeterLevel(analyser, buffer, sampleRate, micVoiceTrackerRef.current, null);
        micSmoothRef.current = micSmoothRef.current * 0.45 + instant * 0.55;
        setMicLevel(micSmoothRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state.micStatus]);

  const requestMic = async () => {
    dispatch({ type: "setMicStatus", status: "requesting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: STAGE_MIC_CONSTRAINTS });
      micStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const mic = connectStageMicAnalyser(ctx, stream);
      analyserRef.current = mic.analyser;
      bufferRef.current = mic.buffer;
      micSmoothRef.current = 0;
      micVoiceTrackerRef.current = createMicVoiceTracker();
      dispatch({ type: "setMicStatus", status: "granted" });
      dispatch({ type: "setMicStream", stream });
    } catch (e) {
      dispatch({ type: "setMicStatus", status: "denied" });
    }
  };

  if (!track) return null;

  return (
    <div className="stage-shell stage-content flex-1 px-6 pb-8">
      <button type="button" onClick={onBack} className="mb-4 ui-label hover:text-white transition-colors">
        ← Back
      </button>

      <div className="flex items-center gap-4">
        {track.albumArt && (
          <img src={track.albumArt} alt="" className="w-20 h-20 rounded-xl object-cover border border-[var(--border-neutral)]" />
        )}
        <div>
          <div className="font-display text-[24px] leading-tight">{track.title}</div>
          <div className="ui-body">{track.artist}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border-neutral)] bg-black/35 px-3 py-2.5 ui-body">
        Use headphones so the music doesn&apos;t bleed into your score.
      </div>

      {track.previewStartSec != null && (
        <div className="mt-3 ui-body">
          Deezer preview starts at <span style={{ color: STAGE_ACCENT }}>{formatStageTime(track.previewStartSec)}</span> in the full song
          {track.durationSec > 0 && (
            <span className="opacity-70"> (track {formatStageTime(track.durationSec)})</span>
          )}
        </div>
      )}

      {state.lyricsStatus === "loading" && (
        <div className="mt-4 ui-body">Loading lyrics…</div>
      )}
      {(state.lyricsStatus === "none" || state.lyricsStatus === "plain") && (
        <div className="mt-4">
          <StageFreestyleState compact />
        </div>
      )}
      {state.lyricsStatus === "synced" && (state.previewClipLyrics.length > 0 || state.lyrics.length > 0) && (
        <div className="mt-4 rounded-xl border border-[var(--border-neutral)] bg-black/40 p-3 max-h-48 overflow-y-auto">
          <div className="ui-label mb-2">
            Preview lyrics
            {track.previewStartSec != null && (
              <> ({formatStageTime(track.previewStartSec)}–{formatStageTime(track.previewStartSec + STAGE_PREVIEW_MAX_SEC)})</>
            )}
          </div>
          <div className="space-y-1 text-sm text-white/80">
            {(state.previewClipLyrics.length > 0
              ? state.previewClipLyrics
              : clipLyricsForPreview(state.lyrics, track.previewStartSec ?? 0)
            ).map((line, i) => (
              <div key={`${i}-${line.timeSeconds}`}>{line.text}</div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        {state.micStatus === "idle" || state.micStatus === "requesting" ? (
          <button
            type="button"
            onClick={requestMic}
            disabled={state.micStatus === "requesting"}
            className="stage-primary-btn w-full rounded-xl py-4 text-lg font-semibold tracking-wide"
          >
            {state.micStatus === "requesting" ? "REQUESTING…" : "ALLOW MICROPHONE"}
          </button>
        ) : state.micStatus === "denied" ? (
          <div className="rounded-xl border border-[var(--hp-magenta)]/40 bg-black/50 p-4 text-sm text-white/80 leading-relaxed">
            Microphone access is needed to score your performance. Please allow mic access in your browser settings and try again.
            <button type="button" onClick={requestMic} className="stage-primary-btn block w-full mt-4 rounded-xl py-3 text-base font-semibold">
              TRY AGAIN
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-neutral)] bg-black/40 p-4">
            <div className="ui-label mb-2">Mic level (your voice)</div>
            <MicLevelBars level={micLevel} />
            <p className="mt-2 ui-body text-[12px] opacity-85">
              Hum or sing. The bars should follow your voice, not the room.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={state.micStatus !== "granted"}
        onClick={() => dispatch({ type: "goPerformance" })}
        className="stage-primary-btn w-full mt-6 rounded-xl py-4 text-lg font-semibold tracking-wide disabled:opacity-35"
      >
        START SINGING
      </button>
    </div>
  );
}

function StagePerformanceScreen({ state, dispatch, micStream, performanceRun }) {
  const track = state.selectedTrack;
  const ctxRef = useRefApp(null);
  const analyserRef = useRefApp(null);
  const detectorRef = useRefApp(null);
  const bufferRef = useRefApp(null);
  const rafRef = useRefApp(null);
  const pitchesRef = useRefApp([]);
  const totalFramesRef = useRefApp(0);
  const voicedFramesRef = useRefApp(0);
  const micVoiceTrackerRef = useRefApp(createMicVoiceTracker());
  const micSmoothRef = useRefApp(0);
  const [currentTime, setCurrentTime] = useStateApp(0);
  const [pitchHz, setPitchHz] = useStateApp(0);
  const [micLevel, setMicLevel] = useStateApp(0);
  const [previewFailed, setPreviewFailed] = useStateApp(false);
  const [analysisFailed, setAnalysisFailed] = useStateApp(false);
  const [audioProgress, setAudioProgress] = useStateApp(0);

  const lyricsScrollRef = useRefApp(null);
  const allLyrics = state.lyrics || [];
  const previewStart = track ? (track.previewStartSec != null ? track.previewStartSec : 0) : 0;
  const clipLyrics = useMemoApp(() => {
    const start = previewStart;
    if (state.previewClipLyrics && state.previewClipLyrics.length > 0) {
      return state.previewClipLyrics;
    }
    return clipLyricsForPreview(allLyrics, start);
  }, [state.previewClipLyrics, allLyrics, previewStart]);
  // Synced lyrics = the full karaoke experience. Anything else (plain or no
  // lyrics from LRCLIB) is treated as an intentional Freestyle performance.
  const hasLyrics = state.lyricsStatus === "synced" && clipLyrics.length > 0;

  const activeIndex = useMemoApp(() => {
    if (!hasLyrics || !track) return -1;
    return findActiveLyricIndex(clipLyrics, currentTime, previewStart);
  }, [currentTime, clipLyrics, hasLyrics, track, previewStart]);

  const displayIndex = hasLyrics ? (activeIndex >= 0 ? activeIndex : 0) : -1;
  const currentLyricText = hasLyrics && clipLyrics[displayIndex] ? clipLyrics[displayIndex].text : "";

  const finishedRef = useRefApp(false);

  useEffectApp(() => {
    finishedRef.current = false;
    pitchesRef.current = [];
    totalFramesRef.current = 0;
    voicedFramesRef.current = 0;
    micVoiceTrackerRef.current = createMicVoiceTracker();
    setPreviewFailed(false);
    setAnalysisFailed(false);
    setCurrentTime(0);
    setPitchHz(0);
    setAudioProgress(0);
  }, [performanceRun]);

  const finishPerformance = useCallbackApp(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const { score, label } = computeStageScore(
      pitchesRef.current,
      totalFramesRef.current,
      voicedFramesRef.current
    );
    dispatch({
      type: "finishPerformance",
      recordedPitches: pitchesRef.current,
      totalFrames: totalFramesRef.current,
      voicedFrames: voicedFramesRef.current,
      score,
      scoreLabel: label,
    });
  }, [dispatch]);

  useEffectApp(() => {
    if (!track || !micStream) return;
    let cancelled = false;
    const audio = new Audio();
    audio.setAttribute("playsinline", "");
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    // Declared at effect scope so the cleanup return can remove it.
    const onTimeUpdate = () => {
      if (cancelled) return;
      const dur = Math.min(STAGE_PREVIEW_MAX_SEC, audio.duration || STAGE_PREVIEW_MAX_SEC);
      setAudioProgress(clamp(audio.currentTime / dur, 0, 1));
    };

    const run = async () => {
      const PitchDetector = await waitForPitchy();
      if (cancelled) return;
      if (!PitchDetector) {
        setAnalysisFailed(true);
        return;
      }

      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();

        const mic = connectStageMicAnalyser(ctx, micStream);
        analyserRef.current = mic.analyser;
        bufferRef.current = mic.buffer;
        const micDetector = PitchDetector.forFloat32Array(mic.analyser.fftSize);
        detectorRef.current = micDetector;
        micSmoothRef.current = 0;

        let refAnalyser = null;
        let refBuffer = null;
        let refDetector = null;

        let playbackStarted = false;
        const analyser = mic.analyser;
        const buffer = mic.buffer;

        const tick = () => {
          if (cancelled) return;

          analyser.getFloatTimeDomainData(buffer);

          let refHz = 0;
          if (playbackStarted) {
            if (refAnalyser && refDetector && refBuffer) {
              refAnalyser.getFloatTimeDomainData(refBuffer);
              const refRms = rmsFromTimeDomain(refBuffer);
              const refPitch = detectVoicedPitch(refDetector, refBuffer, ctx.sampleRate, refRms * 0.7);
              if (refPitch) refHz = refPitch;
            }
          }

          const scorePitch = detectMicPitchForScore(
            micDetector,
            buffer,
            ctx.sampleRate,
            micVoiceTrackerRef.current
          );
          const micSample = detectHumanVoicePitch(
            micDetector,
            analyser,
            buffer,
            ctx.sampleRate,
            micVoiceTrackerRef.current,
            refHz
          );
          const meterFromScore = scorePitch
            ? clamp(micSample.rms / 0.055, 0.22, 1) * clamp(micSample.clarity, 0.5, 1)
            : 0;
          const meterInstant = Math.max(micSample.voiceLevel, meterFromScore);
          micSmoothRef.current = micSmoothRef.current * 0.45 + meterInstant * 0.55;
          setMicLevel(micSmoothRef.current);

          if (playbackStarted) {
            const tAudio = audio.currentTime;
            setCurrentTime(tAudio);

            totalFramesRef.current += 1;

            if (refHz > 0 && tAudio < 0.5) {
              micVoiceTrackerRef.current.bleedRms = micVoiceTrackerRef.current.bleedRms * 0.88
                + micSample.rms * 0.12;
            }

            if (scorePitch) {
              voicedFramesRef.current += 1;
              pitchesRef.current.push({ time: tAudio, hz: scorePitch, refHz });
              setPitchHz(scorePitch);
            } else {
              setPitchHz(0);
            }

            const duration = Math.min(STAGE_PREVIEW_MAX_SEC, audio.duration || STAGE_PREVIEW_MAX_SEC);
            const endAt = Math.min(duration, STAGE_PREVIEW_MAX_SEC);
            if (audio.ended || tAudio >= endAt - 0.05) {
              finishPerformance();
              return;
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        audio.crossOrigin = "anonymous";
        audio.src = track.previewUrl;
        audio.load();

        const onCanPlay = async () => {
          if (cancelled) return;
          try {
            const source = ctx.createMediaElementSource(audio);
            refAnalyser = ctx.createAnalyser();
            refAnalyser.fftSize = 2048;
            source.connect(refAnalyser);
            source.connect(ctx.destination);
            refBuffer = new Float32Array(refAnalyser.fftSize);
            refDetector = PitchDetector.forFloat32Array(refAnalyser.fftSize);
          } catch (refErr) {
            refAnalyser = null;
            refBuffer = null;
            refDetector = null;
          }
          if (ctx.state === "suspended") await ctx.resume();
          dispatch({ type: "setPerformanceStatus", status: "singing" });
          audio.currentTime = 0;
          audio.play().then(() => {
            playbackStarted = true;
          }).catch(() => {
            setPreviewFailed(true);
          });
        };

        audio.addEventListener("canplaythrough", onCanPlay, { once: true });
        audio.addEventListener("error", () => {
          setPreviewFailed(true);
        }, { once: true });
        // Drive the progress bar from the real audio clock so it always
        // reflects true playback position capped at the 30s preview max.
        audio.addEventListener("timeupdate", onTimeUpdate);
      } catch (e) {
        setPreviewFailed(true);
      }
    };

    run();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      try { audio.pause(); } catch (err) {}
      audio.removeAttribute("src");
      try { audio.load(); } catch (err) {}
      try { ctxRef.current && ctxRef.current.close(); } catch (err) {}
    };
  }, [track, micStream, dispatch, finishPerformance, performanceRun]);

  useEffectApp(() => {
    if (displayIndex < 0 || !lyricsScrollRef.current) return;
    const row = lyricsScrollRef.current.querySelector(`[data-lyric-idx="${displayIndex}"]`);
    if (row) row.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [displayIndex, performanceRun]);

  const progress = clamp(currentTime / STAGE_PREVIEW_MAX_SEC, 0, 1);
  const secondsLeft = Math.max(0, Math.ceil(STAGE_PREVIEW_MAX_SEC - currentTime));
  const pitchNorm = pitchHz > 0 ? clamp((pitchHz - 200) / 600, 0, 1) : 0.5;

  if (!track) return null;

  if (previewFailed || analysisFailed) {
    return (
      <div className="stage-performance flex flex-col items-center justify-center min-h-[70dvh] px-6 text-center">
        <p className="ui-body">
          {analysisFailed
            ? "Pitch detection failed to load, refresh and try again"
            : "Preview unavailable for this track, try another"}
        </p>
        <button type="button" onClick={() => dispatch({ type: "goSearch" })} className="stage-primary-btn mt-6 rounded-xl px-6 py-3 font-semibold">
          NEW SONG
        </button>
      </div>
    );
  }

  return (
    <div className="stage-performance relative flex-1 min-h-0 overflow-hidden flex flex-col">
      {track.albumArt && (
        <img
          src={track.albumArt}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.18] blur-2xl scale-110 pointer-events-none"
        />
      )}
      <div className="stage-spotlight absolute inset-0 pointer-events-none" />

      <div className="relative z-10 px-4 pt-4">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden border border-[var(--border-neutral)]">
          <div className="h-full transition-all duration-100" style={{ width: `${audioProgress * 100}%`, background: STAGE_ACCENT }} />
        </div>
      </div>

      <div className="relative z-10 px-4 pt-2 flex justify-between items-start gap-2">
        <div className="ui-body leading-snug">
          <div className="tabular">Preview {formatStageTime(currentTime)} / 0:30</div>
          {hasLyrics && (
            <div className="tabular mt-0.5" style={{ color: STAGE_ACCENT }}>
              Song {formatStageTime(getStageSongTime(currentTime, previewStart))}
            </div>
          )}
        </div>
        <div className="font-display text-[20px] tabular shrink-0" style={{ color: STAGE_ACCENT }}>{secondsLeft}</div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 px-4 py-3 flex flex-col gap-3 overflow-hidden">
        {hasLyrics ? (
          <>
            {currentLyricText && (
              <div className="shrink-0 text-center px-2 py-2">
                <div
                  className="font-display stage-lyric-current leading-tight"
                  style={{
                    color: "var(--hp-gold)",
                    fontSize: "clamp(1.75rem, 7vw, 2.75rem)",
                  }}
                >
                  {currentLyricText}
                </div>
              </div>
            )}
            <div ref={lyricsScrollRef} className="stage-lyrics-block flex-1 min-h-0 overflow-y-auto w-full max-w-lg mx-auto text-center px-2">
              {clipLyrics.map((line, i) => {
                const isActive = i === displayIndex;
                const isPast = activeIndex >= 0 && i < activeIndex;
                return (
                  <div
                    key={`${i}-${line.timeSeconds}`}
                    data-lyric-idx={i}
                    className="font-display py-1.5 leading-snug"
                    style={{
                      color: isActive ? "var(--hp-gold)" : isPast ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.65)",
                      fontSize: isActive ? "clamp(1.2rem, 4.5vw, 1.65rem)" : "clamp(0.95rem, 3.5vw, 1.1rem)",
                      fontWeight: isActive ? 600 : 400,
                      textShadow: isActive ? "0 0 32px rgba(245, 197, 24, 0.35)" : undefined,
                    }}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </>
        ) : state.lyricsStatus === "loading" ? (
          <div className="flex-1 grid place-items-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 animate-pulse">
              Checking for lyrics…
            </div>
          </div>
        ) : (
          <div className="flex-1 grid place-items-center">
            <StageFreestyleState />
          </div>
        )}
      </div>

      <div className="relative z-10 px-4 pb-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <MicLevelBars level={micLevel} height={16} />
        </div>
        <div
          className="stage-pitch-dot w-3 rounded-full transition-all duration-75 shrink-0"
          style={{
            height: `${24 + pitchNorm * 48}px`,
            background: STAGE_ACCENT,
            boxShadow: `0 0 12px ${STAGE_ACCENT}`,
          }}
          title="Pitch"
        />
        </div>
      </div>

    </div>
  );
}

function StageResultsScreen({ state, dispatch, onExit }) {
  const [displayScore, setDisplayScore] = useStateApp(0);
  const track = state.selectedTrack;
  const target = state.score ?? 0;

  useEffectApp(() => {
    let frame;
    const start = performance.now();
    const dur = 1200;
    const step = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(target * eased));
      if (p < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setDisplayScore(target);
      }
    };
    setDisplayScore(0);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <div className="stage-shell stage-content flex-1 px-6 pb-10 text-center">
      <div
        className="font-display leading-none tabular stage-score-num"
        style={{ fontSize: "clamp(72px, 20vw, 120px)", color: STAGE_ACCENT }}
      >
        {displayScore}
      </div>
      <div className="mt-2 inline-block rounded-full px-4 py-2 border ui-body" style={{ borderColor: `${STAGE_ACCENT}66`, color: STAGE_ACCENT }}>
        {state.scoreLabel}
      </div>

      {track && track.albumArt && (
        <img src={track.albumArt} alt="" className="mx-auto mt-8 w-28 h-28 rounded-2xl object-cover border border-[var(--border-neutral)]" />
      )}
      {track && (
        <div className="mt-4 font-display text-[22px]">{track.title}</div>
      )}

      <div className="mt-8 space-y-3 max-w-xs mx-auto">
        <button type="button" onClick={() => dispatch({ type: "singAgain" })} className="stage-primary-btn w-full rounded-xl py-3.5 text-base font-semibold tracking-wide">
          SING AGAIN
        </button>
        <button type="button" onClick={() => dispatch({ type: "goSearch" })} className="w-full rounded-xl py-3.5 text-base font-semibold tracking-wide border transition btn-gold">
          <span className="relative z-[1]">NEW SONG</span>
        </button>
        <button type="button" onClick={onExit} className="w-full rounded-xl py-3 ui-label hover:text-white transition-colors">
          BACK TO MENU
        </button>
      </div>
    </div>
  );
}

function stageReducer(state, action) {
  switch (action.type) {
    case "setSearchLoading":
      return { ...state, searchLoading: action.loading };
    case "setSearchError":
      return { ...state, searchError: action.error };
    case "setTrackMeta":
      if (!state.selectedTrack || state.selectedTrack.deezerTrackId !== action.track.deezerTrackId) {
        return state;
      }
      return { ...state, selectedTrack: { ...state.selectedTrack, ...action.track } };
    case "selectTrack":
      return {
        ...initialStageState(),
        screen: "ready",
        selectedTrack: action.track,
        micStatus: "idle",
        lyricsLoadKey: Date.now(),
      };
    case "lyricsLoaded":
      return {
        ...state,
        lyrics: action.lyrics,
        previewClipLyrics: action.previewClipLyrics || [],
        plainLyrics: action.plain,
        lyricsStatus: action.status,
        lyricsTrackId: state.selectedTrack ? state.selectedTrack.deezerTrackId : state.lyricsTrackId,
        selectedTrack: state.selectedTrack && action.previewStartSec != null
          ? { ...state.selectedTrack, previewStartSec: action.previewStartSec }
          : state.selectedTrack,
      };
    case "setLyricsStatus":
      return { ...state, lyricsStatus: action.status };
    case "setMicStatus":
      return { ...state, micStatus: action.status };
    case "setMicStream":
      return { ...state, micStream: action.stream };
    case "goPerformance":
      return {
        ...state,
        screen: "performance",
        performanceStatus: "singing",
        recordedPitches: [],
        totalFrames: 0,
        voicedFrames: 0,
        score: null,
        scoreLabel: null,
        performanceRun: (state.performanceRun || 0) + 1,
      };
    case "setPerformanceStatus":
      return { ...state, performanceStatus: action.status };
    case "finishPerformance":
      return {
        ...state,
        screen: "results",
        performanceStatus: "finished",
        recordedPitches: action.recordedPitches,
        totalFrames: action.totalFrames,
        voicedFrames: action.voicedFrames,
        score: action.score,
        scoreLabel: action.scoreLabel,
      };
    case "singAgain":
      return {
        ...state,
        screen: "performance",
        performanceStatus: "singing",
        recordedPitches: [],
        totalFrames: 0,
        voicedFrames: 0,
        score: null,
        scoreLabel: null,
        performanceRun: (state.performanceRun || 0) + 1,
      };
    case "goSearch":
      return { ...initialStageState(), screen: "search" };
    case "goReady":
      return { ...state, screen: "ready" };
    default:
      return state;
  }
}

function StageModeView({ onReset }) {
  const [state, dispatch] = useReducerApp(stageReducer, initialStageState());
  const micStream = state.micStream || null;

  useEffectApp(() => {
    const track = state.selectedTrack;
    if (!track || !state.lyricsLoadKey) return;

    let cancelled = false;
    dispatch({ type: "setLyricsStatus", status: "loading" });

    loadStageTrackAndLyrics(track)
      .then(({ track: enriched, lyrics: res }) => {
        if (cancelled) return;
        dispatch({ type: "setTrackMeta", track: enriched });
        dispatch({
          type: "lyricsLoaded",
          status: res.status,
          lyrics: res.lyrics,
          plain: res.plain,
          previewStartSec: res.previewStartSec,
          previewClipLyrics: res.previewClipLyrics || [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({
          type: "lyricsLoaded",
          status: "none",
          lyrics: [],
          plain: "",
          previewStartSec: track.previewStartSec != null
            ? track.previewStartSec
            : computeDeezerPreviewStartSec(track.durationSec || 0),
          previewClipLyrics: [],
        });
      });

    return () => { cancelled = true; };
  }, [state.lyricsLoadKey, dispatch]);

  return (
    <div className="hp-stage relative overflow-hidden flex flex-col fade-enter h-full max-h-[100dvh]">
      <HpStageBackdrop topStrip />
      <div className={cx(
        "relative z-10 flex flex-col flex-1 min-h-0",
        state.screen === "performance" ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
      )}>
      <HomeHeader onBack={onReset} backLabel="Back" />

      {state.screen === "search" && <StageSearchScreen state={state} dispatch={dispatch} />}
      {state.screen === "ready" && (
        <StageReadyScreen state={state} dispatch={dispatch} onBack={() => dispatch({ type: "goSearch" })} />
      )}
      {state.screen === "performance" && (
        <StagePerformanceScreen
          state={state}
          dispatch={dispatch}
          micStream={micStream}
          performanceRun={state.performanceRun}
        />
      )}
      {state.screen === "results" && (
        <StageResultsScreen state={state} dispatch={dispatch} onExit={onReset} />
      )}
      </div>
    </div>
  );
}


// ---------- App ----------
function App() {
  const [choice, setChoice] = useStateApp(null);

  return (
    <div className="shell h-full">
      {!choice && <StartScreen onChoose={setChoice} />}
      {choice && (
        choice.game === "stage"
          ? <StageModeView onReset={() => setChoice(null)} />
          : choice.game === "blitz"
            ? <BlitzModeView choice={choice} onReset={() => setChoice(null)} />
            : <GameView choice={choice} onReset={() => setChoice(null)} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
