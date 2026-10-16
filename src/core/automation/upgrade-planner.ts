import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { amount } from '@shared/amount';
import { purchase } from '@core/shop/purchase';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { offlineEfficiency } from '@core/cards/selectors';
import { increment } from '@core/progression/tracking';
import { AUTO_RECHECK_MS } from './constants';
import { createLoadoutOptimizer } from './loadout';
import { selectAutoInvestment } from './investment';

export function snapshotRates(state: GameState, catalog: GameCatalog): GameState {
  return {
    ...state,
    offlineCps: productionPerSecond(state, catalog),
    offlineClickPower: clickPower(state, catalog),
    offlineEfficiency: offlineEfficiency(state, catalog),
  };
}

/** Deterministic policy: affordable first, shortest payback at sustainable CPS + 10 clicks/s.
 * No claim, inventory, chest or Gold-spending command is part of this policy.
 */
export function createUpgradePlanner(catalog: GameCatalog, offline: boolean) {
  const optimize = createLoadoutOptimizer(catalog);
  let wakeAt = -Infinity;
  function changed(state: GameState, name: string) {
    return snapshotRates(
      {
        ...state,
        automation: {
          ...state.automation,
          actions: increment(state.automation.actions),
          lastAction: name,
        },
      },
      catalog,
    );
  }
  return {
    invalidate() {
      wakeAt = -Infinity;
    },
    nextAt() {
      return wakeAt;
    },
    run(initial: Readonly<GameState>, at: number) {
      if (!initial.automation.upgradeEnabled) return { state: initial as GameState, count: 0 };
      if (at < wakeAt) return { state: initial as GameState, count: 0 };
      let state = initial as GameState;
      let count = 0;
      // Bound work per visible tick. Offline uses the same policy and resumes at the next boundary.
      for (let attempt = 0; attempt < 32; attempt++) {
        const loadout = optimize(state, offline);
        if ([...loadout.equipped].sort().join() !== [...state.cards.equipped].sort().join()) {
          state = changed(
            {
              ...state,
              revision: increment(state.revision),
              cards: { ...state.cards, equipped: loadout.equipped },
            },
            'automation.cardsOptimized',
          );
          count++;
        }
        const { target: best, waitMs: bestWait } = selectAutoInvestment(
          state,
          catalog,
          offline,
          at,
        );
        if (!best || bestWait !== '0') {
          const waitMs = best
            ? Number(amount.min(bestWait, String(AUTO_RECHECK_MS)))
            : AUTO_RECHECK_MS;
          wakeAt =
            at +
            Math.max(
              1,
              Math.ceil((waitMs + state.automation.clickRemainderMs) / 100) * 100 -
                state.automation.clickRemainderMs,
            );
          return { state, count };
        }
        const result = purchase(state, catalog, best.command);
        if (!result.ok) {
          wakeAt = at + 1000;
          return { state, count };
        }
        state = changed(result.value.state, best.name);
        count++;
      }
      wakeAt = at + 100;
      return { state, count };
    },
  };
}
