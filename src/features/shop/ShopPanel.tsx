import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type {
  GameCatalog,
  GeneratorDefinition,
  UpgradeDefinition,
} from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { GameCommand, CommandResult, PurchaseQuantity } from '@core/engine/contracts';
import {
  quoteGenerator,
  quoteUpgrade,
  generatorUnlocked,
  upgradeUnlocked,
} from '@core/shop/quotes';
import { amount } from '@shared/amount';
import { Icon } from '@ui/components/Icon';
import type { IconName } from '@ui/components/Icon';
import { Modal } from '@ui/components/Modal';
import { text } from '@ui/components/text';
import './shop.css';

const icons: Record<string, IconName> = {
  'hand-press': 'hammer',
  'auto-press': 'factory',
  'polished-die': 'sparkles',
  workshop: 'hammer',
  factory: 'factory',
  plasma: 'zap',
  'star-core': 'star',
  efficiency: 'trend',
};
export function ShopPanel({
  catalog,
  state,
  onCommand,
  disabled,
  itemShop,
  automationControl,
}: {
  catalog: GameCatalog;
  state: Readonly<GameState>;
  onCommand: (command: GameCommand) => CommandResult;
  disabled: boolean;
  itemShop?: ReactNode;
  automationControl?: ReactNode;
}) {
  const format = useNumberFormat();
  const [tab, setTab] = useState<'machines' | 'upgrades' | 'items'>('machines');
  const [quantity, setQuantity] = useState<PurchaseQuantity>(1);
  const [selected, setSelected] = useState<GeneratorDefinition | UpgradeDefinition | null>(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'next' | 'all' | 'owned'>('next');
  const catalogItems = tab === 'machines' ? catalog.generators : catalog.upgrades;
  const ownedItem = (item: GeneratorDefinition | UpgradeDefinition) =>
    'baseCps' in item
      ? (state.generators[item.id] ?? 0) > 0
      : state.purchasedUpgradeIds.includes(item.id);
  let upcoming = 0;
  const items = catalogItems.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'owned') return ownedItem(item);
    if (!('baseCps' in item) && ownedItem(item)) return false;
    const unlocked =
      'baseCps' in item ? generatorUnlocked(state, item) : upgradeUnlocked(state, item);
    return unlocked || upcoming++ < 2;
  });
  const quote = (item: GeneratorDefinition | UpgradeDefinition) =>
    'baseCps' in item
      ? quoteGenerator(state, catalog, item.id, quantity)
      : quoteUpgrade(state, catalog, item.id);
  const buying = (item: GeneratorDefinition | UpgradeDefinition) => {
    const result = onCommand(
      'baseCps' in item
        ? { type: 'PurchaseGenerator', generatorId: item.id, quantity }
        : { type: 'PurchaseUpgrade', upgradeId: item.id },
    );
    setMessage(
      result.ok
        ? `${text('shop.bought')}: ${text(item.nameKey)}`
        : text(`shop.error.${result.error}`),
    );
  };
  function requirement(item: GeneratorDefinition | UpgradeDefinition) {
    if ('unlockAt' in item)
      return `${text('shop.unlockAt')} ${format(item.unlockAt)} ${text('common.coin')}`;
    const names = item.requires
      .map((id) =>
        [...catalog.generators, ...catalog.upgrades].find((required) => required.id === id),
      )
      .filter((item) => item !== undefined)
      .map((item) => text(item.nameKey));
    return names.length
      ? `${text('shop.requires')} ${names.join(', ')}`
      : text('shop.noRequirement');
  }
  const detail = selected ? quote(selected) : null;
  return (
    <aside className="shop-panel panel" aria-label={text('shop.title')}>
      <div className="panel-heading">
        <span className="panel-icon">
          <Icon name="factory" size={18} />
        </span>
        <h2>{text('shop.title')}</h2>
      </div>
      <p className="panel-description">{text('shop.subtitle')}</p>
      {automationControl}
      <div className="shop-tabs" aria-label={text('shop.title')}>
        {(['machines', 'upgrades', 'items'] as const).map((id) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {text(`shop.${id}`)}
            <span>
              {id === 'machines'
                ? catalog.generators.length
                : id === 'items'
                  ? catalog.itemOffers.length
                  : catalog.upgrades.length}
            </span>
          </button>
        ))}
      </div>
      {tab === 'machines' && (
        <div className="quantity-picker" role="group" aria-label={text('shop.quantity')}>
          {([1, 10, 100, 'max'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={quantity === value}
              onClick={() => setQuantity(value)}
            >
              {value === 'max' ? text('shop.max') : `×${value}`}
            </button>
          ))}
        </div>
      )}
      {tab === 'items' ? (
        itemShop
      ) : (
        <>
          <div className="shop-filters" role="group" aria-label={text('shop.filter')}>
            {(['next', 'all', 'owned'] as const).map((value) => (
              <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {text(`shop.filter.${value}`)}
              </button>
            ))}
          </div>
          <div className="shop-items">
            {items.map((item, index) => {
              const offer = quote(item);
              const owned =
                'baseCps' in item
                  ? (state.generators[item.id] ?? 0)
                  : state.purchasedUpgradeIds.includes(item.id)
                    ? 1
                    : 0;
              return (
                <article
                  className={`shop-card ${offer.error === 'locked' ? 'is-locked' : ''}`}
                  key={item.id}
                >
                  <button
                    className="shop-item"
                    onClick={() => setSelected(item)}
                    aria-label={`${text('shop.inspect')}: ${text(item.nameKey)}`}
                  >
                    <span className={`machine-icon machine-icon-${index}`}>
                      <Icon name={icons[item.iconId] ?? 'factory'} size={24} />
                    </span>
                    <span className="machine-info">
                      <strong>{text(item.nameKey)}</strong>
                      <span>
                        {text('shop.owned')} {format(owned)}
                      </span>
                      <span className="machine-price" title={offer.cost ?? undefined}>
                        <Icon name="coins" size={12} />
                        {offer.cost ? format(offer.cost) : '—'} <small>{text('common.coin')}</small>
                      </span>
                    </span>
                    <Icon
                      className="item-chevron"
                      name={offer.error === 'locked' ? 'lock' : 'chevron'}
                      size={15}
                    />
                  </button>
                  <div className="shop-card-bottom">
                    <span title={offer.error === 'locked' ? requirement(item) : undefined}>
                      {offer.error === 'locked'
                        ? requirement(item)
                        : offer.error === 'already-owned'
                          ? text('shop.error.already-owned')
                          : `+${format('baseCps' in item || amount.compare(offer.deltaCps, '0') > 0 ? offer.deltaCps : offer.deltaClick)} ${text('baseCps' in item || amount.compare(offer.deltaCps, '0') > 0 ? 'home.perSecond' : 'home.perClick')}`}
                    </span>
                    <button
                      className="buy-button"
                      disabled={disabled || offer.error !== null}
                      onClick={() => buying(item)}
                      title={offer.error ? text(`shop.error.${offer.error}`) : text('shop.buy')}
                      aria-label={`${text('shop.buy')} ${text(item.nameKey)} ${offer.quantity}`}
                    >
                      {offer.error === 'already-owned' ? (
                        <Icon name="check" size={14} />
                      ) : (
                        `${text('shop.buy')} ×${offer.quantity || 0}`
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
            {!items.length && <p className="shop-feedback">{text('shop.filter.empty')}</p>}
          </div>
        </>
      )}
      {tab !== 'items' && (
        <p className="shop-feedback" role="status">
          {message || text('shop.priceHint')}
        </p>
      )}
      {selected && detail && (
        <Modal
          title={text(selected.nameKey)}
          subtitle={text(selected.descriptionKey)}
          onClose={() => setSelected(null)}
        >
          <div className="item-details">
            <div>
              <span>
                {text('shop.cost')} {detail.quantity > 0 && `×${detail.quantity}`}
              </span>
              <strong title={detail.cost ?? undefined}>
                {detail.cost ? format(detail.cost) : '—'} {text('common.coin')}
              </strong>
            </div>
            <div>
              <span>{text('shop.productionGain')}</span>
              <strong>
                +{format(detail.deltaCps)} {text('home.perSecond')}
              </strong>
            </div>
            <div>
              <span>{text('shop.clickGain')}</span>
              <strong>
                +{format(detail.deltaClick)} {text('home.perClick')}
              </strong>
            </div>
            <div>
              <span>{text('shop.payback')}</span>
              <strong>
                {detail.paybackSeconds
                  ? `${format(detail.paybackSeconds)} ${text('common.seconds')}`
                  : text('shop.noPayback')}
              </strong>
            </div>
          </div>
          <p className="info-note">{requirement(selected)}</p>
          <p className="info-note">{text('shop.paybackHint')}</p>
          <button
            className="primary-button"
            disabled={disabled || detail.error !== null}
            onClick={() => buying(selected)}
          >
            {detail.error
              ? text(`shop.error.${detail.error}`)
              : `${text('shop.buy')} ×${detail.quantity}`}
          </button>
        </Modal>
      )}
    </aside>
  );
}
