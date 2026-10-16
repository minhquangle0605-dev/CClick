import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { amount } from '@shared/amount';
import { endActiveSession } from '@core/events/end-active-session';
import { refreshProgress } from '@core/progression/refresh-progress';
import { createTimeSimulation } from '@core/automation/advance-game';
import { snapshotRates } from '@core/automation/upgrade-planner';

export interface OfflineSummary {
  coin: string;
  seconds: number;
  capped: boolean;
  clockRollback: boolean;
  gold?: string;
  spent?: string;
  upgrades?: number;
}
export function monotonicUtc(previous: string, now: string): string {
  return Date.parse(now) >= Date.parse(previous) ? now : previous;
}

export function settleOffline(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  now: string,
): { state: GameState; summary: OfflineSummary } {
  const elapsed = Date.parse(now) - Date.parse(state.lastSimulatedAtUtc);
  if (!Number.isFinite(elapsed)) throw new RangeError('Invalid offline time');
  const milliseconds = Math.max(0, Math.min(elapsed, catalog.balance.offlineCapSeconds * 1000));
  const seconds = milliseconds / 1000;
  const summary = {
    coin: '0',
    seconds,
    capped: elapsed > catalog.balance.offlineCapSeconds * 1000,
    clockRollback: elapsed < 0,
  };
  if (elapsed <= 0) {
    let next = endActiveSession(state, now);
    // A migrated save opened at the exact checkpoint must still activate the
    // new click baseline for its next absence. Rollbacks keep the old snapshot.
    if (elapsed === 0 && next.offlineClickPower === '0')
      next = snapshotRates({ ...next, revision: next.revision + 1 }, catalog);
    return { state: refreshProgress(next, catalog, now), summary };
  }
  const simulation = createTimeSimulation(catalog, true);
  const start = Math.max(state.effectsAtMs, Date.parse(state.lastSimulatedAtUtc));
  const result = simulation.advance(state, start, milliseconds);
  const earned = amount.add(result.production, result.click);
  return {
    state: refreshProgress(
      snapshotRates(
        {
          ...endActiveSession(result.state, now),
          lastSimulatedAtUtc: monotonicUtc(state.lastSimulatedAtUtc, now),
        },
        catalog,
      ),
      catalog,
      now,
    ),
    summary: {
      ...summary,
      coin: earned,
      gold: result.gold,
      spent: amount.subtract(
        result.state.statistics.totalSpentCoin,
        state.statistics.totalSpentCoin,
      ),
      upgrades: result.actions,
    },
  };
}
