import { z } from 'zod';
import { amount } from '@shared/amount';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { cardSlots, MAX_DUPLICATES } from '@core/cards/selectors';
import { inventoryDefinitions } from '@core/catalog/inventory';
const money = z.string().refine(amount.isValid);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const note = {
  note: z.enum(['new', 'duplicate', 'converted']).optional(),
  sourceCardId: z.string().optional(),
};
const reward = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('currency'),
    currency: z.enum(['coin', 'goldCoin']),
    amount: money,
    ...note,
  }),
  z.strictObject({
    kind: z.literal('item'),
    itemId: z.string(),
    quantity: z.number().int().min(1).max(10),
    ...note,
  }),
  z.strictObject({
    kind: z.literal('card'),
    cardId: z.string(),
    quantity: z.number().int().min(1).max(10),
    ...note,
  }),
]);
export const collectionStateFields = {
  offlineEfficiency: money.refine((value) => amount.compare(value, '1') <= 0),
  cards: z.strictObject({
    owned: z.record(
      z.string(),
      z.strictObject({
        level: z.number().int().min(1).max(10),
        duplicates: count.max(MAX_DUPLICATES),
        convertedGold: money,
      }),
    ),
    equipped: z.array(z.string()).max(3),
  }),
  chests: z.strictObject({
    rng: z.number().int().min(1).max(4294967295),
    opened: count,
    starterClaimed: z.boolean(),
    acknowledged: z.boolean(),
    lastResult: z
      .strictObject({
        id: count.min(1),
        chestId: z.string(),
        openedAtUtc: z.iso.datetime(),
        rewards: z.array(reward).min(1).max(250),
      })
      .nullable(),
  }),
};
export function validateCollectionState(state: GameState, catalog: GameCatalog) {
  const known = new Set(catalog.cards.map((card) => card.id));
  for (const [id, card] of Object.entries(state.cards.owned)) {
    if (
      !known.has(id) ||
      amount.normalize(card.convertedGold).includes('.') ||
      (card.level === catalog.cardProgression.maxLevel && card.duplicates !== 0)
    )
      throw new RangeError('Invalid card');
  }
  if (
    new Set(state.cards.equipped).size !== state.cards.equipped.length ||
    state.cards.equipped.length > cardSlots(state, catalog) ||
    state.cards.equipped.some((id) => !state.cards.owned[id])
  )
    throw new RangeError('Invalid equipped cards');
  const chest = state.chests;
  const result = chest.lastResult;
  if ((chest.opened === 0) !== (result === null) || (!result && !chest.acknowledged))
    throw new RangeError('Missing chest receipt');
  if (result) {
    if (result.id !== chest.opened || !catalog.chests.some((chest) => chest.id === result.chestId))
      throw new RangeError('Invalid receipt');
    const inventory = new Set(inventoryDefinitions(catalog).map((item) => item.id));
    for (const reward of result.rewards) {
      if (
        (reward.kind === 'currency' &&
          (amount.compare(reward.amount, '0') <= 0 ||
            (reward.currency === 'goldCoin' && amount.normalize(reward.amount).includes('.')))) ||
        (reward.kind === 'item' && !inventory.has(reward.itemId)) ||
        (reward.kind === 'card' && !known.has(reward.cardId))
      )
        throw new RangeError('Invalid receipt reward');
      if (reward.sourceCardId && (!known.has(reward.sourceCardId) || reward.note !== 'converted'))
        throw new RangeError('Invalid conversion source');
      if (
        reward.note === 'converted' &&
        (reward.kind !== 'currency' || reward.currency !== 'goldCoin' || !reward.sourceCardId)
      )
        throw new RangeError('Invalid conversion');
      if ((reward.note === 'new' || reward.note === 'duplicate') && reward.kind !== 'card')
        throw new RangeError('Invalid card outcome');
    }
  }
}
