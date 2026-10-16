import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CommandResult } from '@core/engine/contracts';
import { MAX_ITEM_COUNT } from '@core/boosters/use-booster';
import { amount } from '@shared/amount';
import { recordItem } from '@core/statistics/item-history';

export function purchaseItem(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  offerId: string,
): CommandResult {
  const offer = catalog.itemOffers.find((item) => item.id === offerId);
  if (!offer) return { ok: false, error: 'unknown-item' };
  if (amount.compare(state.wallet.goldCoin, offer.goldPrice) < 0)
    return { ok: false, error: 'insufficient-funds' };
  const owned = state.inventory[offer.itemId] ?? 0;
  if (owned >= MAX_ITEM_COUNT) return { ok: false, error: 'numeric-limit' };
  return {
    ok: true,
    value: {
      state: {
        ...state,
        revision: state.revision + 1,
        wallet: {
          ...state.wallet,
          goldCoin: amount.subtract(state.wallet.goldCoin, offer.goldPrice),
        },
        inventory: { ...state.inventory, [offer.itemId]: owned + 1 },
        itemHistory: recordItem(state.itemHistory, offer.itemId, 'earned', 'shop', 1, owned),
      },
      events: [{ type: 'ItemPurchased', itemId: offer.itemId }],
    },
  };
}
