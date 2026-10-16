import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { AchievementDefinition, AchievementMetric } from '@core/progression/progression.types';
import { amount } from '@shared/amount';

export function achievementValue(state: Readonly<GameState>, metric: AchievementMetric): string {
  switch (metric) {
    case 'clicks':
      return String(state.statistics.clicks);
    case 'produced':
      return state.statistics.totalProducedCoin;
    case 'machines':
      return String(Object.values(state.generators).reduce((sum, n) => sum + n, 0));
    case 'upgrades':
      return String(state.purchasedUpgradeIds.length);
    case 'eventCoins':
      return String(state.tracking.eventCoins);
    case 'rainbows':
      return String(state.tracking.rainbows);
    case 'cards':
      return String(Object.keys(state.cards.owned).length);
    case 'chests':
      return String(state.chests.opened);
    case 'daily':
      return String(state.daily.claimCount);
  }
}
export function achievementStatus(state: Readonly<GameState>, definition: AchievementDefinition) {
  const value = achievementValue(state, definition.metric);
  const unlocked =
    state.achievements.unlockedIds.includes(definition.id) ||
    amount.compare(value, definition.target) >= 0;
  const claimed = state.achievements.claimedIds.includes(definition.id);
  return {
    value,
    unlocked,
    claimed,
    ready: unlocked && !claimed,
    percent: amount.progress(value, definition.target),
  };
}
export function unlockAchievements(state: GameState, catalog: GameCatalog): GameState {
  const fresh = catalog.achievements.filter(
    (item) =>
      !state.achievements.unlockedIds.includes(item.id) &&
      amount.compare(achievementValue(state, item.metric), item.target) >= 0,
  );
  return fresh.length
    ? {
        ...state,
        achievements: {
          ...state.achievements,
          unlockedIds: [...state.achievements.unlockedIds, ...fresh.map((item) => item.id)],
        },
      }
    : state;
}
