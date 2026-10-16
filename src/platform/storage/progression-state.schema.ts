import { z } from 'zod';
import { amount } from '@shared/amount';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { sourceTotals } from '@core/progression/tracking';
const money = z.string().refine(amount.isValid);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const day = z.number().int().min(-100000000).max(100000000);
export const progressionStateFields = {
  daily: z.strictObject({ claimCount: count, lastClaimDay: day.nullable(), highestDay: day }),
  achievements: z.strictObject({
    unlockedIds: z.array(z.string()).max(200),
    claimedIds: z.array(z.string()).max(200),
  }),
  tracking: z.strictObject({
    coin: z.strictObject({
      click: money,
      production: money,
      offline: money,
      timeWarp: money,
      chest: money,
      daily: money,
      achievement: money,
    }),
    goldFromEvents: money,
    eventCoins: count,
    rainbows: count,
    boostersUsed: count,
    activeMs: count,
  }),
};
export function validateProgressionState(state: GameState, catalog: GameCatalog) {
  const { daily, achievements } = state;
  if (
    (daily.claimCount === 0) !== (daily.lastClaimDay === null) ||
    (daily.lastClaimDay !== null && daily.lastClaimDay > daily.highestDay)
  )
    throw new RangeError('Invalid daily sequence');
  for (const ids of [achievements.unlockedIds, achievements.claimedIds])
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !catalog.achievements.some((item) => item.id === id))
    )
      throw new RangeError('Invalid achievement IDs');
  if (achievements.claimedIds.some((id) => !achievements.unlockedIds.includes(id)))
    throw new RangeError('Claimed locked achievement');
  sourceTotals(state);
  if (amount.normalize(state.tracking.goldFromEvents).includes('.'))
    throw new RangeError('Fractional event Gold');
}
