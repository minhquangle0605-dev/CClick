import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { inventoryDefinitions } from '@core/catalog/inventory';
import { itemTotals } from '@core/statistics/item-history';
import { itemSources, itemUses } from '@core/statistics/item-history.types';
import { ItemArtwork } from '@ui/components/ItemArtwork';
import { text } from '@ui/components/text';
import { useNumberFormat } from '@ui/components/number-format';

export function ItemStatisticsList({
  state,
  catalog,
  kind,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
  kind: 'items' | 'cards';
}) {
  const [filter, setFilter] = useState('');
  const items = kind === 'cards' ? catalog.cards : inventoryDefinitions(catalog);
  const matches = items.filter((item) =>
    text(item.nameKey).toLocaleLowerCase('vi').includes(filter.trim().toLocaleLowerCase('vi')),
  );
  const complete = state.itemHistory.complete;
  const number = useNumberFormat();
  return (
    <div className="item-statistics">
      <p className="item-stats-intro">{text('itemStats.scope')}</p>
      {!complete && (
        <p className="item-stats-legacy" role="note">
          {text('itemStats.legacy')}
        </p>
      )}
      <div className="item-stats-toolbar">
        <label>
          {text('itemStats.search')}
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={text('itemStats.searchPlaceholder')}
          />
        </label>
        <span>
          {matches.length} / {items.length}{' '}
          {text(kind === 'cards' ? 'itemStats.cardTypes' : 'itemStats.itemTypes')}
        </span>
      </div>
      <ul className="item-stat-list">
        {matches.map((item) => {
          const total = itemTotals(state, item.id);
          const card = state.cards.owned[item.id];
          const name = text(item.nameKey);
          return (
            <li key={item.id}>
              <details className="item-stat-row" data-item-id={item.id}>
                <summary>
                  <ItemArtwork id={item.id} label={name} />
                  <span className="item-stat-name">
                    <strong>{name}</strong>
                    <small>
                      {kind === 'cards'
                        ? card
                          ? `${text('cards.level')} ${card.level} · ${number(card.duplicates)} ${text('itemStats.duplicates')}`
                          : text('itemStats.notOwned')
                        : text(`itemStats.type.${item.id.split('.')[0]}`)}
                    </small>
                    <span className="item-stat-expand">
                      {text('itemStats.detail')} <span aria-hidden="true">⌄</span>
                    </span>
                  </span>
                  <span className="item-stat-numbers">
                    <span>
                      <small>{text('itemStats.earned')}</small>
                      <strong>
                        {complete ? '' : '≥ '}
                        {number(total.earnedTotal)}
                      </strong>
                    </span>
                    <span>
                      <small>{text('itemStats.spent')}</small>
                      <strong>
                        {complete ? '' : '≥ '}
                        {number(total.spentTotal)}
                      </strong>
                    </span>
                    <span>
                      <small>{text('itemStats.remaining')}</small>
                      <strong>{number(total.remaining)}</strong>
                    </span>
                  </span>
                </summary>
                <div className="item-stat-detail">
                  <p>{text(item.descriptionKey)}</p>
                  {kind === 'cards' && (
                    <p className="item-stat-explainer">{text('itemStats.cardRule')}</p>
                  )}
                  <div className="item-stat-breakdown">
                    <section>
                      <h4>{text('itemStats.sources')}</h4>
                      <dl>
                        {itemSources.map((source) => (
                          <div key={source}>
                            <dt>{text(`itemStats.source.${source}`)}</dt>
                            <dd>{number(total.earned[source] ?? 0)}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                    <section>
                      <h4>{text('itemStats.uses')}</h4>
                      <dl>
                        {(kind === 'cards'
                          ? itemUses.filter((use) => use === 'upgrade' || use === 'converted')
                          : item.id.startsWith('booster.')
                            ? ['activated']
                            : item.id.startsWith('chest.')
                              ? ['opened']
                              : ['key']
                        ).map((use) => (
                          <div key={use}>
                            <dt>{text(`itemStats.use.${use}`)}</dt>
                            <dd>{number(total.spent[use as (typeof itemUses)[number]] ?? 0)}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  </div>
                  {!complete && (
                    <p className="item-stat-opening">
                      {text('itemStats.opening')}: <strong>{number(total.opening)}</strong> ·{' '}
                      {text('itemStats.recordedReceived')}:{' '}
                      <strong>{number(total.received)}</strong> · {text('itemStats.recordedSpent')}:{' '}
                      <strong>{number(total.spentTotal)}</strong>
                    </p>
                  )}
                  <small className="item-stat-since">
                    {text(complete ? 'itemStats.sinceStart' : 'itemStats.sinceCheckpoint')}{' '}
                    {new Date(state.itemHistory.sinceUtc).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}{' '}
                    (VN)
                  </small>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      {!matches.length && <p className="item-stat-empty">{text('itemStats.noResults')}</p>}
    </div>
  );
}
