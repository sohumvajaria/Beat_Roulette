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

// ---------- Homepage: Roulette Wheel SVG ----------
function WheelSVG() {
  const SEGMENTS = 12;
  // gold, magenta, neon green, paper-white — cycled
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
                fontFamily="'Bebas Neue', sans-serif"
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
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="32"
        fill="#08080C"
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
      {/* Pin body — triangle pointing down */}
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

// ---------- Deezer JSONP ----------
function deezerSearch(query, limit = 25) {
  return new Promise((resolve, reject) => {
    const cb = "__dz_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let done = false;
    const cleanup = () => { done = true; try { delete window[cb]; } catch(e) { window[cb] = undefined; } script.remove(); };
    window[cb] = (data) => { if (done) return; cleanup(); resolve(data); };
    script.onerror = () => { if (done) return; cleanup(); reject(new Error("network")); };
    setTimeout(() => { if (done) return; cleanup(); reject(new Error("timeout")); }, 8000);
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}&output=jsonp&callback=${cb}`;
    document.head.appendChild(script);
  });
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
    ? "w-full rounded-lg bg-black/45 border border-white/15 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--hp-gold)] focus:bg-black/60 transition"
    : "w-full rounded-lg bg-[#282828] border border-transparent px-3 py-2.5 text-sm outline-none placeholder:text-[#535353] focus:border-[#1DB954] focus:bg-[#3a3a3a] transition";

  const panelClass = isHome
    ? "mt-2 rounded-xl border border-white/20 bg-[#0a0a10] shadow-[0_12px_40px_rgba(0,0,0,0.75)] overflow-hidden"
    : "mt-2 rounded-xl border border-[#3a3a3a] bg-[#121212] shadow-[0_12px_40px_rgba(0,0,0,0.65)] overflow-hidden";

  const panelHeaderClass = isHome
    ? "px-3 py-2 border-b border-white/12 bg-[#12121a] font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
    : "px-3 py-2 border-b border-[#282828] bg-[#181818] text-[11px] uppercase tracking-[0.16em] text-white/45";

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
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55 mb-1.5">Search song</div>
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
                <div className="px-3 py-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
                  No matches — try another spelling
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
                      <img src={track.cover} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-md shrink-0 border border-white/10 bg-[#282828]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{track.title}</div>
                      <div className="text-[11px] truncate text-white/55">{track.artist}</div>
                    </div>
                    {!track.preview && (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-[#2a2a36] text-white/45">
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
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Pick a match — cover, artist &amp; preview load automatically</span>
          </div>
        )}

        {error && (
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--hp-magenta)]">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative isolate">
      <label className="block">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/45 mb-1.5">Search song</div>
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
                No matches — try another spelling
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
                    <img src={track.cover} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-md shrink-0 border bg-[#282828] border-[#3a3a3a]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate text-white">{track.title}</div>
                    <div className="text-[11px] truncate text-white/55">{track.artist}</div>
                  </div>
                  {!track.preview && (
                    <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-[#282828] text-[#535353]">
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
          <span>Pick a match — cover, artist &amp; preview load automatically</span>
        </div>
      )}

      {error && (
        <div className={cx(
          "mt-2",
          isHome
            ? "font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--hp-magenta)]"
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
      className="rounded-full grid place-items-center font-bold text-white shrink-0"
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
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40 truncate">{subtitle}</div>
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
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45 mb-1">{label}</div>
      <input
        value={value}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg bg-[#282828] border border-transparent px-3 py-2.5 text-sm outline-none",
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
          <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-mono uppercase tracking-[0.3em] text-white/25">ft. {photo.name}</div>
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
    <div className="hp-stage relative min-h-[100dvh] overflow-hidden hp-vignette hp-grain fade-enter">
      <DriftingNotes count={18} />
      <div className="absolute top-0 left-0 right-0 h-[26px] hp-screenprint pointer-events-none"></div>
      <div className="relative z-10 flex flex-col min-h-[100dvh] pb-5 overflow-y-auto overflow-x-hidden">{children}</div>
      <div className="absolute bottom-0 left-0 right-0 h-[14px] hp-screenprint pointer-events-none"></div>
    </div>
  );
}

function HomeHeader({ subtitle, onBack, backLabel, right }) {
  return (
    <>
      <div className="pt-6 px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              aria-label={backLabel || "Back"}
              className="shrink-0 w-9 h-9 -ml-0.5 grid place-items-center rounded-full border border-white/20 bg-black/40 hover:bg-black/60 hover:border-[var(--hp-gold)]/50 active:scale-95 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-[var(--hp-gold)] shrink-0"></div>
          <div className="font-display text-[14px] tracking-[0.32em] text-white/85 truncate">BEAT ROULETTE</div>
        </div>
        {right}
      </div>
      {subtitle && (
        <div className="px-6 mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">{subtitle}</div>
      )}
    </>
  );
}

function HpPanel({ children, className, center }) {
  return (
    <div className={cx(
      "rounded-2xl border border-white/12 bg-black/40 backdrop-blur-sm p-4 relative",
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
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 mb-1.5">{label}</div>
      <input
        value={value}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg bg-black/45 border border-white/15 px-3 py-2.5 text-sm text-white outline-none",
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
        "w-full rounded-xl px-5 py-3.5 font-display tracking-[0.14em] text-[20px] transition",
        disabled
          ? "bg-white/10 text-white/35 cursor-not-allowed border border-white/10"
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
        "w-full rounded-xl px-5 py-3.5 font-display tracking-[0.14em] text-[20px] transition",
        disabled
          ? "border border-white/10 text-white/35 cursor-not-allowed"
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
        "w-full rounded-xl px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] border transition",
        disabled
          ? "border-white/8 bg-black/20 text-white/30 cursor-not-allowed"
          : "border-white/20 bg-black/35 text-white/75 hover:border-[var(--hp-gold)]/40 hover:text-white",
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
    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/55 leading-relaxed">
      {children}
    </p>
  );
}

function RoundsPicker({ value, onChange }) {
  return (
    <div className="rounded-2xl border border-white/14 bg-[#16161e] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 mb-3">Songs per player</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cx(
              "min-w-[52px] h-[52px] rounded-xl font-display text-[26px] tabular border transition",
              value === n
                ? "bg-[var(--hp-gold)] text-[#08080C] border-[var(--hp-gold)]"
                : "bg-[#22222c] text-white/80 border-white/15 hover:border-[var(--hp-gold)]/40"
            )}
          >{n}</button>
        ))}
      </div>
      <div className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
        {value} round{value === 1 ? "" : "s"} · each player adds {value} song{value === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function PlayerCountSlider({ value, onChange }) {
  return (
    <div className="rounded-2xl border border-white/14 bg-[#16161e] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 mb-3">How many players?</div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35 w-4 text-right">3</span>
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
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35 w-6">10</span>
      </div>
      <div className="mt-4 text-center">
        <span className="font-display text-[44px] leading-none tabular" style={{ color: "var(--hp-gold)" }}>{value}</span>
        <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
          player{value === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

// ---------- HomeScreen — cinematic landing ----------
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

function HomeScreen({ onMultiDevice, onSingleDevice }) {
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
    <div className="hp-stage relative min-h-[100dvh] overflow-hidden hp-vignette hp-grain">
      {/* Drifting notes */}
      <DriftingNotes count={18} />

      {/* Top screen-print strip */}
      <div className="absolute top-0 left-0 right-0 h-[26px] hp-screenprint"></div>

      {/* Header label — print-style */}
      <div className="relative z-10 pt-6 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--hp-gold)]"></div>
          <div className="font-display text-[14px] tracking-[0.32em] text-white/80">BEAT ROULETTE</div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
          Est. 2026 · Side A
        </div>
      </div>

      {/* Star burst — tap to ramp wheel spin */}
      <button
        type="button"
        onClick={handlePressSpin}
        aria-label="Press spin"
        className="absolute right-3 sm:right-6 top-[88px] z-20 hidden sm:grid star-burst cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hp-gold)]"
      >
        <span className="text-white pointer-events-none">
          <span className="block text-[10px] tracking-[0.12em]">PRESS</span>
          <span className="block text-[22px]">SPIN</span>
        </span>
      </button>

      {/* Wheel + pin */}
      <div className="relative z-10 mt-4 mx-auto" style={{ width: "min(360px, 88vw)", aspectRatio: "1 / 1" }}>
        <div className="absolute inset-0 wheel-glow"></div>
        <div className="absolute inset-0 wheel-in">
          <div ref={wheelRef} className="absolute inset-0">
            <WheelSVG />
          </div>
          {/* Pin — wrapper holds position; inner bounce must not override translateX */}
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

      {/* Title + tagline */}
      <div className="relative z-10 px-6 mt-3 text-center">
        <h1 className="fade-up font-display text-white leading-[0.86] tracking-[0.01em]" style={{ fontSize: "clamp(64px, 16vw, 104px)" }}>
          BEAT<br/>
          <span style={{ color: "var(--hp-gold)" }}>ROULETTE</span>
        </h1>
        <div className="fade-up d1 mt-3 font-mono text-[11px] uppercase tracking-[0.32em] text-white/55">
          <span style={{ color: "var(--hp-magenta)" }}>★</span> Spin the wheel · Name that tune · Win the night <span style={{ color: "var(--hp-magenta)" }}>★</span>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="relative z-10 px-6 mt-6 max-w-[420px] mx-auto">
        <button
          type="button"
          onClick={onMultiDevice}
          className="btn-in s1 btn-spotify w-full rounded-xl px-5 py-4 font-display tracking-[0.14em] text-[22px]"
        >
          MULTI-DEVICE
        </button>
        <div className="btn-in s1 mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          Everyone on their own phone · host or join a room
        </div>

        <HpGoldBtn
          onClick={onSingleDevice}
          className="btn-in s2 mt-5 py-4 text-[22px]"
        >
          SINGLE-DEVICE
        </HpGoldBtn>
        <div className="btn-in s2 mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          One phone passed around the group
        </div>
      </div>

      {/* Marquee strip at bottom */}
      <div className="relative z-10 mt-4 border-y border-white/10 bg-black/30 overflow-hidden">
        <div className="marquee-track flex whitespace-nowrap py-2 font-display tracking-[0.2em] text-[18px]">
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
      <div className="absolute bottom-0 left-0 right-0 h-[14px] hp-screenprint"></div>
    </div>
  );
}

// ---------- StartScreen — choose host/join/local ----------
function StartScreen({ onChoose }) {
  const [view, setView] = useStateApp("home"); // home | multi | host | join
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
      kind: "host",
      code: randomCode(),
      name: name.trim(),
      songsPerPlayer: roundPick,
    });
  };
  const startJoin = () => {
    if (!name.trim() || code.trim().length < 4) return;
    onChoose({
      kind: "client",
      code: code.trim().toUpperCase(),
      name: name.trim(),
    });
  };

  // ---- Home view = cinematic landing ----
  if (view === "home") {
    return (
      <HomeScreen
        onMultiDevice={() => setView("multi")}
        onSingleDevice={() => onChoose({ kind: "local" })}
      />
    );
  }

  // ---- Multi-device: host or join ----
  if (view === "multi") {
    return (
      <HomeStageShell>
        <HomeHeader subtitle="Multi-device" onBack={() => setView("home")} backLabel="Back" />
        <div className="px-6 mt-4 flex-1">
          <HpSectionTitle>
            YOUR PHONE, <span style={{ color: "var(--hp-gold)" }}>YOUR TURN</span>
          </HpSectionTitle>
          <HpSectionDesc>
            Host opens a room and shares the code. Everyone else joins from their own device.
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
        <HomeHeader subtitle="Hosting" onBack={() => setView("multi")} backLabel="Back" />
        <div className="px-6 mt-4 flex-1 pb-8">
          <HpSectionTitle>
            OPEN A <span style={{ color: "var(--hp-gold)" }}>ROOM</span>
          </HpSectionTitle>
          <HpSectionDesc>
            Pick rounds, enter your name, then share the room code with friends on their phones.
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
        <HomeHeader subtitle="Joining" onBack={() => setView("multi")} backLabel="Back" />
        <div className="px-6 mt-4 flex-1 pb-8">
          <HpSectionTitle>
            GOT THE <span style={{ color: "var(--hp-gold)" }}>CODE?</span>
          </HpSectionTitle>
          <HpSectionDesc>
            Enter the room code from your host and your name to join the party.
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
            <div className="text-[11px] uppercase tracking-[0.18em] text-rose-400">Couldn't connect</div>
            <div className="mt-2 text-base font-medium">{status.message || "Something went wrong."}</div>
            <button onClick={onReset} className="mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-black w-full">Back to start</button>
          </>
        ) : (
          <>
            <div className="mx-auto w-10 h-10 rounded-full border-2 border-[#282828] border-t-[#1DB954] animate-spin"></div>
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
      <div className={cx(
        "uppercase tracking-[0.18em]",
        hp ? "font-mono text-[10px] text-white/40" : "text-[10px] text-white/40"
      )}>Room {mode.kind === "client" ? "· joined" : ""}</div>
      <div
        className={cx(
          "font-mono font-semibold tracking-[0.2em] transition",
          hp ? "text-[18px] group-hover:opacity-90" : "text-sm group-hover:text-[#1ed760]"
        )}
        style={hp ? { color: "var(--hp-gold)" } : { color: "#1DB954" }}
      >
        {code}
      </div>
      <div className={cx("mt-0.5", hp ? "font-mono text-[10px] uppercase tracking-[0.14em] text-white/35" : "text-[10px] text-white/35")}>
        {copied ? "link copied!" : "tap to copy link"}
      </div>
    </button>
  );
}

// ---------- SpotifyImporter — pick from top tracks ----------
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
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#1DB954]">Spotify · connected</div>
            <div className="text-[12px] text-white/55 truncate">Import from your top tracks</div>
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
                        isSel ? "selected" : "border-transparent bg-[#181818] hover:bg-[#202020]",
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

// ---------- LobbyScreen — multi-device room (cinematic) ----------
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
            ? `Lobby · ${state.songsPerPlayer} round${state.songsPerPlayer === 1 ? "" : "s"} each`
            : "Lobby"
        }
        onBack={onLeave}
        backLabel="Leave room"
        right={<RoomChip code={code} mode={mode} variant="home" />}
      />

      <div className="px-6 mt-2 flex-1 pb-6">
        <HpSectionTitle>
          {isHost ? (
            <>YOU'RE <span style={{ color: "var(--hp-gold)" }}>HOSTING</span></>
          ) : (
            <>YOU'RE <span style={{ color: "var(--hp-magenta)" }}>IN</span></>
          )}
        </HpSectionTitle>
        <HpSectionDesc>
          {isHost
            ? "Share the room code. Everyone adds their songs, then start when the pool is full."
            : state.songsPerPlayer
              ? `Add ${songsPerPlayer} song${songsPerPlayer === 1 ? "" : "s"} — the host starts when everyone's ready.`
              : "Add your songs below. The host starts when everyone's ready."}
        </HpSectionDesc>

        <div className="mt-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">
            In the room · {state.players.length}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {state.players.map(p => {
              const isMe = p.deviceId === deviceId;
              const isHostP = p.deviceId === state.hostDeviceId;
              const songCount = state.songs.filter(s => s.ownerDeviceId === p.deviceId).length;
              return (
                <div key={p.deviceId} className="flex flex-col items-center gap-1 min-w-[64px] shrink-0">
                  <div className="relative">
                    <Avatar name={p.name} size={42} dim={p.online === false} />
                    {isHostP && (
                      <div
                        className="absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 grid place-items-center font-bold border border-[#08080C] z-10"
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
          <div className="mt-4 rounded-2xl border border-white/14 bg-[#16161e] p-3 space-y-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2 px-1">Your picks</div>
            {mySongs.map(s => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#22222c] px-3 py-2">
                {s.cover ? (
                  <img src={s.cover} alt="" className="w-9 h-9 rounded-md object-cover border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-black/50 border border-white/10"></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate font-medium">{s.title}</div>
                  <div className="text-[11px] text-white/50 truncate">
                    {s.artist}{s.noPreview && <span className="ml-1.5 text-white/35">· no preview</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "removeSong", songId: s.id })}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 hover:text-[var(--hp-magenta)] px-2 py-1"
                >remove</button>
              </div>
            ))}
          </div>
        )}

        {!atSongLimit && (
          <div className="song-suggest-shell mt-4">
            {state.songsPerPlayer && (
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--hp-magenta)] mb-2">
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
          <div className="mt-4 rounded-2xl border border-[var(--hp-neon)]/30 bg-[var(--hp-neon)]/10 px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hp-neon)]">
            All {songsPerPlayer} song{songsPerPlayer === 1 ? "" : "s"} added — waiting for host
          </div>
        )}

        <div className="mt-6">
          <PoolCounter count={state.songs.length} target={poolTarget} variant="home" />
        </div>

        <div className="mt-6 pb-2">
          {isHost ? (
            <HpPrimaryBtn disabled={!canStart} onClick={() => dispatch({ type: "start" })}>
              {canStart
                ? `START ${state.songs.length} ROUND${state.songs.length === 1 ? "" : "S"} →`
                : state.players.length < 3
                  ? `NEED ${3 - state.players.length} MORE PLAYER${3 - state.players.length === 2 ? "" : "S"}`
                  : poolTarget
                    ? `NEED ${poolTarget - state.songs.length} MORE SONG${poolTarget - state.songs.length === 1 ? "" : "S"}`
                    : "NEED AT LEAST 2 PLAYERS WITH SONGS"}
            </HpPrimaryBtn>
          ) : (
            <HpPanel center className="py-4">
              <HpSectionDesc>
                {canStart ? "Ready — waiting for host to start…" : "Waiting on more songs…"}
              </HpSectionDesc>
            </HpPanel>
          )}
        </div>
      </div>
    </HomeStageShell>
  );
}

function PoolCounter({ count, variant, target }) {
  const minTarget = target != null ? target : 3;
  const remaining = Math.max(0, minTarget - count);
  const ready = count >= minTarget;
  const discs = Math.min(count, 8);
  const hp = variant === "home";
  return (
    <div className={cx(
      "rounded-2xl px-5 py-5 text-center relative overflow-hidden",
      hp ? "border border-white/12 bg-black/40 backdrop-blur-sm" : "border border-[#282828] bg-[#181818] grain"
    )}>
      <div className={cx(
        "uppercase tracking-[0.22em]",
        hp ? "font-mono text-[10px] text-white/45" : "text-[10px] text-white/40"
      )}>Songs in the pool</div>
      <div className="relative mt-1 flex items-baseline justify-center">
        <span className="pool-number" style={hp ? { color: "var(--hp-gold)" } : undefined}>{count}</span>
      </div>
      {discs > 0 && (
        <div className="mt-3 flex items-center justify-center -space-x-2">
          {Array.from({ length: discs }).map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border"
              style={{
                borderColor: hp ? "rgba(245,197,24,0.35)" : "#3a3a3a",
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
      <div className={cx("mt-3", hp ? "font-mono text-[10px] uppercase tracking-[0.18em] text-white/45" : "text-[11px] text-white/50")}>
        {ready
          ? <span style={hp ? { color: "var(--hp-gold)" } : undefined} className={hp ? "" : "text-[#1DB954]"}>Ready to spin — start whenever.</span>
          : target != null
            ? `${remaining} more song${remaining === 1 ? "" : "s"} to start · ${count}/${minTarget}`
            : `${remaining} more to start${count > 0 ? "" : " · min 3"}.`}
      </div>
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
      <div className="fade-enter absolute inset-0 z-30 hp-stage hp-vignette hp-grain overflow-hidden">
        <DriftingNotes count={14} />
        <div className="absolute inset-0 grid place-items-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-24 splash-strip bg-gradient-to-r from-transparent via-[var(--hp-gold)]/20 to-transparent"></div>
          <div className="relative text-center splash-num px-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">Round</div>
            <div
              className="mt-1 font-display leading-none text-white"
              style={{ fontSize: "clamp(88px, 24vw, 120px)" }}
            >
              <span style={{ color: "var(--hp-gold)" }}>{roundNumber}</span>
            </div>
            <div className="-mt-1 font-mono text-[11px] uppercase tracking-[0.28em] text-white/40 tabular">
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
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#B3B3B3]">Round</div>
          <div className="mt-1 text-[96px] leading-none font-black tracking-tighter text-white">
            {roundNumber}
          </div>
          <div className="-mt-2 text-sm text-white/40 tabular">of {totalRounds}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Timer ring ----------
function TimerRing({ progress, size = 168, stroke = 6, gold }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gradId = gold ? "ringGold" : "ring";
  const accent = gold ? "#F5C518" : "#1DB954";
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

// ---------- RoundScreen (multi-device — cinematic home theme) ----------
function RoundScreen({ state, dispatch, deviceId, isHost, onLeave }) {
  const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
  const audioRef = useRefApp(null);
  const [progress, setProgress] = useStateApp(0);
  const [duration, setDuration] = useStateApp(30);
  const [playing, setPlaying] = useStateApp(false);
  const [audioError, setAudioError] = useStateApp(false);

  const voters = state.players.filter(p => p.online !== false);
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
    if (myGuess) return;
    dispatch({
      type: "submitGuess",
      targetDeviceId,
      now: performance.now(),
    });
  };

  const secondsLeft = Math.max(0, Math.ceil((1 - progress) * (duration || 30)));
  const guessTarget = myGuess ? state.players.find(p => p.deviceId === myGuess) : null;

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle="Round in play · multi-device"
        onBack={onLeave}
        backLabel="Leave game"
        right={
          <div className="text-right shrink-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Round</div>
            <div className="font-display text-[22px] leading-none tabular" style={{ color: "var(--hp-gold)" }}>
              {state.roundIdx + 1}<span className="text-white/35">/{state.order.length}</span>
            </div>
          </div>
        }
      />

      <div className="px-6 mt-2 flex-1">
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
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-white/15 font-mono text-[11px] tabular text-white/60">
                0:{secondsLeft.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--hp-magenta)" }}>Now spinning</div>
            <div className="mt-1 font-display text-[22px] leading-tight text-center px-4 truncate w-full tracking-[0.02em]">{song.title}</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55 text-center truncate w-full px-4">{song.artist}</div>

            <div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
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
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 text-center">
                Preview unavailable — guess from title & artist
              </div>
            )}
          </div>
          {song.url && <audio ref={audioRef} src={song.url} preload="auto" />}
        </HpPanel>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              {myGuess ? "Locked in" : "Who picked it?"}
            </div>
            <div className="font-mono text-[10px] text-[var(--hp-gold)] tabular">{lockedCount}/{voters.length} locked in</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {state.players.map(p => {
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
                        : "bg-black/35 border-white/15 text-white/50"
                  )}
                >
                  <Avatar name={p.name} size={18} />
                  <span>{p.name}</span>
                  {locked && <span>✓</span>}
                  {isMe && !locked && <span className="font-mono text-[9px] uppercase tracking-[0.1em]">you</span>}
                </div>
              );
            })}
          </div>

          <HpPanel className="mt-4 p-3 min-h-[180px]">
            {myGuess ? (
              <div className="text-center py-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--hp-gold)" }}>
                  You locked in
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Avatar name={guessTarget?.name} size={32} />
                  <div className="font-display text-[22px] tracking-[0.04em]">{guessTarget?.name}</div>
                </div>
                {myGuess === deviceId && (
                  <HpSectionDesc>You voted for yourself.</HpSectionDesc>
                )}
                <HpSectionDesc>Waiting for {voters.length - lockedCount} more…</HpSectionDesc>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Who submitted this track? · you can vote for yourself
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {state.players.map(p => {
                    const isSelf = p.deviceId === deviceId;
                    return (
                      <button
                        key={p.deviceId}
                        onClick={() => setGuess(p.deviceId)}
                        className={cx(
                          "rounded-xl px-3 py-3 text-sm font-medium border text-left transition flex items-center gap-2",
                          isSelf
                            ? "bg-[var(--hp-magenta)]/15 border-[var(--hp-magenta)]/40 hover:border-[var(--hp-gold)]/50 hover:bg-black/50"
                            : "bg-black/35 border-white/15 hover:border-[var(--hp-gold)]/50 hover:bg-black/50"
                        )}
                      >
                        <Avatar name={p.name} size={26} />
                        <div className="min-w-0">
                          <div className="truncate">{p.name}</div>
                          {isSelf && (
                            <div className="font-mono text-[9px] uppercase text-[var(--hp-gold)]">that's you</div>
                          )}
                          {p.online === false && !isSelf && (
                            <div className="font-mono text-[9px] uppercase text-white/30">offline</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </HpPanel>
        </div>

        <div className="pt-6 pb-28 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          {isHost
            ? (lockedCount === voters.length ? "Everyone's in — revealing…" : "Reveal when everyone's locked in")
            : (lockedCount === voters.length ? "All in — host is revealing…" : "Reveal happens when everyone's locked in")}
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
  const guessers = state.players;
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
            <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--hp-magenta)" }}>It was…</div>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={song.ownerName} size={48} />
              <div className="min-w-0">
                <div className="font-display text-[36px] leading-none tracking-[0.02em] truncate">{song.ownerName}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55 truncate">
                  <span className="text-white/80">{song.title}</span> · {song.artist}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sneaky && (
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-black/40 text-white/60 border border-white/15 font-mono uppercase tracking-[0.12em]">
                  ✦ Sneaky · {song.ownerName} +1
                </span>
              )}
              {!state.localPassAround && state.fastestCorrect && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.12em]"
                  style={{ background: "rgba(245,197,24,0.12)", color: "var(--hp-gold)", borderColor: "rgba(245,197,24,0.35)" }}
                >
                  ⚡ Fastest · {playersById[state.fastestCorrect]?.name} +1
                </span>
              )}
            </div>
          </HpPanel>
        ) : (
          <div className="rounded-3xl border border-[#282828] bg-[#181818] p-5 grain relative overflow-hidden">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#1DB954]">It was…</div>
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
                <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-[#282828] text-[#B3B3B3] border border-[#3a3a3a]">
                  ✦ Sneaky pick · {song.ownerName} +1
                </span>
              )}
              {state.fastestCorrect && (
                <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30">
                  ⚡ Fastest · {playersById[state.fastestCorrect]?.name} +1
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 px-6">
        <div className={cx(
          "uppercase tracking-[0.18em]",
          cinematic ? "font-mono text-[10px] text-white/40" : "text-[11px] text-white/40"
        )}>Guesses</div>
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
                  ? (noGuess ? "border-white/10 bg-black/30 opacity-60" : right ? "border-[var(--hp-gold)]/40 bg-[var(--hp-gold)]/10" : "border-white/12 bg-black/35")
                  : (noGuess ? "border-[#282828] bg-[#181818] opacity-60" : right ? "border-[#1DB954]/40 bg-[#1DB954]/[0.08]" : "border-[#282828] bg-[#181818]")
              )}>
                <Avatar name={guesser.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">
                    <span className="font-medium">{guesser.name}</span>
                    <span className="text-white/40"> → </span>
                    <span className="font-medium">{noGuess ? "—" : playersById[target]?.name}</span>
                  </div>
                  <div className="text-[11px] text-white/40 font-mono tabular">
                    {noGuess ? "didn't lock in" : right ? "correct" : "wrong"}{!state.localPassAround && seconds ? ` · ${seconds}s` : ""}
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
                  {delta > 0 ? `+${delta}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-6">
        <div className={cx(
          "uppercase tracking-[0.18em]",
          cinematic ? "font-mono text-[10px] text-white/40" : "text-[11px] text-white/40"
        )}>Leaderboard</div>
        <div className={cx(
          "mt-3 overflow-hidden",
          cinematic ? "rounded-2xl border border-white/12 bg-black/40 backdrop-blur-sm" : "rounded-2xl border border-[#282828] bg-[#181818]"
        )}>
          {sorted.map((row, i) => (
            <div key={row.deviceId} className={cx(
              "flex items-center gap-3 px-4 py-3 border-b last:border-b-0",
              cinematic ? "border-white/10" : "border-[#282828]",
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
            cinematic ? "border border-white/12 bg-black/35 text-white/45 font-mono text-[11px] uppercase tracking-[0.16em]" : "bg-[#181818] border border-[#282828] text-[#B3B3B3]"
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
        <div className="flex-1">{content}</div>
      </HomeStageShell>
    );
  }

  return (
    <div className="fade-enter relative">
      <TopBar subtitle="Reveal" onBack={onLeave} backLabel="Leave game" />
      {content}
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

      <div className="relative z-10">
        {cinematic ? (
          <HomeHeader subtitle="Final score" onBack={onLeave} backLabel="Leave game" />
        ) : (
          <TopBar subtitle="Final score" onBack={onLeave} backLabel="Leave game" />
        )}

      <div className="mx-6 mt-2">
        {cinematic ? (
          <HpPanel className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--hp-magenta)" }}>
              {winners.length > 1 ? "It's a tie" : "Winner"}
            </div>
            <div className="mt-1 font-display text-[44px] leading-[0.95] tracking-[0.02em]">
              {winners.length === 0 ? "NOBODY, SOMEHOW" : winners.map(w => w.name.toUpperCase()).join(" & ")}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 tabular">
              {winnerScore} point{winnerScore === 1 ? "" : "s"} · taste validated
            </div>
          </HpPanel>
        ) : (
          <div className="rounded-3xl border border-[#282828] bg-[#181818] p-6 grain relative overflow-hidden">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#1DB954]">
              {winners.length > 1 ? "It's a tie" : "Winner"}
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight leading-tight">
              {winners.length === 0 ? "Nobody, somehow" : winners.map(w => w.name).join(" & ")}
            </div>
            <div className="mt-2 text-sm text-white/65 tabular">
              {winnerScore} point{winnerScore === 1 ? "" : "s"} · taste validated.
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
                    className={cx("w-full rounded-t-lg pt-2 font-black text-white text-xl text-center", podiumColors[idx])}
                    style={{ height: heights[idx] }}
                  >{idx + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 px-6">
        <div className={cx(
          "uppercase tracking-[0.18em]",
          cinematic ? "font-mono text-[10px] text-white/40" : "text-[11px] text-white/40"
        )}>All standings</div>
        <div className="mt-3 space-y-2">
          {sorted.map((row, i) => {
            const isWinner = row.score === winnerScore && winnerScore > 0;
            return (
              <div key={row.deviceId} className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                cinematic
                  ? (isWinner ? "border-[var(--hp-gold)]/40 bg-[var(--hp-gold)]/10" : "border-white/12 bg-black/35")
                  : (isWinner ? "border-[#1DB954]/40 bg-[#1DB954]/[0.08]" : "border-[#282828] bg-[#181818]")
              )}>
                <div className={cx(
                  "w-7 h-7 rounded-full grid place-items-center text-xs font-semibold tabular",
                  cinematic
                    ? (i === 0 ? "bg-[var(--hp-gold)]/20 text-[var(--hp-gold)]" : i === 1 ? "bg-[#3a3a3a] text-[#B3B3B3]" : i === 2 ? "bg-[#282828] text-[#B3B3B3]" : "bg-black/40 text-[#535353]")
                    : (i === 0 ? "bg-[#1DB954]/20 text-[#1DB954]" : i === 1 ? "bg-[#3a3a3a] text-[#B3B3B3]" : i === 2 ? "bg-[#282828] text-[#B3B3B3]" : "bg-[#181818] text-[#535353]")
                )}>{i + 1}</div>
                <Avatar name={row.name} size={26} />
                <div className="text-sm font-medium flex-1 truncate">
                  {row.name}
                  {row.deviceId === deviceId && (
                    <span className={cx("ml-1 text-[10px]", !cinematic && "text-[#1DB954]")} style={cinematic ? { color: "var(--hp-gold)" } : undefined}>you</span>
                  )}
                </div>
                <div className="text-sm font-mono tabular">{row.score}</div>
              </div>
            );
          })}
        </div>
      </div>

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
            cinematic ? "border border-white/12 bg-black/35 text-white/45 font-mono text-[11px] uppercase tracking-[0.16em]" : "bg-[#181818] border border-[#282828] text-[#B3B3B3]"
          )}>
            Waiting for host to start a new round…
          </div>
        )}
      </div>
      </div>
    </>
  );

  if (cinematic) {
    return <HomeStageShell>{inner}</HomeStageShell>;
  }

  return (
    <div className="fade-enter relative min-h-[100dvh]">
      {inner}
    </div>
  );
}

// ---------- LocalLobbyScreen — turn-based pass-around add ----------
function LocalLobbyScreen({ state, dispatch, onLeave }) {
  const lastPlayer = state.players[state.players.length - 1] || null;
  const [step, setStep] = useStateApp(() => {
    if (state.players.length > 0 && state.playerCount && state.players.length >= state.playerCount) return "pool";
    if (state.players.length > 0) return "songs";
    if (state.songsPerPlayer && state.playerCount) return "name";
    if (state.songsPerPlayer) return "name";
    return "rounds";
  });
  const [currentId, setCurrentId] = useStateApp(lastPlayer ? lastPlayer.deviceId : null);
  const [name, setName] = useStateApp("");
  const [err, setErr] = useStateApp("");
  const [songSearchOpen, setSongSearchOpen] = useStateApp(false);
  const [roundPick, setRoundPick] = useStateApp(Math.min(state.songsPerPlayer || 3, 5));
  const [playerPick, setPlayerPick] = useStateApp(state.playerCount || 3);

  const songsPerPlayer = state.songsPerPlayer || 1;
  const playerTarget = state.playerCount || 3;
  const currentPlayer = state.players.find(p => p.deviceId === currentId) || null;
  const poolTarget = playerTarget * songsPerPlayer;
  const playersReady = state.players.length >= playerTarget && state.players.every(p =>
    state.songs.filter(s => s.ownerDeviceId === p.deviceId).length >= songsPerPlayer
  );
  const rosterFull = state.players.length >= playerTarget;
  const canStart = state.songsPerPlayer && playersReady;
  const currentSongs = currentPlayer ? state.songs.filter(s => s.ownerDeviceId === currentPlayer.deviceId) : [];
  const currentSongSlotsLeft = Math.max(0, songsPerPlayer - currentSongs.length);
  const atSongLimit = currentSongs.length >= songsPerPlayer;

  const submitName = () => {
    setErr("");
    const n = name.trim();
    if (!n) return setErr("Add a name.");
    if (state.players.some(p => p.name.toLowerCase() === n.toLowerCase())) {
      return setErr("Someone in the room already has that name.");
    }
    if (rosterFull) {
      return setErr(`All ${playerTarget} players are already in.`);
    }
    const newId = newDeviceId();
    dispatch({ type: "join", deviceId: newId, name: n });
    setCurrentId(newId);
    setName("");
    setSongSearchOpen(false);
    setStep("songs");
  };

  const addSongFromSearch = async (song) => {
    if (!currentPlayer) return;
    if (atSongLimit) {
      setErr(`You already added ${songsPerPlayer} song${songsPerPlayer === 1 ? "" : "s"}.`);
      return;
    }
    const key = (song.title + "|" + song.artist).toLowerCase();
    const mine = state.songs.filter(s => s.ownerDeviceId === currentPlayer.deviceId);
    if (mine.some(s => (s.title + "|" + s.artist).toLowerCase() === key)) {
      setErr("You already added that song.");
      return;
    }
    setErr("");
    dispatch({
      type: "addSong",
      ownerDeviceId: currentPlayer.deviceId,
      title: song.title,
      artist: song.artist,
      url: song.url,
      cover: song.cover,
      noPreview: song.noPreview,
    });
    setSongSearchOpen(false);
  };

  useEffectApp(() => {
    if (step === "songs" && atSongLimit) setSongSearchOpen(false);
  }, [step, atSongLimit]);

  useEffectApp(() => {
    if (step === "songs" && !currentPlayer) {
      setStep(state.players.length === 0 ? "rounds" : "name");
    }
  }, [step, currentPlayer, state.players.length]);

  const confirmRounds = () => {
    dispatch({ type: "setSongsPerPlayer", count: roundPick });
    dispatch({ type: "setPlayerCount", count: playerPick });
    setStep("name");
    setErr("");
  };

  const passDevice = () => {
    if (!atSongLimit) {
      setErr(`Add ${currentSongSlotsLeft} more song${currentSongSlotsLeft === 1 ? "" : "s"} before passing.`);
      return;
    }
    setErr("");
    setSongSearchOpen(false);
    setStep("pass");
  };
  const startNextPlayer = () => {
    setCurrentId(null);
    setName("");
    setErr("");
    setSongSearchOpen(false);
    if (state.players.length >= playerTarget) {
      setStep("pool");
      return;
    }
    setStep("name");
  };

  const start = () => {
    if (!canStart) return;
    dispatch({ type: "start" });
  };

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle={
          state.songsPerPlayer
            ? `Pass-around · ${state.players.length}/${playerTarget} players · ${state.songsPerPlayer} round${state.songsPerPlayer === 1 ? "" : "s"} each`
            : `Pass-around · set up your game`
        }
        onBack={onLeave}
        backLabel="Leave"
      />

      <div className="px-6 mt-4 flex-1">
        <HpSectionTitle>
          {step === "rounds" && <>GAME <span style={{ color: "var(--hp-gold)" }}>SETUP</span></>}
          {step === "name" && <>PLAYER <span style={{ color: "var(--hp-gold)" }}>{state.players.length + 1}</span> OF <span style={{ color: "var(--hp-magenta)" }}>{playerTarget}</span></>}
          {step === "pool" && <>ALL <span style={{ color: "var(--hp-gold)" }}>PLAYERS</span> IN</>}
          {step === "songs" && currentPlayer && (
            <>HEY, <span style={{ color: "var(--hp-magenta)" }}>{currentPlayer.name.toUpperCase()}</span></>
          )}
          {step === "pass" && <>PASS THE <span style={{ color: "var(--hp-gold)" }}>PHONE</span></>}
        </HpSectionTitle>
        <HpSectionDesc>
          {step === "rounds" && "Choose how many rounds (songs per player) and how many people are playing."}
          {step === "name" && "Type your name, then add your songs when it's your turn."}
          {step === "pool" && "Everyone's registered. Finish adding songs, then start the game."}
          {step === "songs" && (
            <>Add <span style={{ color: "var(--hp-gold)" }}>{songsPerPlayer}</span> song{songsPerPlayer === 1 ? "" : "s"} — then pass the phone.</>
          )}
          {step === "pass" && "No peeking — hand the device over, then they tap to continue."}
        </HpSectionDesc>

        {state.players.length > 0 && step !== "songs" && step !== "rounds" && (
          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">Added so far</div>
            <div className="flex flex-wrap gap-2">
              {state.players.map(p => {
                const cnt = state.songs.filter(s => s.ownerDeviceId === p.deviceId).length;
                return (
                  <div key={p.deviceId} className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-white/15 bg-black/35">
                    <Avatar name={p.name} size={20} />
                    <span className="text-[12px] font-medium">{p.name}</span>
                    <span className="text-[11px] font-mono text-[var(--hp-gold)] tabular">{cnt}/{songsPerPlayer}♪</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === "rounds" && (
          <div className="mt-6 space-y-4">
            <RoundsPicker value={roundPick} onChange={setRoundPick} />
            <PlayerCountSlider value={playerPick} onChange={setPlayerPick} />
            <HpGoldBtn onClick={confirmRounds}>
              LOCK IN · {playerPick} PLAYERS · {roundPick} ROUND{roundPick === 1 ? "" : "S"} →
            </HpGoldBtn>
          </div>
        )}

        {step === "name" && (
          <div className="mt-6 space-y-3">
            <HpPanel>
              <HpField label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
              {err && <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--hp-magenta)]">{err}</div>}
            </HpPanel>
            <HpPrimaryBtn disabled={!name.trim()} onClick={submitName}>I'M IN →</HpPrimaryBtn>
          </div>
        )}

        {step === "songs" && currentPlayer && (
          <>
            {currentSongs.length > 0 && !songSearchOpen && (
              <div className="mt-4">
                <div className="rounded-2xl border border-white/14 bg-[#16161e] p-3 space-y-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2 px-1">Your picks</div>
                  {currentSongs.map(s => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#22222c] px-3 py-2">
                      {s.cover ? (
                        <img src={s.cover} alt="" className="w-9 h-9 rounded-md object-cover border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-black/50 border border-white/10"></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate font-medium">{s.title}</div>
                        <div className="text-[11px] text-white/50 truncate">
                          {s.artist}{s.noPreview && <span className="ml-1.5 text-white/35">· no preview</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => dispatch({ type: "removeSong", songId: s.id })}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 hover:text-[var(--hp-magenta)] px-2 py-1"
                      >remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!atSongLimit && (
              <div className="song-suggest-shell mt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--hp-magenta)] mb-2">
                  Song {currentSongs.length + 1} of {songsPerPlayer}
                </div>
                <SongSearchPicker
                  variant="home"
                  autoFocus
                  error={err}
                  onClearError={() => setErr("")}
                  onOpenChange={setSongSearchOpen}
                  onAdd={addSongFromSearch}
                />
              </div>
            )}

            {atSongLimit && !songSearchOpen && (
              <div className="mt-4 rounded-2xl border border-[var(--hp-neon)]/30 bg-[var(--hp-neon)]/10 px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hp-neon)]">
                All {songsPerPlayer} song{songsPerPlayer === 1 ? "" : "s"} added — pass the phone
              </div>
            )}

            {(atSongLimit || !songSearchOpen) && (
              <div className="mt-4">
                {err && !atSongLimit && (
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--hp-magenta)]">{err}</div>
                )}
                <HpMutedBtn disabled={!atSongLimit} onClick={passDevice}>
                  PASS TO NEXT PLAYER →
                </HpMutedBtn>
              </div>
            )}
          </>
        )}

        {step === "pass" && (
          <div className="mt-6">
            <HpPanel center className="py-6">
              <div className="font-display text-[56px] leading-none" style={{ color: "var(--hp-gold)" }}>♪</div>
              {rosterFull ? (
                <HpSectionDesc>All {playerTarget} players are in. Check the song pool below and start when ready.</HpSectionDesc>
              ) : (
                <HpSectionDesc>Hand the phone to the next player ({state.players.length + 1} of {playerTarget}).</HpSectionDesc>
              )}
              <div className="mt-4">
                <HpGoldBtn onClick={startNextPlayer}>
                  {rosterFull ? "GOT IT →" : "I'M THE NEXT PLAYER →"}
                </HpGoldBtn>
              </div>
            </HpPanel>
          </div>
        )}

        {step === "pool" && (
          <div className="mt-6">
            <HpPanel center className="py-5">
              <HpSectionDesc>
                {state.players.length} players · {state.songs.length}/{poolTarget} songs in the pool
              </HpSectionDesc>
            </HpPanel>
          </div>
        )}

        {!(step === "songs" && songSearchOpen && !atSongLimit) && (
          <>
            <div className="mt-6">
              <PoolCounter count={state.songs.length} target={poolTarget} variant="home" />
            </div>

            <div className="mt-6 pb-4">
              <HpPrimaryBtn disabled={!canStart} onClick={start}>
                {canStart
                  ? `START ${state.songs.length} ROUND${state.songs.length === 1 ? "" : "S"} →`
                  : state.players.length < playerTarget
                    ? `NEED ${playerTarget - state.players.length} MORE PLAYER${playerTarget - state.players.length === 1 ? "" : "S"} (${state.players.length}/${playerTarget})`
                    : `NEED ${poolTarget - state.songs.length} MORE SONG${poolTarget - state.songs.length === 1 ? "" : "S"} (${state.songs.length}/${poolTarget})`}
              </HpPrimaryBtn>
            </div>
          </>
        )}
      </div>
    </HomeStageShell>
  );
}

// ---------- LocalRoundScreen — pass-around guessing ----------
function LocalRoundScreen({ state, dispatch, onLeave }) {
  const song = state.songs.find(s => s.id === state.order[state.roundIdx]);
  const audioRef = useRefApp(null);
  const [progress, setProgress] = useStateApp(0);
  const [duration, setDuration] = useStateApp(30);
  const [playing, setPlaying] = useStateApp(false);
  const [audioError, setAudioError] = useStateApp(false);
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

  const voteOrder = state.players.map(p => p.deviceId);
  const currentVoterId = voteOrder.find(id => state.guesses[id] == null) || null;
  const votersLocked = voteOrder.filter(id => state.guesses[id] != null).length;

  useAutoRevealWhenAllVoted(song, voteOrder, state.guesses, dispatch, audioRef, setPlaying);

  if (!song) return null;

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      const p = a.play();
      if (p && p.catch) p.catch(() => setAudioError(true));
    } else { a.pause(); }
  };

  const activePlayer = currentVoterId ? state.players.find(p => p.deviceId === currentVoterId) : null;
  const activeGuess = currentVoterId ? state.guesses[currentVoterId] : null;

  const pickTarget = (targetId) => {
    if (!currentVoterId || activeGuess) return;
    dispatch({
      type: "submitGuess",
      deviceId: currentVoterId,
      targetDeviceId: targetId,
      now: performance.now(),
    });
  };

  const secondsLeft = Math.max(0, Math.ceil((1 - progress) * (duration || 30)));

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle="Round in play · pass-around"
        onBack={onLeave}
        backLabel="Leave game"
        right={
          <div className="text-right shrink-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Round</div>
            <div className="font-display text-[22px] leading-none tabular" style={{ color: "var(--hp-gold)" }}>
              {state.roundIdx + 1}<span className="text-white/35">/{state.order.length}</span>
            </div>
          </div>
        }
      />

      <div className="px-6 mt-2 flex-1">
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
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-white/15 font-mono text-[11px] tabular text-white/60">
                0:{secondsLeft.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--hp-magenta)" }}>Now spinning</div>
            <div className="mt-1 font-display text-[22px] leading-tight text-center px-4 truncate w-full tracking-[0.02em]">{song.title}</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55 text-center truncate w-full px-4">{song.artist}</div>

            <div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
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
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 text-center">
                Preview unavailable — guess from title & artist
              </div>
            )}
          </div>
          {song.url && <audio ref={audioRef} src={song.url} preload="auto" />}
        </HpPanel>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Voting in order — one at a time</div>
            <div className="font-mono text-[10px] text-[var(--hp-gold)] tabular">{votersLocked}/{voteOrder.length} voted</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {state.players.map(p => {
              const locked = state.guesses[p.deviceId] != null;
              const isTurn = currentVoterId === p.deviceId;
              return (
                <div
                  key={p.deviceId}
                  className={cx(
                    "px-2.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5",
                    isTurn
                      ? "bg-[var(--hp-gold)] text-[#08080C] border-[var(--hp-gold)]"
                      : locked
                        ? "bg-black/40 border-[var(--hp-neon)]/40 text-[var(--hp-neon)]"
                        : "bg-black/35 border-white/15 text-white/50"
                  )}
                >
                  <Avatar name={p.name} size={18} />
                  <span>{p.name}</span>
                  {locked && <span>✓</span>}
                  {isTurn && !locked && <span className="font-mono text-[9px] uppercase tracking-[0.1em]">now</span>}
                </div>
              );
            })}
          </div>

          <HpPanel className="mt-4 p-3 min-h-[180px]">
            {!activePlayer ? (
              <div className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 py-10">
                Everyone's voted — revealing…
              </div>
            ) : activeGuess ? (
              <div className="text-center py-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--hp-gold)" }}>
                  {activePlayer.name} locked in
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Avatar name={state.players.find(p => p.deviceId === activeGuess)?.name} size={32} />
                  <div className="font-display text-[22px] tracking-[0.04em]">
                    {state.players.find(p => p.deviceId === activeGuess)?.name}
                  </div>
                </div>
                <HpSectionDesc>Pass the phone — next player's turn.</HpSectionDesc>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Pass the phone to <span style={{ color: "var(--hp-magenta)" }}>{activePlayer.name}</span>
                </div>
                <div className="px-2 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Who submitted this track? · you can vote for yourself
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {state.players.map(p => {
                    const isSelf = p.deviceId === currentVoterId;
                    return (
                      <button
                        key={p.deviceId}
                        onClick={() => pickTarget(p.deviceId)}
                        className={cx(
                          "rounded-xl px-3 py-3 text-sm font-medium border text-left transition flex items-center gap-2",
                          isSelf
                            ? "bg-[var(--hp-magenta)]/15 border-[var(--hp-magenta)]/40 hover:border-[var(--hp-gold)]/50 hover:bg-black/50"
                            : "bg-black/35 border-white/15 hover:border-[var(--hp-gold)]/50 hover:bg-black/50"
                        )}
                      >
                        <Avatar name={p.name} size={26} />
                        <div className="min-w-0">
                          <div className="truncate">{p.name}</div>
                          {isSelf && (
                            <div className="font-mono text-[9px] uppercase text-[var(--hp-gold)]">that's you</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </HpPanel>
        </div>

        <div className="pt-6 pb-28 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          Reveal when everyone has voted
        </div>
      </div>
      <RoundReactionBar variant="cinematic" />
    </HomeStageShell>
  );
}

// ---------- GameView (after start screen, with session) ----------
function GameView({ choice, onReset }) {
  const mode = useMemoApp(
    () => ({ kind: choice.kind, code: choice.code, songsPerPlayer: choice.songsPerPlayer }),
    [choice.kind, choice.code, choice.songsPerPlayer]
  );
  const { deviceId, state, dispatch, status, isHost } = useSession(mode, choice.name);

  // Splash auto-advances; only host triggers it
  const enterRound = useRefApp(() => {});
  useEffectApp(() => {
    enterRound.current = () => dispatch({ type: "enterRound", now: performance.now() });
  }, [dispatch]);

  if (status.kind !== "ready") {
    return <ConnectionGate status={status} mode={mode} onReset={onReset} />;
  }

  const isLocal = mode.kind === "local";
  const common = {
    state, dispatch, deviceId, isHost,
    code: choice.code, mode, onLeave: onReset,
  };

  return (
    <>
      {state.phase === "lobby" && (
        isLocal
          ? <LocalLobbyScreen {...common} />
          : <LobbyScreen {...common} />
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
        isLocal
          ? <LocalRoundScreen {...common} />
          : <RoundScreen {...common} />
      )}
      {state.phase === "results" && <ResultsScreen {...common} cinematic />}
      {state.phase === "final" && <FinalScreen {...common} cinematic />}
    </>
  );
}

// ---------- App ----------
function App() {
  const [choice, setChoice] = useStateApp(null);

  return (
    <div className="shell">
      {!choice && <StartScreen onChoose={setChoice} />}
      {choice && (
        <GameView
          choice={choice}
          onReset={() => setChoice(null)}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
