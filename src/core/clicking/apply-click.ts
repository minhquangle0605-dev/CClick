import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import { activeClickPower } from '@core/economy/selectors';
import { amount } from '@shared/amount';
import { trackCoin } from '@core/progression/tracking';

export function applyClick(state: GameState, catalog: GameCatalog, nowUtc: string) {
  if (
    state.statistics.clicks >= Number.MAX_SAFE_INTEGER ||
    state.revision >= Number.MAX_SAFE_INTEGER
  ) {
    throw new RangeError('Counter limit');
  }
  const earned = activeClickPower(state, catalog);
  const next: GameState = {
    ...state,
    revision: state.revision + 1,
    tracking: trackCoin(state.tracking, 'click', earned),
    wallet: { ...state.wallet, coin: amount.add(state.wallet.coin, earned) },
    statistics: {
      ...state.statistics,
      clicks: state.statistics.clicks + 1,
      totalProducedCoin: amount.add(state.statistics.totalProducedCoin, earned),
    },
    lastSimulatedAtUtc: nowUtc,
  };
  return { next, earned };
}
