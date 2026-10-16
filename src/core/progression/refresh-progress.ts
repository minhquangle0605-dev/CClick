import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { vietnamDay } from '@core/daily-rewards/calendar';
import { unlockAchievements } from '@core/achievements/selectors';

export function refreshProgress(state: GameState, catalog: GameCatalog, nowUtc: string): GameState {
  const highestDay = Math.max(state.daily.highestDay, vietnamDay(nowUtc));
  return unlockAchievements(
    highestDay === state.daily.highestDay
      ? state
      : { ...state, daily: { ...state.daily, highestDay } },
    catalog,
  );
}
