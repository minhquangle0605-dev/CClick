import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CommandError, CommandResult } from '@core/engine/contracts';
import { productionPerSecond } from '@core/economy/selectors';
import { extendEffect } from '@core/effects/pipeline';
import { amount } from '@shared/amount';
import { trackCoin, increment } from '@core/progression/tracking';
import { recordItem } from '@core/statistics/item-history';

export const MAX_ITEM_COUNT = 9999;
export function previewBooster(state: Readonly<GameState>, catalog: GameCatalog, id: string) {
  const item = catalog.boosters.find((item) => item.id === id);
  let error: CommandError | null = !item
    ? 'unknown-item'
    : !(state.inventory[id] ?? 0)
      ? 'missing-item'
      : null;
  let reward = '0';
  let effects = state.effects;
  let remainingSeconds = 0;
  if (!item) return { error, reward, effects, remainingSeconds };
  try {
    if (item.warpSeconds > 0) {
      reward = amount.multiply(productionPerSecond(state, catalog), String(item.warpSeconds));
      if (reward === '0') error ??= 'no-production';
      amount.add(state.wallet.coin, reward);
      amount.add(state.statistics.totalProducedCoin, reward);
    } else {
      for (const effect of item.effects)
        effects = extendEffect(
          effects,
          {
            ...effect,
            sourceId: item.id,
            operation: 'multiply',
            startsAt: state.effectsAtMs,
            expiresAt: 0,
            stackPolicy: 'extend',
          },
          item.durationSeconds * 1000,
          item.maxDurationSeconds * 1000,
        );
      const updated = effects.filter((effect) => effect.sourceId === id);
      remainingSeconds = Math.ceil(
        Math.max(...updated.map((effect) => effect.expiresAt - state.effectsAtMs)) / 1000,
      );
      if (
        updated.every((next) =>
          state.effects.some(
            (old) =>
              old.sourceId === next.sourceId &&
              old.target === next.target &&
              old.expiresAt >= next.expiresAt,
          ),
        )
      )
        error ??= 'effect-cap';
    }
  } catch {
    error = 'numeric-limit';
  }
  return { error, reward, effects, remainingSeconds };
}
export function useBooster(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  id: string,
): CommandResult {
  const preview = previewBooster(state, catalog, id);
  if (preview.error) return { ok: false, error: preview.error };
  const next: GameState = {
    ...state,
    revision: state.revision + 1,
    tracking: {
      ...trackCoin(state.tracking, 'timeWarp', preview.reward),
      boostersUsed: increment(state.tracking.boostersUsed),
    },
    inventory: { ...state.inventory, [id]: state.inventory[id]! - 1 },
    itemHistory: recordItem(state.itemHistory, id, 'spent', 'activated', 1, state.inventory[id]!),
    effects: preview.effects,
    wallet: { ...state.wallet, coin: amount.add(state.wallet.coin, preview.reward) },
    statistics: {
      ...state.statistics,
      totalProducedCoin: amount.add(state.statistics.totalProducedCoin, preview.reward),
    },
  };
  return {
    ok: true,
    value: {
      state: next,
      events: [
        { type: 'BoosterUsed', itemId: id },
        ...(preview.reward !== '0'
          ? [{ type: 'CoinEarned' as const, source: 'time-warp' as const, amount: preview.reward }]
          : []),
      ],
    },
  };
}
