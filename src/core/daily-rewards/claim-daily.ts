import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { CommandResult } from '@core/engine/contracts';
import { dailyStatus } from './calendar';
import { grantRewards } from '@core/rewards/grant-rewards';
import { increment } from '@core/progression/tracking';

export function claimDaily(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  nowUtc: string,
): CommandResult {
  const status = dailyStatus(state.daily, nowUtc);
  if (!status.available)
    return { ok: false, error: status.rollback ? 'clock-rollback' : 'daily-claimed' };
  const reward = catalog.dailyRewards[status.nextReward - 1]!;
  const next = grantRewards(state, catalog, reward.rewards, 'daily').state;
  next.revision = increment(next.revision);
  next.daily = {
    claimCount: increment(state.daily.claimCount),
    lastClaimDay: status.day,
    highestDay: Math.max(state.daily.highestDay, status.day),
  };
  return { ok: true, value: { state: next, events: [{ type: 'DailyClaimed', day: status.day }] } };
}
