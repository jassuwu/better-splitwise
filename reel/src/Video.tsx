import {
  AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig,
  spring, interpolate, Easing, delayRender, continueRender,
} from 'remotion';
import { FRAMES_PER_BEAT, barFrame, beatFrame } from '../sync.mjs';

// ============================================================================
// better splitwise — launch reel. Seven friends, one bill, the smug ₹1,057.14-each
// "let's just split it evenly" (from the guy who ate two rib-eyes). Snap a photo →
// it itemizes → tap who had each item → it's added to splitwise, to the cent. The
// drop busts the equal split. Honest data (sums to ₹7,400); chat is affectionate parody.
// ============================================================================

const FONT = 'Montserrat';
const fh = delayRender('montserrat', { timeoutInMilliseconds: 90000 });
Promise.all(
  [['600', 'fonts/Montserrat-600.ttf'], ['700', 'fonts/Montserrat-700.ttf'], ['800', 'fonts/Montserrat-800.ttf']]
    .map(([w, f]) => new FontFace(FONT, `url(${staticFile(f)})`, { weight: w }).load()),
).then((faces) => { faces.forEach((f) => (document as any).fonts.add(f)); continueRender(fh); }).catch(() => continueRender(fh));

const INK = '#0c0e12';
const LIME = '#d4fd80';
const LIME2 = '#e9ffb3';
const WHITE = '#f4f6f8';
const DIM = '#8b93a0';
const TEAL = '#1cc29f';
const ff = `${FONT}, system-ui, sans-serif`;
const M = 72;

const TOTAL = 7400;
const EQUAL = '1,057';
const CAST = [
  { id: 'HL', name: 'homelander', total: 2430, tone: 'star' },
  { id: 'BB', name: 'butcher', total: 1230, tone: 'lime' },
  { id: 'HU', name: 'hughie', total: 230, tone: 'soft' },
  { id: 'AN', name: 'annie', total: 480, tone: 'pale' },
  { id: 'MM', name: 'mm', total: 1080, tone: 'mute' },
  { id: 'FR', name: 'frenchie', total: 1230, tone: 'lime' },
  { id: 'KM', name: 'kimiko', total: 720, tone: 'soft' },
];
const CB: Record<string, { lite: string; base: string; dark: string }> = {
  star: { lite: '#f8ffe0', base: '#eaffb0', dark: '#b9d986' },
  lime: { lite: '#eaffb0', base: '#d4fd80', dark: '#9cc24a' },
  pale: { lite: '#f6ffda', base: '#e9ffb3', dark: '#bcd98a' },
  mute: { lite: '#e3f3bf', base: '#cde88f', dark: '#9bbf6a' },
  soft: { lite: '#dcf7c0', base: '#c2e8a0', dark: '#92b870' },
};
const ITEMS = [
  { name: 'mutton biryani ×2', price: 2400, who: ['HL'] },
  { name: 'the beers ×6', price: 1800, who: ['BB', 'MM', 'FR'] },
  { name: 'the good whisky', price: 1200, who: ['BB', 'FR'] },
  { name: 'paneer tikka', price: 900, who: ['AN', 'MM'] },
  { name: 'side raita', price: 200, who: ['HU'] },
  { name: 'crab masala', price: 690, who: ['KM'] },
  { name: 'GST & service', price: 210, who: ['HL', 'BB', 'HU', 'AN', 'MM', 'FR', 'KM'] },
];
const tone = (id: string) => CB[CAST.find((c) => c.id === id)!.tone];

