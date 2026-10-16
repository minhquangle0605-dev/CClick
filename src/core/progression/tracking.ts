import { amount } from '@shared/amount';
import type { ProgressTracking, CoinSource } from './progression.types';
import type { GameState } from '@core/state/game-state';

export function increment(value: number, by = 1) {
  const next = value + by;
  if (!Number.isSafeInteger(next) || next < 0) throw new RangeError('Counter limit');
  return next;
}
export function trackCoin(
  tracking: ProgressTracking,
  source: CoinSource,
  value: string,
): ProgressTracking {
  return {
    ...tracking,
    coin: { ...tracking.coin, [source]: amount.add(tracking.coin[source], value) },
  };
}
export function sourceTotals(state: Readonly<GameState>) {
  const sum = (sources: CoinSource[]) =>
    sources.reduce((total, source) => amount.add(total, state.tracking.coin[source]), '0');
  return {
    unclassifiedProduced: amount.subtract(
      state.statistics.totalProducedCoin,
      sum(['click', 'production', 'offline', 'timeWarp']),
    ),
    unclassifiedGift: amount.subtract(
      state.statistics.totalGiftCoin,
      sum(['chest', 'daily', 'achievement']),
    ),
  };
}
