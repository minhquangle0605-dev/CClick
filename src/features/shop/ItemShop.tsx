import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { DurableAction } from '@core/engine/contracts';
import { amount } from '@shared/amount';
import { MAX_ITEM_COUNT } from '@core/boosters/use-booster';
import { text } from '@ui/components/text';
import { inventoryDefinitions } from '@core/catalog/inventory';
import { GoldArtwork } from '@ui/components/GoldArtwork';

export function ItemShop({
  state,
  catalog,
  disabled,
  onCommand,
  onOpenInventory,
  onOpenChests,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
  disabled: boolean;
  onCommand: DurableAction;
  onOpenInventory: () => void;
  onOpenChests?: () => void;
}) {
  const format = useNumberFormat();
  const [message, setMessage] = useState('');
  return (
    <div className="item-shop">
      <p className="gold-balance">
        <GoldArtwork /> {format(state.wallet.goldCoin)} Gold
      </p>
      <p className="shop-feedback">{text('boosters.source')}</p>
      <div className="shop-items">
        {catalog.itemOffers.map((offer) => {
          const item = inventoryDefinitions(catalog).find((item) => item.id === offer.itemId)!;
          const owned = state.inventory[item.id] ?? 0;
          return (
            <article className="item-offer" key={offer.id}>
              <strong>{text(item.nameKey)}</strong>
              <p title={text(item.descriptionKey)}>{text(item.descriptionKey)}</p>
              <small>
                {text('shop.owned')} {format(owned)}
              </small>
              <button
                className="buy-button"
                disabled={
                  disabled ||
                  amount.compare(state.wallet.goldCoin, offer.goldPrice) < 0 ||
                  owned >= MAX_ITEM_COUNT
                }
                onClick={() => {
                  void onCommand({ type: 'PurchaseItem', offerId: offer.id }).then((result) =>
                    setMessage(
                      text(result.ok ? 'boosters.purchased' : `action.error.${result.error}`),
                    ),
                  );
                }}
              >
                {text('boosters.exchange')} · {format(offer.goldPrice)} Gold
              </button>
            </article>
          );
        })}
      </div>
      <div className="item-shop-links">
        <button className="primary-button" onClick={onOpenInventory}>
          {text('boosters.open')}
        </button>
        {onOpenChests && (
          <button className="primary-button history-button" onClick={onOpenChests}>
            {text('chests.title')}
          </button>
        )}
      </div>
      <p role="status" className="action-message">
        {message}
      </p>
    </div>
  );
}
