import { useNumberFormat, type NumberFormatter } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { DurableAction } from '@core/engine/contracts';
import type { CardTarget } from '@core/cards/card.types';
import {
  cardSlots,
  activeSynergies,
  offlineEfficiency,
  cardBonuses,
  eventCatalog,
} from '@core/cards/selectors';
import { previewCardUpgrade, changeCard } from '@core/cards/commands';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { amount } from '@shared/amount';
import { text } from '@ui/components/text';
import { Icon } from '@ui/components/Icon';
import './cards.css';

function displayEffect(target: CardTarget, value: string, format: NumberFormatter) {
  return format(
    target === 'offlineBonus' || target === 'rainbowWaitReduction'
      ? amount.multiply(value, '100')
      : value,
  );
}

export function CardsPanel({
  state,
  catalog,
  disabled,
  onCommand,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
  disabled: boolean;
  onCommand: DurableAction;
}) {
  const format = useNumberFormat();
  const [selected, setSelected] = useState(catalog.cards[0]!.id);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const card = catalog.cards.find((item) => item.id === selected)!;
  const owned = state.cards.owned[selected];
  const equipped = state.cards.equipped.includes(selected);
  const upgrade = previewCardUpgrade(state, catalog, selected);
  const equipCommand = {
    type: equipped ? ('UnequipCard' as const) : ('EquipCard' as const),
    cardId: selected,
  };
  const equipPreview = changeCard(state, catalog, equipCommand);
  const next = equipPreview.ok ? equipPreview.value.state : state;
  const bonuses = cardBonuses(state, catalog);
  const nextBonuses = cardBonuses(next, catalog);
  const synergies = activeSynergies(state, catalog);
  const nextSynergies = activeSynergies(next, catalog);
  const beforeEvents = eventCatalog(state, catalog).events;
  const afterEvents = eventCatalog(next, catalog).events;
  return (
    <div className="cards-panel">
      <p className="info-note">{text('cards.rules')}</p>
      <div className="equipment-bar">
        <strong>
          {text('cards.slots')} {state.cards.equipped.length}/{cardSlots(state, catalog)}
        </strong>
        <span>
          {text('cards.thirdSlot')} {format(catalog.unlocks.thirdCardSlotAt)} Coin
        </span>
      </div>
      <div className="equipped-slots">
        {Array.from({ length: cardSlots(state, catalog) }, (_, index) => {
          const id = state.cards.equipped[index];
          const card = catalog.cards.find((item) => item.id === id);
          return (
            <button key={index} disabled={!card} onClick={() => card && setSelected(card.id)}>
              {card ? text(card.nameKey) : text('cards.emptySlot')}
            </button>
          );
        })}
      </div>
      <div className="collection-filters" role="group" aria-label={text('cards.filter')}>
        {['all', 'owned', 'common', 'rare', 'epic'].map((filterId) => (
          <button
            key={filterId}
            aria-pressed={filter === filterId}
            onClick={() => setFilter(filterId)}
          >
            {text(`cards.${filterId}`)}
          </button>
        ))}
      </div>
      <div className="card-grid">
        {catalog.cards
          .filter(
            (item) =>
              filter === 'all' ||
              (filter === 'owned' && state.cards.owned[item.id]) ||
              item.rarity === filter,
          )
          .map((item) => {
            const progress = state.cards.owned[item.id];
            return (
              <button
                key={item.id}
                className={`technology-card rarity-${item.rarity} ${progress ? '' : 'card-locked'}`}
                aria-pressed={selected === item.id}
                onClick={() => {
                  setSelected(item.id);
                  setMessage('');
                }}
              >
                <span className="card-emblem">
                  <Icon
                    name={
                      item.rarity === 'epic'
                        ? 'star'
                        : item.rarity === 'rare'
                          ? 'sparkles'
                          : 'cards'
                    }
                    size={25}
                  />
                </span>
                <small>{text(`cards.${item.rarity}`)}</small>
                <strong>{text(item.nameKey)}</strong>
                <span>
                  {progress
                    ? `${text('cards.level')} ${progress.level}/10 · ${text('cards.duplicates')} ${format(progress.duplicates)}`
                    : text('cards.notOwned')}
                </span>
                {state.cards.equipped.includes(item.id) && <b>{text('cards.equipped')}</b>}
              </button>
            );
          })}
      </div>
      <section className="card-detail">
        <h3>{text(card.nameKey)}</h3>
        <p>{text(card.descriptionKey)}</p>
        <p className="info-note">{text('cards.timerRule')}</p>
        <ul className="card-effects">
          {card.effects.map((effect) => (
            <li key={effect.target}>
              {text(`cards.target.${effect.target}`)}:{' '}
              <strong>
                +
                {displayEffect(
                  effect.target,
                  amount.multiply(effect.valuePerLevel, String(owned?.level ?? 1)),
                  format,
                )}
              </strong>
              {owned && owned.level < 10 && (
                <>
                  {' '}
                  →{' '}
                  <strong>
                    {displayEffect(
                      effect.target,
                      amount.multiply(effect.valuePerLevel, String(owned.level + 1)),
                      format,
                    )}
                  </strong>{' '}
                  {text('cards.nextLevel')}
                </>
              )}
            </li>
          ))}
        </ul>
        {!owned ? (
          <p className="info-note">{text('cards.source')}</p>
        ) : (
          <>
            <div className="equipment-preview">
              <h4>{text('cards.equipPreview')}</h4>
              {[
                [
                  text('cards.production'),
                  productionPerSecond(state, catalog),
                  productionPerSecond(next, catalog),
                ],
                [text('cards.click'), clickPower(state, catalog), clickPower(next, catalog)],
                [
                  text('cards.offline'),
                  amount.multiply(offlineEfficiency(state, catalog), '100'),
                  amount.multiply(offlineEfficiency(next, catalog), '100'),
                ],
                [text('cards.target.goldFlat'), bonuses.goldFlat, nextBonuses.goldFlat],
                [
                  text('cards.rainDuration'),
                  String(beforeEvents.rain.durationSeconds),
                  String(afterEvents.rain.durationSeconds),
                ],
                [
                  text('cards.rainLifetime'),
                  String(beforeEvents.rain.coinLifetimeSeconds),
                  String(afterEvents.rain.coinLifetimeSeconds),
                ],
                [
                  text('cards.rainbowWait'),
                  String(beforeEvents.rainbow.waitMinSeconds),
                  String(afterEvents.rainbow.waitMinSeconds),
                ],
                [
                  text('cards.frenzyDuration'),
                  String(beforeEvents.rainbow.frenzySeconds),
                  String(afterEvents.rainbow.frenzySeconds),
                ],
              ].map(([label, before, after]) => (
                <p key={label}>
                  <span>{label}</span>
                  <strong>
                    {format(before!)} → {format(after!)}
                  </strong>
                </p>
              ))}
              <small>
                {text('cards.combosAfter')}{' '}
                {nextSynergies.map((synergy) => text(synergy.nameKey)).join(', ') ||
                  text('cards.noCombo')}
              </small>
            </div>
            <button
              className="primary-button"
              disabled={disabled || !equipPreview.ok}
              onClick={() => {
                void onCommand(equipCommand).then((result) =>
                  setMessage(text(result.ok ? 'cards.saved' : `action.error.${result.error}`)),
                );
              }}
            >
              {!equipPreview.ok
                ? text(`action.error.${equipPreview.error}`)
                : text(equipped ? 'cards.unequip' : 'cards.equip')}
            </button>
            <div className="upgrade-preview">
              <h4>{text('cards.upgrade')}</h4>
              {owned.level < 10 ? (
                <>
                  <p>
                    {text('cards.cost')} <strong>{upgrade.duplicates}</strong>{' '}
                    {text('cards.duplicates')} + <strong>{format(upgrade.coin)} Coin</strong> →{' '}
                    {text('cards.level')} {upgrade.nextLevel}
                  </p>
                  {upgrade.convertedGold !== '0' && (
                    <p>
                      {text('cards.convertRemaining')} {format(upgrade.convertedGold)} Gold
                    </p>
                  )}
                  <button
                    className="primary-button"
                    disabled={disabled || upgrade.error !== null}
                    onClick={() => {
                      void onCommand({ type: 'UpgradeCard', cardId: selected }).then((result) =>
                        setMessage(
                          text(result.ok ? 'cards.upgraded' : `action.error.${result.error}`),
                        ),
                      );
                    }}
                  >
                    {upgrade.error
                      ? text(`action.error.${upgrade.error}`)
                      : text('cards.confirmUpgrade')}
                  </button>
                </>
              ) : (
                <p>
                  {text('cards.maxHint')} {catalog.cardProgression.maxDuplicateGold[card.rarity]}{' '}
                  Gold/{text('cards.copy')}
                </p>
              )}
              <p>
                {text('cards.convertedTotal')} {format(owned.convertedGold)} Gold
              </p>
            </div>
          </>
        )}
      </section>
      <section className="synergy-list">
        <h3>{text('cards.combos')}</h3>
        {catalog.cardSynergies.map((synergy) => (
          <article
            key={synergy.id}
            className={synergies.some((item) => item.id === synergy.id) ? 'synergy-active' : ''}
          >
            <strong>{text(synergy.nameKey)}</strong>
            <small>
              {synergy.requires
                .map((id) => text(catalog.cards.find((item) => item.id === id)!.nameKey))
                .join(' + ')}
            </small>
            <span>
              {synergy.effects
                .map(
                  (effect) => `${text(`cards.target.${effect.target}`)} +${format(effect.value)}`,
                )
                .join(', ')}{' '}
              ·{' '}
              {text(
                synergies.some((item) => item.id === synergy.id)
                  ? 'cards.active'
                  : 'cards.inactive',
              )}
            </span>
          </article>
        ))}
      </section>
      <p role="status" className="action-message">
        {message}
      </p>
    </div>
  );
}
