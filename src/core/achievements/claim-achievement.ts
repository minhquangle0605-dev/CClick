import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { CommandResult } from '@core/engine/contracts';
import { achievementStatus, unlockAchievements } from './selectors';
import { grantRewards } from '@core/rewards/grant-rewards';
import { increment } from '@core/progression/tracking';

export function claimAchievement(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  id: string,
): CommandResult {
  const item = catalog.achievements.find((item) => item.id === id);
  if (!item) return { ok: false, error: 'unknown-item' };
  const status = achievementStatus(state, item);
  if (status.claimed) return { ok: false, error: 'already-claimed' };
  if (!status.unlocked) return { ok: false, error: 'locked' };
  const next = unlockAchievements(
    grantRewards(state, catalog, item.rewards, 'achievement').state,
    catalog,
  );
  next.revision = increment(next.revision);
  next.achievements = { ...next.achievements, claimedIds: [...next.achievements.claimedIds, id] };
  return {
    ok: true,
    value: { state: next, events: [{ type: 'AchievementClaimed', achievementId: id }] },
  };
}
