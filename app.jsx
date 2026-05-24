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
      <div className="relative z-10 flex flex-col min-h-[100dvh] pb-5">{children}</div>
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

// ---------- HomeScreen — cinematic landing ----------
function HomeScreen({ spotifyToken, spotifyLoading, spotifyError, onSpotifyLogin, onSpotifyContinue, onPlayLocal }) {
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

      {/* Star burst accent */}
      <div className="absolute right-3 sm:right-6 top-[88px] z-20 hidden sm:grid star-burst">
        <div className="text-white">
          <div className="text-[10px] tracking-[0.12em]">PRESS</div>
          <div className="text-[22px]">SPIN</div>
        </div>
      </div>

      {/* Wheel + pin */}
      <div className="relative z-10 mt-4 mx-auto" style={{ width: "min(360px, 88vw)", aspectRatio: "1 / 1" }}>
        <div className="absolute inset-0 wheel-glow"></div>
        <div className="absolute inset-0 wheel-in">
          <div className="absolute inset-0 wheel-spin">
            <WheelSVG />
          </div>
          {/* Pin pointing down from top */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 pin-bounce" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
            <WheelPin />
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
        {spotifyError && (
          <div className="btn-in mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
            Spotify: {spotifyError}
          </div>
        )}

        {/* Primary CTA */}
        {spotifyToken ? (
          <button
            onClick={onSpotifyContinue}
            className="btn-in s1 btn-spotify w-full rounded-xl px-5 py-4 font-display tracking-[0.14em] text-[22px] flex items-center justify-center gap-3"
          >
            <MusicDiscGlyph size={22} />
            CONTINUE · CONNECTED ✓
          </button>
        ) : (
          <button
            disabled={spotifyLoading}
            onClick={onSpotifyLogin}
            className="btn-in s1 btn-spotify w-full rounded-xl px-5 py-4 font-display tracking-[0.14em] text-[22px] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait"
          >
            <MusicDiscGlyph size={22} />
            {spotifyLoading ? "CONNECTING…" : "LOGIN WITH SPOTIFY"}
          </button>
        )}
        <div className="btn-in s1 mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          Multi-device · Full features
        </div>

        {/* Secondary CTA */}
        <HpGoldBtn
          onClick={onPlayLocal}
          className="btn-in s2 mt-5 py-4 text-[22px]"
        >
          PLAY NOW · NO LOGIN
        </HpGoldBtn>
        <div className="btn-in s2 mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
          Single device · Quick play
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
function StartScreen({ onChoose, spotifyToken, spotifyLoading, spotifyError, onSpotifyLogin }) {
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
    onChoose({ kind: "host", code: randomCode(), name: name.trim(), spotifyToken: spotifyToken || null });
  };
  const startJoin = () => {
    if (!name.trim() || code.trim().length < 4) return;
    onChoose({ kind: "client", code: code.trim().toUpperCase(), name: name.trim(), spotifyToken: spotifyToken || null });
  };

  // ---- Home view = new cinematic landing ----
  if (view === "home") {
    return (
      <HomeScreen
        spotifyToken={spotifyToken}
        spotifyLoading={spotifyLoading}
        spotifyError={spotifyError}
        onSpotifyLogin={onSpotifyLogin}
        onSpotifyContinue={() => setView("host")}
        onPlayLocal={() => onChoose({ kind: "local" })}
      />
    );
  }

  // ---- Host / Join views (existing) ----
  return (
    <div className="fade-enter relative min-h-[100dvh]">
      <ArtistPhotoBackdrop />
      <div className="relative">
        <TopBar
          subtitle={view === "host" ? "Hosting" : "Joining"}
          onBack={() => setView("home")}
          backLabel="Back to start"
        />

        <div className="px-6 mt-2 relative z-10">
          <h1 className="text-[32px] leading-[1.02] font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {view === "host" ? <>Open a <span className="text-[#1DB954]">room</span>.</> : <>Got the <span className="text-[#1DB954]">code</span>?</>}
          </h1>
          <p className="mt-2 text-sm text-white/65 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            {view === "host"
              ? "Create a room, share the code, drop songs together."
              : "Punch in the room code your host sent you."}
          </p>
          {spotifyToken && (
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/40 text-[#1DB954] text-[11px] tracking-[0.16em] uppercase">
              <MusicDiscGlyph size={12} /> Spotify connected
            </div>
          )}
        </div>

        {view === "host" && (
          <div className="mt-6 mx-6 rounded-2xl border border-[#282828] bg-[#181818] p-4 space-y-3 grain relative z-10">
            <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
            <div className="text-[11px] text-white/40 leading-snug">
              You'll get a room code after this — share it (or the link) with friends so they can join from their phones.
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setView("home")} className="px-4 py-3 rounded-xl border border-[#282828] bg-[#181818] hover:bg-[#202020] text-sm text-white/80">Back</button>
              <button
                disabled={!name.trim()}
                onClick={startHost}
                className={cx(
                  "flex-1 rounded-xl py-3 text-sm font-semibold transition border",
                  name.trim()
                    ? "bg-[#1DB954] hover:bg-[#1ed760] text-black border-transparent"
                    : "bg-[#282828] text-[#535353] border-transparent cursor-not-allowed"
                )}
              >Open room →</button>
            </div>
          </div>
        )}

        {view === "join" && (
          <div className="mt-6 mx-6 rounded-2xl border border-[#282828] bg-[#181818] p-4 space-y-3 grain relative z-10">
            <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Maya" autoFocus maxLength={20} />
            <Field label="Room code" value={code} onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))} placeholder="ABCDE" mono maxLength={5} />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setView("home")} className="px-4 py-3 rounded-xl border border-[#282828] bg-[#181818] hover:bg-[#202020] text-sm text-white/80">Back</button>
              <button
                disabled={!name.trim() || code.length < 4}
                onClick={startJoin}
                className={cx(
                  "flex-1 rounded-xl py-3 text-sm font-semibold transition border",
                  name.trim() && code.length >= 4
                    ? "bg-[#1DB954] hover:bg-[#1ed760] text-black border-transparent"
                    : "bg-[#282828] text-[#535353] border-transparent cursor-not-allowed"
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
      <div className="font-mono text-sm font-semibold tracking-[0.2em] text-[#1DB954] group-hover:text-[#1ed760] transition">
        {code}
      </div>
      <div className="text-[10px] text-white/35 mt-0.5">{copied ? "link copied!" : "tap to copy link"}</div>
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

// ---------- LobbyScreen ----------
function LobbyScreen({ state, dispatch, isHost, deviceId, code, mode, onLeave, spotifyToken, onSpotifyDisconnect }) {
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
        <TopBar subtitle="Lobby" right={<RoomChip code={code} mode={mode} />} onBack={onLeave} backLabel="Leave room" />

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
          <div className="flex gap-2 overflow-x-auto pt-3 pb-1 -mx-1 px-1" style={{ overflowY: "visible" }}>
            {state.players.map(p => {
              const isMe = p.deviceId === deviceId;
              const isHostP = p.deviceId === state.hostDeviceId;
              const songCount = state.songs.filter(s => s.ownerDeviceId === p.deviceId).length;
              return (
                <div key={p.deviceId} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="relative" style={{ overflow: "visible" }}>
                    <Avatar name={p.name} size={42} dim={p.online === false} />
                    {isHostP && (
                      <div className="absolute -top-1 -right-1 text-[10px] bg-[#1DB954] text-black rounded-full w-4 h-4 grid place-items-center font-bold border border-[var(--bg)] z-10">★</div>
                    )}
                  </div>
                  <div className={cx("text-[11px] truncate max-w-[64px]", isMe ? "text-[#1DB954] font-semibold" : "text-white/75")}>{p.name}</div>
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
          <div className="mt-4 mx-6 rounded-2xl border border-[#282828] bg-[#181818] p-3 relative z-10">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40 mb-2 px-1">Your picks</div>
            <div className="space-y-1.5">
              {mySongs.map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl bg-[#282828] px-3 py-2">
                  {s.cover ? (
                    <img src={s.cover} alt="" className="w-9 h-9 rounded-md object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-[#282828]"></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate font-medium">{s.title}</div>
                    <div className="text-[11px] text-white/50 truncate">
                      {s.artist}{s.noPreview && <span className="ml-1.5 text-[#B3B3B3]">· no preview</span>}
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

        {/* Spotify importer (only when connected) */}
        {spotifyToken && (
          <div className="mt-4 mx-6">
            <SpotifyImporter
              token={spotifyToken}
              dispatch={dispatch}
              deviceId={deviceId}
              onDisconnect={onSpotifyDisconnect}
              existingTitles={new Set(mySongs.map(s => (s.title + "|" + s.artist).toLowerCase()))}
            />
          </div>
        )}

        {/* Add a song */}
        <div className="mt-4 mx-6 rounded-2xl border border-[#282828] bg-[#181818] p-4 space-y-3 grain relative z-10">
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
              "w-full mt-1 rounded-xl py-3 text-sm font-semibold active:scale-[0.99] transition flex items-center justify-center gap-2",
              loading
                ? "bg-[#282828] text-[#B3B3B3] cursor-wait"
                : "bg-[#1DB954] hover:bg-[#1ed760] text-black"
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
                  ? "bg-[#1DB954] hover:bg-[#1ed760] text-black"
                  : "bg-[#282828] text-[#535353] cursor-not-allowed"
              )}
            >
              {canStart
                ? `Start · ${state.songs.length} round${state.songs.length === 1 ? "" : "s"} →`
                : state.songs.length < 3
                  ? `Need ${3 - state.songs.length} more song${3 - state.songs.length === 1 ? "" : "s"}`
                  : "Need at least 2 different players"}
            </button>
          ) : (
            <div className="w-full rounded-xl py-4 text-center bg-[#181818] border border-[#282828] text-[#B3B3B3] text-sm">
              {canStart ? "Waiting for host to start…" : "Waiting on more songs…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PoolCounter({ count, variant }) {
  const remaining = Math.max(0, 3 - count);
  const ready = count >= 3;
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

// ---------- RoundScreen ----------
function RoundScreen({ state, dispatch, deviceId, isHost, onLeave }) {
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
          onBack={onLeave}
          backLabel="Leave game"
          right={
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Round</div>
              <div className="font-mono text-sm font-semibold text-[#1DB954] tabular">
                {state.roundIdx + 1}<span className="text-[#535353]">/{state.order.length}</span>
              </div>
            </div>
          }
        />

        <div className="mx-6 mt-1 rounded-3xl border border-[#282828] bg-[#181818] p-5 grain relative overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="relative grid place-items-center" style={{ width: 168, height: 168 }}>
              <div className="absolute inset-0"><TimerRing progress={progress} /></div>
              <div className={cx("w-[120px] h-[120px] rounded-full overflow-hidden border border-black/40 grid place-items-center relative spin-slow", !playing && "spin-paused")}>
                {song.cover ? (
                  <>
                    <img src={song.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(0,0,0,0.85) 0 14%, transparent 14.5% 60%, rgba(0,0,0,0.55) 60.5% 100%)" }}></div>
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, #000 0 18%, #282828 18.5% 60%, #181818 60.5% 100%)" }}></div>
                )}
                <div className="relative w-6 h-6 rounded-full bg-white"></div>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 text-[11px] font-mono tabular text-[#B3B3B3]">
                0:{secondsLeft.toString().padStart(2,"0")}
              </div>
            </div>

            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#1DB954]">Now spinning</div>
            <div className="mt-1 text-lg font-semibold leading-tight text-center px-4 truncate w-full">{song.title}</div>
            <div className="text-sm text-white/65 text-center truncate w-full px-4">{song.artist}</div>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-white/45 font-mono">
              {playing ? (
                <div className="flex items-end gap-[2px] h-3">
                  <div className="w-[2px] bg-[#1DB954] eq-bar"></div>
                  <div className="w-[2px] bg-[#1DB954] eq-bar" style={{ animationDelay: "120ms" }}></div>
                  <div className="w-[2px] bg-[#1DB954] eq-bar" style={{ animationDelay: "240ms" }}></div>
                </div>
              ) : <div className="w-2 h-2 rounded-full bg-white/30"></div>}
              <button onClick={togglePlay} disabled={!song.url} className={cx("underline-offset-2 hover:underline", !song.url && "opacity-30 cursor-not-allowed")}>
                {playing ? "pause" : "play"}
              </button>
            </div>
            {audioError && (
              <div className="mt-2 text-[12px] text-[#B3B3B3] text-center">
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
            <div className="mt-3 rounded-2xl bg-[#181818] border border-[#282828] p-5 text-center">
              <div className="text-3xl mb-2">🤫</div>
              <div className="text-sm text-[#B3B3B3]">Sit tight while everyone guesses.</div>
              <div className="mt-3 flex justify-center gap-1 flex-wrap">
                {guessers.map(p => (
                  <div key={p.deviceId} className={cx(
                    "px-2 py-1 rounded-full text-[11px] flex items-center gap-1.5 border",
                    state.guesses[p.deviceId]
                      ? "bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]"
                      : "bg-[#282828] border-transparent text-[#B3B3B3]"
                  )}>
                    <Avatar name={p.name} size={14} />
                    {p.name}
                    {state.guesses[p.deviceId] && <span>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : myGuess ? (
            <div className="mt-3 rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/[0.06] p-5 text-center">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#1DB954] mb-2">Your guess</div>
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
                        ? "bg-[#181818] border-[#282828] text-[#535353] cursor-not-allowed"
                        : "bg-[#181818] border-[#282828] hover:bg-[#202020] hover:border-[#3a3a3a]"
                    )}
                  >
                    <Avatar name={p.name} size={26} dim={reallyDisabled} />
                    <div className="min-w-0">
                      <div className="truncate">{p.name}</div>
                      {self && <div className="text-[10px] text-[#535353]">that's you</div>}
                      {p.online === false && !self && <div className="text-[10px] text-[#535353]">offline</div>}
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
function ResultsScreen({ state, dispatch, deviceId, isHost, onLeave, cinematic }) {
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
              {state.fastestCorrect && (
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
                    {noGuess ? "didn't lock in" : right ? "correct" : "wrong"}{seconds ? ` · ${seconds}s` : ""}
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
  const [step, setStep] = useStateApp(state.players.length === 0 ? "intro" : "songs");
  const [currentId, setCurrentId] = useStateApp(lastPlayer ? lastPlayer.deviceId : null);
  const [name, setName] = useStateApp("");
  const [title, setTitle] = useStateApp("");
  const [artist, setArtist] = useStateApp("");
  const [loading, setLoading] = useStateApp(false);
  const [err, setErr] = useStateApp("");

  const currentPlayer = state.players.find(p => p.deviceId === currentId) || null;
  const owners = new Set(state.songs.map(s => s.ownerDeviceId));
  const canStart = state.songs.length >= 3 && owners.size >= 2;
  const currentSongs = currentPlayer ? state.songs.filter(s => s.ownerDeviceId === currentPlayer.deviceId) : [];

  const submitName = () => {
    setErr("");
    const n = name.trim();
    if (!n) return setErr("Add a name.");
    if (state.players.some(p => p.name.toLowerCase() === n.toLowerCase())) {
      return setErr("Someone in the room already has that name.");
    }
    const newId = newDeviceId();
    dispatch({ type: "join", deviceId: newId, name: n });
    setCurrentId(newId);
    setName("");
    setStep("songs");
  };

  const submitSong = async () => {
    setErr("");
    if (!currentPlayer) return;
    if (!title.trim() || !artist.trim()) return setErr("Add a song title and artist.");
    setLoading(true);
    let found = null;
    try { found = await findPreview(title.trim(), artist.trim()); } catch (e) {}
    setLoading(false);
    dispatch({
      type: "addSong",
      ownerDeviceId: currentPlayer.deviceId,
      title: title.trim(),
      artist: artist.trim(),
      url: found ? found.preview : null,
      cover: found ? found.cover : null,
      noPreview: !found,
    });
    setTitle(""); setArtist("");
  };

  const passDevice = () => {
    setStep("pass");
  };
  const startNextPlayer = () => {
    setCurrentId(null);
    setStep("name");
    setTitle(""); setArtist(""); setName(""); setErr("");
  };

  const start = () => {
    if (!canStart) return;
    dispatch({ type: "start" });
  };

  return (
    <HomeStageShell>
      <HomeHeader
        subtitle={`Pass-around · ${state.players.length} player${state.players.length === 1 ? "" : "s"}`}
        onBack={onLeave}
        backLabel="Leave"
      />

      <div className="px-6 mt-4 flex-1">
        <HpSectionTitle>
          {step === "intro" && <>SINGLE DEVICE <span style={{ color: "var(--hp-gold)" }}>MODE</span></>}
          {step === "name" && <>NEXT <span style={{ color: "var(--hp-gold)" }}>PLAYER</span></>}
          {step === "songs" && currentPlayer && (
            <>HEY, <span style={{ color: "var(--hp-magenta)" }}>{currentPlayer.name.toUpperCase()}</span></>
          )}
          {step === "pass" && <>PASS THE <span style={{ color: "var(--hp-gold)" }}>PHONE</span></>}
        </HpSectionTitle>
        <HpSectionDesc>
          {step === "intro" && "Take turns — name, drop a song, hand it off. One phone, whole crew."}
          {step === "name" && "Type your name to start adding songs."}
          {step === "songs" && "Add at least one track. Done? Pass the phone to the next player."}
          {step === "pass" && "No peeking — hand the device over, then they tap to continue."}
        </HpSectionDesc>

        {state.players.length > 0 && step !== "songs" && (
          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">Added so far</div>
            <div className="flex flex-wrap gap-2">
              {state.players.map(p => {
                const cnt = state.songs.filter(s => s.ownerDeviceId === p.deviceId).length;
                return (
                  <div key={p.deviceId} className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-white/15 bg-black/35">
                    <Avatar name={p.name} size={20} />
                    <span className="text-[12px] font-medium">{p.name}</span>
                    <span className="text-[11px] font-mono text-[var(--hp-gold)] tabular">{cnt}♪</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === "intro" && (
          <div className="mt-6">
            <HpGoldBtn onClick={() => setStep("name")}>ADD FIRST PLAYER →</HpGoldBtn>
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
            {currentSongs.length > 0 && (
              <div className="mt-4">
                <HpPanel className="p-3 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2 px-1">Your picks</div>
                  {currentSongs.map(s => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
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
                </HpPanel>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <HpPanel className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <HpField label="Song title" value={title} onChange={setTitle} placeholder="Levitating" />
                  <HpField label="Artist" value={artist} onChange={setArtist} placeholder="Dua Lipa" />
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>30-sec preview fetched automatically</span>
                </div>
                {err && <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--hp-magenta)]">{err}</div>}
                <HpPrimaryBtn disabled={loading} onClick={submitSong}>
                  {loading ? "FINDING PREVIEW…" : "ADD SONG"}
                </HpPrimaryBtn>
              </HpPanel>
              <HpMutedBtn disabled={currentSongs.length === 0} onClick={passDevice}>
                PASS TO NEXT PLAYER →
              </HpMutedBtn>
            </div>
          </>
        )}

        {step === "pass" && (
          <div className="mt-6">
            <HpPanel center className="py-6">
              <div className="font-display text-[56px] leading-none" style={{ color: "var(--hp-gold)" }}>♪</div>
              <HpSectionDesc>Hand the phone to the next player.</HpSectionDesc>
              <div className="mt-4">
                <HpGoldBtn onClick={startNextPlayer}>I'M THE NEXT PLAYER →</HpGoldBtn>
              </div>
            </HpPanel>
          </div>
        )}

        <div className="mt-6">
          <PoolCounter count={state.songs.length} variant="home" />
        </div>

        <div className="mt-6 pb-4">
          <HpPrimaryBtn disabled={!canStart} onClick={start}>
            {canStart
              ? `START ${state.songs.length} ROUND${state.songs.length === 1 ? "" : "S"} →`
              : owners.size < 2
                ? `NEED 2+ PLAYERS WITH SONGS (${owners.size})`
                : `NEED ${3 - state.songs.length} MORE SONG${3 - state.songs.length === 1 ? "" : "S"}`}
          </HpPrimaryBtn>
        </div>
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
  const [activeId, setActiveId] = useStateApp(null);

  useEffectApp(() => {
    setProgress(0);
    setAudioError(!song || song.noPreview || !song.url);
    setActiveId(null);
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

  // Auto-reveal when all non-owner players have locked in
  useEffectApp(() => {
    if (!song) return;
    const nonOwners = state.players.filter(p => p.deviceId !== song.ownerDeviceId).map(p => p.deviceId);
    if (nonOwners.length === 0) return;
    const allIn = nonOwners.every(id => state.guesses[id] != null);
    if (allIn) {
      const t = setTimeout(() => dispatch({ type: "revealRound" }), 350);
      return () => clearTimeout(t);
    }
  }, [song, state.players, state.guesses, dispatch]);

  if (!song) return null;

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      const p = a.play();
      if (p && p.catch) p.catch(() => setAudioError(true));
    } else { a.pause(); }
  };

  const activePlayer = activeId ? state.players.find(p => p.deviceId === activeId) : null;
  const isOwner = activePlayer && activePlayer.deviceId === song.ownerDeviceId;
  const activeGuess = activeId ? state.guesses[activeId] : null;
  const guessersLocked = state.players.filter(p => p.deviceId !== song.ownerDeviceId && state.guesses[p.deviceId]).length;
  const totalGuessers = state.players.length - 1;

  const pickTarget = (targetId) => {
    if (!activeId || isOwner) return;
    if (targetId === activeId) return;
    dispatch({
      type: "submitGuess",
      deviceId: activeId,
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
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Tap your name to guess</div>
            <div className="font-mono text-[10px] text-[var(--hp-gold)] tabular">{guessersLocked}/{totalGuessers} locked</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {state.players.map(p => {
              const locked = state.guesses[p.deviceId] != null;
              const active = activeId === p.deviceId;
              return (
                <button
                  key={p.deviceId}
                  onClick={() => setActiveId(p.deviceId)}
                  className={cx(
                    "px-2.5 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5",
                    active
                      ? "bg-[var(--hp-gold)] text-[#08080C] border-[var(--hp-gold)]"
                      : locked
                        ? "bg-black/40 border-[var(--hp-neon)]/40 text-[var(--hp-neon)]"
                        : "bg-black/35 border-white/15 text-white/70 hover:border-[var(--hp-gold)]/40"
                  )}
                >
                  <Avatar name={p.name} size={18} />
                  <span>{p.name}</span>
                  {locked && <span>✓</span>}
                </button>
              );
            })}
          </div>

          <HpPanel className="mt-4 p-3 min-h-[180px]">
            {!activePlayer ? (
              <div className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 py-10">
                Pass the phone — tap your name above
              </div>
            ) : isOwner ? (
              <div className="text-center py-8 px-4">
                <div className="font-display text-[48px] leading-none" style={{ color: "var(--hp-gold)" }}>♪</div>
                <div className="mt-2 font-display text-[20px] tracking-[0.06em]" style={{ color: "var(--hp-neon)" }}>
                  THIS ONE'S YOURS, {activePlayer.name.toUpperCase()}
                </div>
                <HpSectionDesc>Hand the phone to someone else — no guess for you.</HpSectionDesc>
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
                <HpSectionDesc>Pass the phone to the next player.</HpSectionDesc>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  <span style={{ color: "var(--hp-magenta)" }}>{activePlayer.name}</span>, who do you suspect?
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {state.players.map(p => {
                    const self = p.deviceId === activeId;
                    return (
                      <button
                        key={p.deviceId}
                        disabled={self}
                        onClick={() => pickTarget(p.deviceId)}
                        className={cx(
                          "rounded-xl px-3 py-3 text-sm font-medium border text-left transition flex items-center gap-2",
                          self
                            ? "bg-black/25 border-white/8 text-white/30 cursor-not-allowed"
                            : "bg-black/35 border-white/15 hover:border-[var(--hp-gold)]/50 hover:bg-black/50"
                        )}
                      >
                        <Avatar name={p.name} size={26} dim={self} />
                        <div className="min-w-0">
                          <div className="truncate">{p.name}</div>
                          {self && <div className="font-mono text-[9px] uppercase text-white/30">that's you</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </HpPanel>
        </div>

        <div className="pt-6 pb-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          Reveal when everyone's locked in
        </div>
      </div>
    </HomeStageShell>
  );
}

// ---------- GameView (after start screen, with session) ----------
function GameView({ choice, spotifyToken, onSpotifyDisconnect, onReset }) {
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

  const isLocal = mode.kind === "local";
  const common = {
    state, dispatch, deviceId, isHost,
    code: choice.code, mode, onLeave: onReset,
    spotifyToken, onSpotifyDisconnect,
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
          cinematic={isLocal}
        />
      )}
      {state.phase === "round" && (
        isLocal
          ? <LocalRoundScreen {...common} />
          : <RoundScreen {...common} />
      )}
      {state.phase === "results" && <ResultsScreen {...common} cinematic={isLocal} />}
      {state.phase === "final" && <FinalScreen {...common} cinematic={isLocal} />}
    </>
  );
}

// ---------- App ----------
function App() {
  const [choice, setChoice] = useStateApp(null);
  const [spotifyToken, setSpotifyToken] = useStateApp(() => (typeof spotifyGetStoredToken === "function" ? spotifyGetStoredToken() : null));
  const [spotifyLoading, setSpotifyLoading] = useStateApp(false);
  const [spotifyError, setSpotifyError] = useStateApp(null);

  // On mount: if we're returning from a Spotify redirect, finish the exchange.
  useEffectApp(() => {
    let cancelled = false;
    (async () => {
      if (typeof spotifyHandleRedirect !== "function") return;
      try {
        const u = new URL(window.location.href);
        if (!u.searchParams.get("code") && !u.searchParams.get("error")) return;
        setSpotifyLoading(true);
        const result = await spotifyHandleRedirect();
        if (cancelled) return;
        if (result && result.token) {
          setSpotifyToken(result.token);
          setSpotifyError(null);
        } else if (result && result.error) {
          setSpotifyError(humanSpotifyError(result.error));
        }
      } catch (e) {
        if (!cancelled) setSpotifyError("Couldn't complete sign-in. Try again.");
      } finally {
        if (!cancelled) setSpotifyLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onSpotifyLogin = async () => {
    setSpotifyError(null);
    setSpotifyLoading(true);
    try { await spotifyStartLogin(); }
    catch (e) {
      setSpotifyError("Couldn't start sign-in.");
      setSpotifyLoading(false);
    }
  };

  return (
    <div className="shell">
      {!choice && (
        <StartScreen
          onChoose={setChoice}
          spotifyToken={spotifyToken}
          spotifyLoading={spotifyLoading}
          spotifyError={spotifyError}
          onSpotifyLogin={onSpotifyLogin}
        />
      )}
      {choice && (
        <GameView
          choice={choice}
          spotifyToken={spotifyToken}
          onSpotifyDisconnect={() => { spotifyClearToken(); setSpotifyToken(null); }}
          onReset={() => setChoice(null)}
        />
      )}
    </div>
  );
}

function humanSpotifyError(code) {
  if (code === "access_denied") return "You declined access.";
  if (code === "missing_verifier") return "Sign-in expired — please try again.";
  if (code === "invalid_client") return "Spotify client ID isn't configured yet.";
  if (code === "invalid_grant") return "Sign-in code expired — try again.";
  if (code === "network") return "Network error — check your connection.";
  return "Sign-in failed (" + code + ").";
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