const B = (n: number) => barFrame(n);
const FB = FRAMES_PER_BEAT;
const eo = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
const ci = (f: number, ks: number[], vs: number[], e?: any) => interpolate(f, ks, vs, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
const num = (v: number) => Math.round(v).toLocaleString('en-IN');
const GR = { backgroundImage: 'linear-gradient(180deg,#f2ffd0 0%,#d4fd80 52%,#bff25e 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' } as const;

const Money: React.FC<{ v: number; size: number; color?: string; weight?: number; glow?: boolean }> = ({ v, size, color = '#1a1a1a', weight = 700, glow }) => {
  const g = glow ? GR : { color };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: ff, fontWeight: weight, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1, "lnum" 1', whiteSpace: 'nowrap', letterSpacing: size >= 40 ? '-0.025em' : '-0.005em', filter: glow ? 'drop-shadow(0 0 22px rgba(212,253,128,0.5)) drop-shadow(0 0 6px rgba(212,253,128,0.8))' : undefined }}>
      <span style={{ fontSize: Math.round(size * 0.56), fontWeight: 700, opacity: 0.82, transform: 'translateY(-0.1em)', marginRight: size * 0.04, ...g }}>₹</span>
      <span style={{ fontSize: size, ...g }}>{num(v)}</span>
    </span>
  );
};

