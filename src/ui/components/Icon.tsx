import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Coins,
  Clock3,
  MousePointer2,
  Crown,
  Factory,
  Gem,
  Hammer,
  Layers3,
  LockKeyhole,
  Map,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';

const icons = {
  arrow: ArrowUpRight,
  book: BookOpen,
  check: Check,
  chevron: ChevronRight,
  coins: Coins,
  clock: Clock3,
  cursor: MousePointer2,
  crown: Crown,
  factory: Factory,
  gem: Gem,
  hammer: Hammer,
  cards: Layers3,
  lock: LockKeyhole,
  map: Map,
  settings: Settings2,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  trend: TrendingUp,
  trophy: Trophy,
  close: X,
  zap: Zap,
};
export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 20,
  className = '',
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return <Component aria-hidden="true" size={size} strokeWidth={1.6} className={className} />;
}
