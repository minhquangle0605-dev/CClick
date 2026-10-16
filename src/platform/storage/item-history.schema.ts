import { z } from 'zod';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { inventoryDefinitions } from '@core/catalog/inventory';
import { countItems, itemQuantity } from '@core/statistics/item-history';
import { increment } from '@core/progression/tracking';
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const itemHistorySchema = z.strictObject({
  sinceUtc: z.iso.datetime(),
  complete: z.boolean(),
  entries: z.record(
    z.string(),
    z.strictObject({
      opening: count,
      earned: z.strictObject({
        shop: count.optional(),
        chest: count.optional(),
        daily: count.optional(),
        achievement: count.optional(),
        starter: count.optional(),
      }),
      spent: z.strictObject({
        activated: count.optional(),
        opened: count.optional(),
        key: count.optional(),
        upgrade: count.optional(),
        converted: count.optional(),
      }),
    }),
  ),
});
export function validateItemHistory(state: GameState, catalog: GameCatalog) {
  const known = new Set(
    [...inventoryDefinitions(catalog), ...catalog.cards].map((item) => item.id),
  );
  for (const [id, entry] of Object.entries(state.itemHistory.entries)) {
    if (!known.has(id)) throw new RangeError('Unknown item history');
    const available = increment(entry.opening, countItems(entry.earned));
    const spent = countItems(entry.spent);
    if (available < spent || available - spent !== itemQuantity(state, id))
      throw new RangeError('Inconsistent item ledger');
    const allowed = id.startsWith('card.')
      ? ['upgrade', 'converted']
      : id.startsWith('booster.')
        ? ['activated']
        : id.startsWith('chest.')
          ? ['opened']
          : ['key'];
    if (Object.keys(entry.spent).some((reason) => !allowed.includes(reason)))
      throw new RangeError('Invalid item usage');
  }
}
