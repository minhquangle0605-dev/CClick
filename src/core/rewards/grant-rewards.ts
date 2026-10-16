import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { Reward, AppliedReward } from './reward.types';
import { amount } from '@shared/amount';
import { MAX_ITEM_COUNT } from '@core/boosters/use-booster';
import { MAX_DUPLICATES } from '@core/cards/selectors';
import type { GiftSource } from '@core/progression/progression.types';
import { trackCoin } from '@core/progression/tracking';
import { itemQuantity, recordItem } from '@core/statistics/item-history';
import type { ItemSource } from '@core/statistics/item-history.types';

/** Mutate only a private clone; the caller commits the whole returned state or none. */
export function grantRewards(
  initial: Readonly<GameState>,
  catalog: GameCatalog,
  rewards: readonly Reward[],
  source: GiftSource = 'chest',
  itemSource: ItemSource = source,
) {
  const state: GameState = structuredClone(initial);
  const applied: AppliedReward[] = [];
  for (const reward of rewards) {
    if (reward.kind === 'currency') {
      state.wallet[reward.currency] = amount.add(state.wallet[reward.currency], reward.amount);
      if (reward.currency === 'coin') {
        state.statistics.totalGiftCoin = amount.add(state.statistics.totalGiftCoin, reward.amount);
        state.tracking = trackCoin(state.tracking, source, reward.amount);
      }
      applied.push({ ...reward });
    } else if (reward.kind === 'item') {
      state.itemHistory = recordItem(
        state.itemHistory,
        reward.itemId,
        'earned',
        itemSource,
        reward.quantity,
        itemQuantity(state, reward.itemId),
      );
      const count = (state.inventory[reward.itemId] ?? 0) + reward.quantity;
      if (count > MAX_ITEM_COUNT) throw new RangeError('Inventory full');
      state.inventory[reward.itemId] = count;
      applied.push({ ...reward });
    } else {
      const definition = catalog.cards.find((item) => item.id === reward.cardId);
      if (!definition) throw new RangeError('Unknown card');
      for (let index = 0; index < reward.quantity; index++) {
        const held = itemQuantity(state, reward.cardId);
        state.itemHistory = recordItem(
          state.itemHistory,
          reward.cardId,
          'earned',
          itemSource,
          1,
          held,
        );
        const owned = state.cards.owned[reward.cardId];
        if (!owned) {
          state.cards.owned[reward.cardId] = { level: 1, duplicates: 0, convertedGold: '0' };
          applied.push({ ...reward, quantity: 1, note: 'new' });
        } else if (owned.level >= catalog.cardProgression.maxLevel) {
          state.itemHistory = recordItem(
            state.itemHistory,
            reward.cardId,
            'spent',
            'converted',
            1,
            held + 1,
          );
          const gold = catalog.cardProgression.maxDuplicateGold[definition.rarity];
          state.wallet.goldCoin = amount.add(state.wallet.goldCoin, gold);
          owned.convertedGold = amount.add(owned.convertedGold, gold);
          applied.push({
            kind: 'currency',
            currency: 'goldCoin',
            amount: gold,
            note: 'converted',
            sourceCardId: reward.cardId,
          });
        } else {
          if (owned.duplicates >= MAX_DUPLICATES) throw new RangeError('Duplicate limit');
          owned.duplicates++;
          applied.push({ ...reward, quantity: 1, note: 'duplicate' });
        }
      }
    }
  }
  return { state, applied };
}