const Avatar: React.FC<{ id: string; size: number; drop?: boolean; dim?: boolean }> = ({ id, size, drop, dim }) => {
  const c = tone(id);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(120% 120% at 32% 26%, ${c.lite} 0%, ${c.base} 44%, ${c.dark} 100%)`, boxShadow: `inset 0 ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.45), inset 0 -${size * 0.1}px ${size * 0.16}px rgba(0,0,0,0.28), 0 0 0 2px rgba(12,14,18,0.9), 0 0 0 ${Math.max(2, size * 0.05)}px rgba(212,253,128,0.45), 0 ${size * 0.12}px ${size * 0.3}px rgba(0,0,0,0.45)${drop ? ', 0 0 26px rgba(212,253,128,0.4)' : ''}`, color: INK, display: 'grid', placeItems: 'center', fontFamily: ff, fontWeight: 800, fontSize: size * 0.36, lineHeight: 1, textShadow: '0 1px 1px rgba(255,255,255,0.35)', opacity: dim ? 0.32 : 1, transition: 'none' }}>{id}</div>
  );
};

const HOUSE = 'M16 51 L16 27 L32 14 L48 27 L48 51 Z';
const BS = 'M25.500 49.500L16.050 49.500L16.050 32L25 32Q28.450 32 30.150 33.263Q31.850 34.525 31.850 36.575Q31.850 37.925 31.150 38.925Q30.525 39.800 29.475 40.375Q29.650 40.425 29.800 40.475Q31.175 41.050 31.937 42.112Q32.700 43.175 32.700 44.700Q32.700 46.975 30.862 48.237Q29.025 49.500 25.500 49.500M20.950 42.375L20.950 45.925L25.100 45.925Q26.375 45.925 27.037 45.487Q27.700 45.050 27.700 44.150Q27.700 43.250 27.037 42.813Q26.375 42.375 25.100 42.375L20.950 42.375M20.950 35.575L20.950 38.950L24.350 38.950Q25.600 38.950 26.225 38.525Q26.850 38.100 26.850 37.250Q26.850 36.400 26.225 35.987Q25.600 35.575 24.350 35.575L20.950 35.575M41.425 49.850Q39.275 49.850 37.288 49.313Q35.300 48.775 34.050 47.925L35.675 44.275Q36.850 45.025 38.388 45.513Q39.925 46 41.450 46Q42.475 46 43.100 45.813Q43.725 45.625 44.013 45.313Q44.300 45 44.300 44.575Q44.300 43.975 43.750 43.625Q43.200 43.275 42.325 43.050Q41.450 42.825 40.388 42.600Q39.325 42.375 38.262 42.025Q37.200 41.675 36.325 41.112Q35.450 40.550 34.900 39.638Q34.350 38.725 34.350 37.325Q34.350 35.750 35.212 34.475Q36.075 33.200 37.800 32.425Q39.525 31.650 42.100 31.650Q43.825 31.650 45.487 32.037Q47.150 32.425 48.450 33.175L46.925 36.850Q45.675 36.175 44.450 35.837Q43.225 35.500 42.075 35.500Q41.050 35.500 40.425 35.712Q39.800 35.925 39.525 36.275Q39.250 36.625 39.250 37.075Q39.250 37.650 39.788 37.987Q40.325 38.325 41.212 38.538Q42.100 38.750 43.163 38.975Q44.225 39.200 45.288 39.538Q46.350 39.875 47.225 40.438Q48.100 41 48.638 41.913Q49.175 42.825 49.175 44.200Q49.175 45.725 48.313 47.013Q47.450 48.300 45.737 49.075Q44.025 49.850 41.425 49.850';
const GemSvg: React.FC<{ size: number; shimmer?: number }> = ({ size, shimmer }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
    <defs><clipPath id="gcl"><rect width="64" height="64" rx="14" /></clipPath><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="50%" stopColor="#fff" stopOpacity="0.45" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
    <rect width="64" height="64" rx="14" fill={INK} />
    <g clipPath="url(#gcl)"><path d="M32 26 L0 0 H64 Z" fill={LIME2} /><path d="M32 26 L0 0 V64 Z" fill={LIME} /><path d="M32 26 L64 0 V64 Z" fill="#2a3038" /><path d="M32 26 L0 64 H64 Z" fill={INK} />{shimmer !== undefined && <rect x={-64 + shimmer * 128} y="0" width="40" height="64" fill="url(#sheen)" style={{ mixBlendMode: 'overlay' }} transform="skewX(-18)" />}</g>
    <path d={HOUSE} fill="none" stroke={WHITE} strokeWidth={3.6} strokeLinejoin="round" /><path d={BS} fill={WHITE} />
  </svg>
);
const Gem: React.FC<{ size: number; bloom?: number; shimmer?: number }> = ({ size, bloom = 0.5, shimmer }) => (
  <div style={{ position: 'relative', width: size, height: size }}>
    <div style={{ position: 'absolute', inset: 0, filter: `blur(${size * 0.12}px)`, opacity: bloom, mixBlendMode: 'screen', transform: 'scale(1.18)' }}><GemSvg size={size} /></div>
    <div style={{ position: 'relative', filter: `drop-shadow(0 0 ${size * 0.18}px rgba(212,253,128,0.5))` }}><GemSvg size={size} shimmer={shimmer} /></div>
  </div>
);

// ============================================================================
export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const relief = ci(frame, [B(5), B(7)], [0, 1], Easing.inOut(Easing.cubic));
  const painT = ci(frame, [B(5), B(6)], [1, 0]);
  let glow = frame < B(5) ? 0 : ci(frame, [B(5), B(6)], [0, 1]) * 0.2; // steady, not breathing
  if (frame >= B(5) && frame < B(6)) glow += 0.12; // the capture lights the room
  if (frame >= B(10) && frame < B(11)) glow += ci(frame, [B(10), B(10) + 10, B(11)], [0.55, 0.22, 0.18]);

  // calm float only — the perpetual handheld + rotation are gone; the one intentional move is the push-in
  const driftX = (Math.sin(frame * 0.13) + 0.5 * Math.sin(frame * 0.31)) * 0.6;
  const driftY = (Math.cos(frame * 0.11) + 0.5 * Math.sin(frame * 0.27)) * 0.4;
  const push = ci(frame, [B(5), B(13)], [1.0, 1.045], Easing.inOut(Easing.sin));
  const parX = ci(frame, [B(5), B(13)], [0, -6]);
  const cam = `scale(${push}) translate(${driftX * (1 - relief) + parX * relief}px, ${driftY * (1 - relief)}px)`;

  const sat = 0.78 + (1 - painT) * (1.04 - 0.78);
  const hue = -6 * painT;
  const con = 1.08 - (1 - painT) * 0.04;
  const vig = ci(frame, [B(10), B(11)], [0.9, 0.62]);
  const grainOp = ci(frame, [B(5), B(6)], [0.07, 0.045]);
  const meshDrift = 'scale(1.06)'; // frozen — a still soft gradient reads as depth, not motion

  return (
    <AbsoluteFill style={{ backgroundColor: '#07090c', overflow: 'hidden' }}>
      <Html5Audio src={staticFile('audio.wav')} />
      <AbsoluteFill style={{ background: 'radial-gradient(120% 120% at 30% 18%, #12161d, #0c0e12 55%, #07090c 100%)' }} />
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.5 * (1 - 0.3 * relief), transform: meshDrift, background: 'radial-gradient(60% 90% at 18% 22%, rgba(40,70,90,0.55), transparent 60%), radial-gradient(50% 70% at 82% 80%, rgba(28,50,72,0.45), transparent 55%)' }} />
      <AbsoluteFill style={{ mixBlendMode: 'screen', background: `radial-gradient(70% 70% at 50% 46%, rgba(212,253,128,${glow * 0.9}), rgba(212,253,128,${glow * 0.25}) 30%, transparent 62%)` }} />
      {painT > 0 && <AbsoluteFill style={{ mixBlendMode: 'soft-light', opacity: painT, background: 'radial-gradient(90% 90% at 50% 50%, rgba(20,40,70,0.12), transparent 70%)' }} />}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, opacity: 0.03 }}><path d="M0 0 L560 0 L0 560 Z" fill={LIME} /><path d="M1920 1080 L1360 1080 L1920 520 Z" fill={LIME} /></svg>

      <AbsoluteFill style={{ transform: cam, transformOrigin: '50% 46%', filter: `saturate(${sat}) hue-rotate(${hue}deg) contrast(${con})` }}>
        {frame >= B(6) && frame < B(11) && (
          <div style={{ position: 'absolute', top: M, left: M, display: 'flex', alignItems: 'center', gap: 16, opacity: eo(frame, B(6), B(6) + 12) }}>
            <Gem size={52} bloom={0.4} /><span style={{ fontFamily: ff, fontWeight: 800, fontSize: 28, color: WHITE, letterSpacing: '-0.02em' }}>better splitwise</span>
          </div>
        )}
        {frame < B(5) && <PhoneChat frame={frame} fps={fps} />}
        {frame >= B(5) && frame < B(6) && <PhoneCapture frame={frame} fps={fps} />}
        {frame >= B(6) && frame < B(10) && <AssignApp frame={frame} fps={fps} />}
        {frame >= B(10) && frame < B(11) && <DropScene frame={frame} fps={fps} />}
        {frame >= B(11) && frame < B(13) && <SettleScene frame={frame} fps={fps} />}
        {frame >= B(13) && <ResolveScene frame={frame} end={durationInFrames} />}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(120% 120% at 50% 44%, transparent 55%, rgba(0,0,0,${vig * 0.55}) 100%)`, boxShadow: `inset 0 0 240px 40px rgba(0,0,0,${vig * 0.55})` }} />
      <AbsoluteFill style={{ mixBlendMode: 'soft-light', background: 'linear-gradient(180deg, rgba(30,60,80,0.10), transparent 40%, rgba(60,50,20,0.06))' }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile('grain.png')})`, backgroundSize: '512px 512px', mixBlendMode: 'overlay', opacity: grainOp }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// a WhatsApp-style "the boys" group chat: the bill arrives as a photo, homelander proposes the
// even split, the group piles on. all dialogue original parody.
const NCOL: Record<string, string> = { HL: '#eaffb0', BB: '#f0b86e', HU: '#8fc6ff', AN: '#f3a6c0', MM: '#86d6a8', FR: '#f0b86e', KM: '#c79bf0' };
const MSGS = [
  { id: 'HL', side: 'out', photo: true, t: 'let’s just split it evenly. ₹1,057 each 🙂', at: beatFrame(2), time: '9:41' },
  { id: 'AN', side: 'in', t: 'you ordered two biryanis, john.', at: beatFrame(7), time: '9:41' },
  { id: 'HU', side: 'in', t: 'i literally just had a raita 😭', at: beatFrame(10), time: '9:42' },
  { id: 'BB', side: 'in', t: 'not buyin’ his biryani, mate.', at: beatFrame(12), time: '9:42' },
  { id: 'MM', side: 'in', t: 'didn’t touch the whisky.', at: beatFrame(14), time: '9:43' },
  { id: 'KM', side: 'in', t: '🦀', at: beatFrame(16), time: '9:43', tiny: true },
  { id: 'HL', side: 'out', t: '…why is everyone looking at me?', at: beatFrame(18), time: '9:44' },
];
const nameOf = (id: string) => CAST.find((c) => c.id === id)!.name;

const PhoneChat: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 18, stiffness: 150, mass: 1 } });
  const py = ci(rise, [0, 1], [110, 0]);
  const PW = 444, PH = 884, HEAD = 78, INPUT = 60;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `translateY(${py}px)`, width: PW, height: PH, borderRadius: 52, background: 'linear-gradient(160deg,#202632,#0e1117)', padding: 11, boxShadow: '0 40px 110px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: '#0b141a', display: 'flex', flexDirection: 'column' }}>
          {/* header */}
          <div style={{ height: HEAD, flexShrink: 0, background: '#1f2c33', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', boxShadow: '0 1px 0 rgba(0,0,0,0.4)' }}>
            <span style={{ color: '#8696a0', fontSize: 28, fontFamily: ff, marginRight: 2 }}>‹</span>
            <div style={{ position: 'relative', width: 46, height: 40 }}><div style={{ position: 'absolute', left: 0, top: 5 }}><Avatar id="HL" size={30} /></div><div style={{ position: 'absolute', left: 17, top: 5 }}><Avatar id="BB" size={30} /></div></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 19, color: '#e9edef' }}>the boys</div>
              <div style={{ fontFamily: ff, fontWeight: 500, fontSize: 12.5, color: '#8696a0' }}>homelander, butcher, hughie, +4</div>
            </div>
            <span style={{ color: '#8696a0', fontSize: 22, letterSpacing: '2px' }}>⋮</span>
          </div>
          {/* messages (bottom-anchored, newest at the bottom) */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, padding: '10px 12px 4px' }}>
            <div style={{ alignSelf: 'center', background: 'rgba(31,44,51,0.7)', color: '#8696a0', fontFamily: ff, fontSize: 11.5, fontWeight: 600, padding: '4px 12px', borderRadius: 8, marginBottom: 4 }}>today</div>
            {MSGS.map((m, i) => {
              if (frame < m.at) return null;
              const e = eo(frame, m.at, m.at + 6);
              const inc = m.side === 'in';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: inc ? 'flex-start' : 'flex-end', opacity: e, transform: `translateY(${(1 - e) * 14}px)` }}>
                  {inc && <div style={{ marginRight: 7 }}><Avatar id={m.id} size={28} /></div>}
                  <div style={{ maxWidth: 300, background: inc ? '#1f2c33' : '#13694f', borderRadius: 14, borderTopLeftRadius: inc ? 3 : 14, borderTopRightRadius: inc ? 14 : 3, padding: '7px 11px 5px', boxShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
                    {inc && <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: NCOL[m.id], marginBottom: 2 }}>{nameOf(m.id)}</div>}
                    {m.photo && (
                      <div style={{ width: 258, borderRadius: 8, overflow: 'hidden', marginBottom: 6, background: 'linear-gradient(178deg,#fff,#f2efe4)', padding: '12px 14px', boxSizing: 'border-box' }}>
                        <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 14, color: '#181712' }}>the boys · dinner</div>
                        {ITEMS.slice(0, 3).map((it) => <div key={it.name} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontFamily: ff, fontSize: 11, fontWeight: 600, color: '#3a382f' }}><span>{it.name}</span><span>₹{num(it.price)}</span></div>)}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid #ddd9cc', paddingTop: 5, fontFamily: ff, fontWeight: 800, fontSize: 13, color: '#181712' }}><span>total</span><span>₹{num(TOTAL)}</span></div>
                      </div>
                    )}
                    <div style={{ fontFamily: ff, fontWeight: 500, fontSize: m.tiny ? 30 : 19, color: '#e9edef', lineHeight: 1.3 }}>{m.t}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 1 }}>
                      <span style={{ fontFamily: ff, fontSize: 11, color: '#8696a0' }}>{m.time}</span>
                      {!inc && <span style={{ fontSize: 12, color: '#53bdeb', lineHeight: 1 }}>✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* input bar */}
          <div style={{ height: INPUT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px 10px' }}>
            <div style={{ flex: 1, height: 40, borderRadius: 20, background: '#1f2c33', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: ff, fontSize: 15, color: '#8696a0' }}>message</div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#21a884', display: 'grid', placeItems: 'center', color: '#0b141a', fontSize: 18, fontWeight: 800 }}>↑</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};


// ---------------------------------------------------------------------------
// snap a photo: a phone frames the receipt, brackets lock, shutter flash, itemized.
const PhoneCapture: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const start = B(5);
  const rise = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 150, mass: 0.9 } });
  const y = ci(rise, [0, 1], [620, 0]);
  const lock = eo(frame, start + 8, start + 24);
  const flash = ci(frame, [start + 28, start + 31, start + 40], [0, 1, 0]);
  const captured = frame >= start + 31;
  const PW = 392, PH = 760;
  const br = 18 + (1 - lock) * 26; // brackets close in
  const corner = (h: boolean, v: boolean) => ({ position: 'absolute' as const, [h ? 'right' : 'left']: 26, [v ? 'bottom' : 'top']: 26, width: 46, height: 46, [`border${v ? 'Bottom' : 'Top'}`]: '4px solid ' + LIME, [`border${h ? 'Right' : 'Left'}`]: '4px solid ' + LIME, borderRadius: 6, opacity: lock });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `translateY(${y}px)`, width: PW, height: PH, borderRadius: 52, background: 'linear-gradient(160deg,#202632,#0e1117)', padding: 12, boxShadow: '0 40px 110px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 42, background: '#0a0c10', overflow: 'hidden' }}>
          {/* camera view of the receipt */}
          <div style={{ position: 'absolute', inset: 0, opacity: captured ? 0.25 : 1, filter: captured ? 'none' : `brightness(1.02)`, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 248, height: 360, background: 'linear-gradient(178deg,#fff,#f2efe4)', borderRadius: 8, padding: 20, boxSizing: 'border-box', transform: 'rotate(-2deg)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
              <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 17, color: '#181712' }}>the boys · dinner</div>
              {ITEMS.slice(0, 5).map((it) => <div key={it.name} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: ff, fontSize: 12, fontWeight: 600, color: '#3a382f' }}><span>{it.name}</span><span>₹{num(it.price)}</span></div>)}
            </div>
          </div>
          {/* scan brackets */}
          {!captured && <div style={{ position: 'absolute', inset: br }}>{[[false, false], [true, false], [false, true], [true, true]].map(([h, v], i) => <div key={i} style={corner(h, v)} />)}</div>}
          {/* status pill */}
          <div style={{ position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', fontFamily: ff, fontWeight: 700, fontSize: 16, color: captured ? LIME : WHITE, letterSpacing: '0.04em', opacity: lock }}>
            {captured ? '✓ 7 items found' : 'scanning receipt…'}
          </div>
          {/* shutter */}
          {!captured && <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: 64, height: 64, borderRadius: '50%', background: LIME, boxShadow: `0 0 24px rgba(212,253,128,0.7)`, transform: `scale(${1 - 0.12 * flash})` }} /></div>}
          {/* the BS app badge */}
          <div style={{ position: 'absolute', top: 26, left: 24 }}><Gem size={30} bloom={0.3} /></div>
          {flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// the hero: itemized in the app, tap who had each item — one at a time.
const AssignApp: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const start = B(6);
  const enter = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 170, mass: 0.9 } });
  const step = 30; // frames per item
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 1080, background: 'linear-gradient(180deg, rgba(24,29,38,0.92), rgba(14,18,26,0.95))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, padding: '34px 40px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 40px 90px rgba(0,0,0,0.6)', opacity: Math.min(1, enter), transform: `scale(${0.94 + 0.06 * Math.min(1, enter)})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <Gem size={42} bloom={0.35} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: ff, fontWeight: 800, fontSize: 26, color: WHITE, letterSpacing: '-0.01em' }}>the boys · dinner</div>
            <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: LIME, textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 3 }}>tap who had each item</div>
          </div>
          <Money v={TOTAL} size={26} color={WHITE} weight={800} />
        </div>
        {ITEMS.map((it, i) => {
          const on = start + 8 + i * step;
          const active = frame >= on && frame < on + step + 2;
          const done = frame >= on + step - 4;
          const rowIn = eo(frame, start + 4 + i * 5, start + 16 + i * 5);
          return (
            <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', marginBottom: 4, borderRadius: 14, opacity: 0.42 + 0.58 * rowIn * (frame >= on ? 1 : 0.55), background: active ? 'rgba(212,253,128,0.10)' : 'transparent', boxShadow: active ? 'inset 0 0 0 1.5px rgba(212,253,128,0.5)' : 'none', transform: `scale(${active ? 1.012 : 1})` }}>
              <span style={{ width: 280, fontFamily: ff, fontWeight: 600, fontSize: 24, color: WHITE }}>{it.name}</span>
              <span style={{ width: 110, fontFamily: ff, fontWeight: 700, fontSize: 22, color: DIM, fontVariantNumeric: 'tabular-nums' }}>₹{num(it.price)}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {it.who.length > 4
                  ? <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 18, color: frame >= on + 6 ? LIME : '#3b424d' }}>everyone</span>
                  : it.who.map((pid, j) => {
                    const tapAt = on + 6 + j * 6;
                    const t = eo(frame, tapAt, tapAt + 9);
                    if (t <= 0) return <div key={pid} style={{ width: 40, height: 40 }} />;
                    return (
                      <div key={pid} style={{ transform: `scale(${0.5 + 0.5 * t})`, opacity: t }}>
                        <Avatar id={pid} size={40} />
                      </div>
                    );
                  })}
              </div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', background: done ? LIME : 'rgba(255,255,255,0.06)', color: INK, fontFamily: ff, fontWeight: 800, fontSize: 18, opacity: done ? 1 : 0.5, transform: `scale(${done ? eo(frame, on + step - 4, on + step + 2) : 0.7})` }}>{done ? '✓' : ''}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const DropScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const start = B(10);
  const flash = ci(frame, [start, start + 3, start + 12], [0.92, 0.92, 0]); // one decisive lime flash, that's it
  const sceneBright = ci(frame, [start, start + 2, start + 6], [1.25, 1.1, 1]);
  const ranked = [...CAST].sort((a, b) => b.total - a.total);
  const maxT = ranked[0].total;
  const trackW = 540;
  const equalFrac = 1057.14 / maxT;
  const tagOn = eo(frame, start + 26, start + 38);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', filter: `brightness(${sceneBright})` }}>
      <div style={{ width: 980, display: 'flex', flexDirection: 'column', gap: 9, position: 'relative' }}>
        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 16, color: DIM, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6, opacity: eo(frame, start, start + 8) }}>the fair split</div>
        {ranked.map((p, i) => {
          const on = start + 2 + i * 2;
          const rs = spring({ frame: frame - on, fps, config: { damping: 18, stiffness: 200, mass: 0.8 } });
          const grow = ci(frame, [on + 2, on + 16], [0, 1], Easing.out(Easing.exp));
          const rollEnd = on + 16;
          const v = frame >= rollEnd ? p.total : grow * p.total;
          const w = (p.total / maxT) * trackW * grow;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: Math.min(1, rs), transform: `translateX(${(1 - Math.min(1, rs)) * -20}px)` }}>
              <Avatar id={p.id} size={38} drop />
              <span style={{ width: 150, fontFamily: ff, fontWeight: 700, fontSize: 22, color: WHITE }}>{p.name}</span>
              <div style={{ width: trackW, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                <div style={{ width: w, height: '100%', borderRadius: 8, background: 'linear-gradient(90deg, #bff25e, #d4fd80)', boxShadow: '0 0 18px rgba(212,253,128,0.45)' }} />
              </div>
              <span style={{ width: 130, textAlign: 'right' }}><Money v={v} size={30} weight={800} color={LIME} glow={frame >= rollEnd} /></span>
            </div>
          );
        })}
        {(() => { const drawn = eo(frame, start + 18, start + 28); const left = 16 + 38 + 16 + 150 + equalFrac * trackW; return (
          <div style={{ position: 'absolute', top: 30, bottom: 44, left, opacity: drawn * 0.9 }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: 0, borderLeft: '2px dashed rgba(255,107,107,0.8)' }} />
            <div style={{ position: 'absolute', top: -26, left: -64, width: 150, fontFamily: ff, fontWeight: 700, fontSize: 13, color: '#ff8a8a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>÷7 = ₹1,057</div>
          </div>); })()}
      </div>
      <div style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 16, opacity: tagOn }}>
        <svg width={48} height={48} viewBox="0 0 56 56" style={{ filter: 'drop-shadow(0 0 16px rgba(212,253,128,0.7))' }}><path d="M28 3 L52 16 V40 L28 53 L4 40 V16 Z" fill={LIME} /><path d="M17 28 l8 8 l16 -17" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontFamily: ff, fontWeight: 800, fontSize: 56, letterSpacing: '-0.02em', color: WHITE }}>added to <span style={{ color: TEAL }}>splitwise</span></span>
      </div>
      {flash > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 44%, rgba(233,255,179,${flash}) 0%, rgba(212,253,128,${flash * 0.7}) 30%, transparent 70%)`, mixBlendMode: 'screen' }} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const SettleScene: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const start = B(11);
  const panel = spring({ frame: frame - start, fps, config: { damping: 13, stiffness: 200, mass: 0.8 } });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 30 }}>
      <div style={{ width: 760, background: 'linear-gradient(180deg, rgba(30,36,46,0.85), rgba(18,22,30,0.9))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '30px 40px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 30px 70px rgba(0,0,0,0.55)', opacity: eo(frame, start, start + 10), transform: `scale(${0.96 + 0.04 * Math.min(1, panel)})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <Gem size={44} bloom={0.4} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 24, color: WHITE }}>the boys · dinner</div>
            <div style={{ fontFamily: ff, fontWeight: 600, fontSize: 15, color: DIM }}>added · split 7 ways · to the cent</div>
          </div>
          <Money v={TOTAL} size={30} color={WHITE} weight={800} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 26px', opacity: eo(frame, start + 4, start + 12) }}>
          {CAST.map((p) => (<div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar id={p.id} size={28} /><Money v={p.total} size={20} color={WHITE} weight={700} /></div>))}
        </div>
      </div>
      <div style={{ fontFamily: ff, fontWeight: 600, fontSize: 30, color: DIM, opacity: eo(frame, start + 10, start + 24) }}>everyone owes exactly what they ordered.</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const ResolveScene: React.FC<{ frame: number; end: number }> = ({ frame, end }) => {
  const start = B(13);
  const t = eo(frame, start, start + 16);
  const fade = ci(frame, [end - 40, end - 6], [1, 0]);
  const shimmer = ci(frame, [start + 6, start + 36], [0, 1]);
  const breathe = 46 + 10 * Math.sin(frame * 0.06);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div style={{ transform: `scale(${0.9 + 0.1 * t})`, filter: `drop-shadow(0 0 ${breathe}px rgba(212,253,128,0.42))` }}><Gem size={188} bloom={0.5} shimmer={shimmer > 0 && shimmer < 1 ? shimmer : undefined} /></div>
      <div style={{ marginTop: 30, fontFamily: ff, fontWeight: 800, fontSize: 84, color: WHITE, letterSpacing: '-0.03em', opacity: t, transform: `translateY(${(1 - t) * 22}px)`, textShadow: '0 1px 0 rgba(255,255,255,0.06), 0 2px 14px rgba(0,0,0,0.5)' }}>better splitwise</div>
      <div style={{ marginTop: 14, fontFamily: ff, fontWeight: 700, fontSize: 30, color: LIME, opacity: eo(frame, start + 4, start + 18), textTransform: 'uppercase', letterSpacing: '0.04em' }}>split bills in seconds</div>
      <div style={{ marginTop: 40, fontFamily: ff, fontWeight: 700, fontSize: 14, color: '#6f7682', opacity: eo(frame, start + 16, start + 30), textTransform: 'uppercase', letterSpacing: '0.16em' }}>works with your splitwise account&thinsp;·&thinsp;an unofficial client</div>
    </AbsoluteFill>
  );
};
