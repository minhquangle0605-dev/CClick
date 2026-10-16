import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { DurableAction } from '@core/engine/contracts';
import { chestError } from '@core/chests/commands';
import { lootOdds } from '@core/chests/loot';
import { amount } from '@shared/amount';
import { text } from '@ui/components/text';
import { Icon } from '@ui/components/Icon';
import { rewardLabel } from '@features/rewards/reward-label';
import './chests.css';

export function ChestsPanel({
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
  const [selected, setSelected] = useState(catalog.chests[0]!.id);
  const [history, setHistory] = useState(false);
  const [message, setMessage] = useState('');
  const chest = catalog.chests.find((item) => item.id === selected)!;
  const error = chestError(state, catalog, selected);
  const result = state.chests.lastResult;
  if (result && (!state.chests.acknowledged || history))
    return (
      <section className="chest-result">
        <span className="receipt-mark">
          <Icon name="gem" size={42} />
        </span>
        <h3>
          {text('chests.result')} #{result.id}
        </h3>
        <p>{text('chests.resultSaved')}</p>
        <ul>
          {result.rewards.map((reward, index) => (
            <li key={index}>{rewardLabel(reward, catalog, undefined, format)}</li>
          ))}
        </ul>
        <small>
          {text(catalog.chests.find((chest) => chest.id === result.chestId)!.nameKey)} ·{' '}
          {new Date(result.openedAtUtc).toLocaleString('vi-VN')}
        </small>
        {!state.chests.acknowledged ? (
          <button
            className="primary-button"
            disabled={disabled}
            onClick={() => {
              void onCommand({ type: 'AcknowledgeChest', receiptId: result.id }).then((result) => {
                if (result.ok) setHistory(false);
                else setMessage(text(`action.error.${result.error}`));
              });
            }}
          >
            {text('chests.acknowledge')}
          </button>
        ) : (
          <button className="primary-button" onClick={() => setHistory(false)}>
            {text('chests.back')}
          </button>
        )}
        <p role="status">{message}</p>
      </section>
    );
  return (
    <div className="chests-panel">
      <p className="info-note">{text('chests.source')}</p>
      <div className="chest-milestone">
        <strong>{text('chests.starter')}</strong>
        <p>
          {text('chests.starterAt')} {format(catalog.unlocks.starterChestAt)} Coin ·{' '}
          {format(state.statistics.totalProducedCoin)} / {format(catalog.unlocks.starterChestAt)}
        </p>
        <button
          className="primary-button"
          disabled={
            disabled ||
            state.chests.starterClaimed ||
            amount.compare(state.statistics.totalProducedCoin, catalog.unlocks.starterChestAt) < 0
          }
          onClick={() => {
            void onCommand({ type: 'ClaimStarterChest' }).then((result) =>
              setMessage(text(result.ok ? 'chests.claimed' : `action.error.${result.error}`)),
            );
          }}
        >
          {text(state.chests.starterClaimed ? 'chests.alreadyClaimed' : 'chests.claim')}
        </button>
      </div>
      <div className="chest-inventory">
        <span>
          ✦ {text('key.star.name')}: <b>{format(state.inventory['key.star'] ?? 0)}</b>
        </span>
        <span>
          {text('chests.opened')} {format(state.chests.opened)}
        </span>
      </div>
      <div className="chest-choices">
        {catalog.chests.map((chest) => (
          <button
            key={chest.id}
            aria-pressed={selected === chest.id}
            className={chest.keyId ? 'gold-chest' : 'silver-chest'}
            onClick={() => {
              setSelected(chest.id);
              setMessage('');
            }}
          >
            <Icon name="gem" size={36} />
            <strong>{text(chest.nameKey)}</strong>
            <span>
              {text('shop.owned')} {format(state.inventory[chest.id] ?? 0)}
            </span>
            <small>{text(chest.descriptionKey)}</small>
          </button>
        ))}
      </div>
      <section className="chest-preview">
        <h3>
          {text('chests.preview')} · {text(chest.nameKey)}
        </h3>
        <p>
          {text('chests.openCost')} 1 {text(chest.nameKey)}
          {chest.keyId
            ? ` + 1 ${text(catalog.keys.find((key) => key.id === chest.keyId)!.nameKey)}`
            : ` · ${text('chests.noKey')}`}
        </p>
        <h4>{text('chests.guaranteed')}</h4>
        <ul>
          {chest.guaranteed.map((reward, index) => (
            <li key={index}>{rewardLabel(reward, catalog, state, format)}</li>
          ))}
        </ul>
        {chest.draws.map((draw) => {
          const table = catalog.lootTables.find((table) => table.id === draw.tableId)!;
          return (
            <details key={draw.tableId} className="loot-table">
              <summary>
                {text('chests.rolls')} {draw.count} · {text('chests.viewOdds')}
              </summary>
              <table>
                <thead>
                  <tr>
                    <th>{text('chests.reward')}</th>
                    <th>{text('chests.probability')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lootOdds(table).map((entry, index) => (
                    <tr key={index}>
                      <td>{rewardLabel(entry.reward, catalog, state, format)}</td>
                      <td>
                        {(entry.probability * 100).toLocaleString('vi-VN', {
                          maximumFractionDigits: 2,
                        })}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          );
        })}
        <p className="info-note">{text('chests.duplicatesRule')}</p>
        <button
          className="primary-button"
          disabled={disabled || error !== null}
          onClick={() => {
            void onCommand({ type: 'OpenChest', chestId: selected }).then((result) => {
              if (!result.ok) setMessage(text(`action.error.${result.error}`));
            });
          }}
        >
          {error ? text(`action.error.${error}`) : `${text('chests.open')} ${text(chest.nameKey)}`}
        </button>
      </section>
      {result && (
        <button className="primary-button history-button" onClick={() => setHistory(true)}>
          {text('chests.lastResult')}
        </button>
      )}
      <p role="status" className="action-message">
        {message}
      </p>
    </div>
  );
}
