import type { GameState } from '@core/state/game-state';
import { increment } from '@core/progression/tracking';

import type { ItemHistory, ItemSource, ItemUse } from './item-history.types';
type Holdings = Pick<GameState, 'inventory' | 'cards'>;
export function itemQuantity(state: Holdings, id: string): number {
  const card = state.cards.owned[id];
  return card ? 1 + card.duplicates : (state.inventory[id] ?? 0);
}
export function createItemHistory(sinceUtc: string, legacy?: Holdings): ItemHistory {
  const entries: ItemHistory['entries'] = {};
  if (legacy)
    for (const id of [...Object.keys(legacy.inventory), ...Object.keys(legacy.cards.owned)]) {
      const opening = itemQuantity(legacy, id);
      if (opening) entries[id] = { opening, earned: {}, spent: {} };
    }
  return { sinceUtc, complete: !legacy, entries };
}
export const countItems = (values: Partial<Record<string, number | undefined>>) =>
  Object.values(values).reduce<number>((sum, value) => increment(sum, value ?? 0), 0);

/** Returns a new ledger, to be committed atomically with the item mutation. */
export function recordItem(
  history: ItemHistory,
  id: string,
  direction: 'earned' | 'spent',
  reason: ItemSource | ItemUse,
  quantity: number,
  before: number,
): ItemHistory {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new RangeError('Item count limit');
  if (!quantity) return history;
  const old = history.entries[id] ?? { opening: before, earned: {}, spent: {} };
  const counts = old[direction] as Partial<Record<string, number>>;
  const entry = {
    ...old,
    [direction]: { ...counts, [reason]: increment(counts[reason] ?? 0, quantity) },
  };
  increment(entry.opening, countItems(entry.earned));
  countItems(entry.spent);
  return { ...history, entries: { ...history.entries, [id]: entry } };
}
export function itemTotals(state: Readonly<GameState>, id: string) {
  const remaining = itemQuantity(state, id);
  const entry = state.itemHistory.entries[id] ?? { opening: remaining, earned: {}, spent: {} };
  const received = countItems(entry.earned);
  return {
    ...entry,
    received,
    earnedTotal: increment(entry.opening, received),
    spentTotal: countItems(entry.spent),
    remaining,
  };
}
