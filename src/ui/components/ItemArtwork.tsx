import { useId } from 'react';
import {
  BatteryCharging,
  Clock3,
  CloudRain,
  Cpu,
  Flame,
  Gem,
  Hand,
  Heart,
  Magnet,
  Orbit,
  Pointer,
  Rainbow,
  ScanEye,
  Settings2,
  Sun,
  Zap,
} from 'lucide-react';

const symbols = {
  'booster.turbo-mint': Zap,
  'booster.power-tap': Pointer,
  'booster.golden-magnet': Magnet,
  'booster.time-warp': Clock3,
  'card.silver-touch': Hand,
  'card.mint-gear': Settings2,
  'card.steady-hand': Pointer,
  'card.gold-chip': Cpu,
  'card.dusk-battery': BatteryCharging,
  'card.rainbow-finder': Rainbow,
  'card.frenzy-core': Flame,
  'card.prism-heart': Heart,
  'card.clockwork': Clock3,
  'card.rain-lens': ScanEye,
  'card.rain-cloud': CloudRain,
  'card.star-forge': Sun,
};
const colors: Record<string, [string, string]> = {
  'booster.turbo-mint': ['#8ff3d4', '#147c73'],
  'booster.power-tap': ['#b0caff', '#4664bd'],
  'booster.golden-magnet': ['#ffe4a0', '#a66430'],
  'booster.time-warp': ['#dbb9ff', '#694ba8'],
  'chest.silver': ['#dceaff', '#637e9e'],
  'chest.gold': ['#ffe09a', '#ad722e'],
  'key.star': ['#ffe9b4', '#ac7f40'],
};

/** Local vector artwork, with distinct silhouettes for chests, keys, boosters and cards. */
export function ItemArtwork({ id, label }: { id: string; label: string }) {
  const key = useId().replaceAll(':', '');
  const card = id.startsWith('card.');
  const chest = id.startsWith('chest.');
  const [light, dark] = colors[id] ?? ['#b6caff', '#6554aa'];
  const Symbol = symbols[id as keyof typeof symbols] ?? (card ? Orbit : Gem);
  return (
    <svg className="item-artwork" viewBox="0 0 96 96" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${key}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={light} />
          <stop offset="0.45" stopColor={dark} />
          <stop offset="1" stopColor={light} />
        </linearGradient>
        <radialGradient id={`${key}-glow`}>
          <stop stopColor={light} stopOpacity=".24" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="94"
        height="94"
        rx="20"
        fill="#0c182b"
        stroke={light}
        strokeOpacity=".18"
      />
      <circle cx="48" cy="48" r="46" fill={`url(#${key}-glow)`} />
      <ellipse cx="48" cy="78" rx="29" ry="5" fill="#050b17" opacity=".6" />
      {chest ? (
        <g stroke={light} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M18 47Q18 25 38 25H59Q78 26 78 47Z" fill={`url(#${key}-metal)`} />
          <path d="M18 47H78V71Q78 76 71 76H25Q18 76 18 71Z" fill={dark} />
          <path d="M27 29V47M68 29V47M28 49V74M68 49V74" strokeOpacity=".7" strokeWidth="4" />
          <path d="M18 48H78" strokeWidth="3" />
          <rect x="41" y="43" width="14" height="19" rx="3" fill={light} />
          <path d="m48 47 3 5-3 5-3-5Z" fill={dark} stroke="none" />
        </g>
      ) : id === 'key.star' ? (
        <g transform="rotate(-35 48 48)" stroke={light} strokeWidth="2" strokeLinejoin="round">
          <path d="M43 44H53V77H43ZM53 64H64V72H53" fill={`url(#${key}-metal)`} />
          <path
            d="m48 16 5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2Z"
            fill={`url(#${key}-metal)`}
          />
          <circle cx="48" cy="32" r="5" fill="#26334a" />
        </g>
      ) : (
        <>
          {card ? (
            <>
              <rect
                x="23"
                y="17"
                width="51"
                height="67"
                rx="9"
                transform="rotate(-8 48 48)"
                fill="#26314d"
                stroke={light}
                strokeOpacity=".35"
              />
              <rect x="25" y="12" width="49" height="68" rx="8" fill={`url(#${key}-metal)`} />
              <rect x="28" y="15" width="43" height="62" rx="6" fill="#19213b" />
              <path d="M34 67H65M34 71H54" stroke={light} strokeOpacity=".5" strokeWidth="2" />
            </>
          ) : (
            <>
              <path
                d="M37 20H59V30L69 42V70Q69 77 61 77H35Q27 77 27 70V42L37 30Z"
                fill={`url(#${key}-metal)`}
                stroke={light}
                strokeWidth="1.5"
              />
              <rect x="34" y="15" width="28" height="11" rx="4" fill={dark} stroke={light} />
              <path d="M32 47H64V68Q64 72 59 72H37Q32 72 32 68Z" fill="#15243b" opacity=".85" />
            </>
          )}
          <Symbol
            x={card ? 34 : 35}
            y={card ? 30 : 42}
            width="28"
            height="28"
            stroke={light}
            strokeWidth="1.8"
            fill="none"
          />
        </>
      )}
      <path
        d="m79 16 1.5 4.5L85 22l-4.5 1.5L79 28l-1.5-4.5L73 22l4.5-1.5Z"
        fill={light}
        opacity=".85"
      />
    </svg>
  );
}
