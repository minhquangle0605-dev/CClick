import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { DurableAction } from '@core/engine/contracts';
import { achievementStatus } from '@core/achievements/selectors';
import { rewardLabel } from '@features/rewards/reward-label';
import { text } from '@ui/components/text';
import { Icon } from '@ui/components/Icon';
import './achievements.css';

export function AchievementsPanel({
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
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const rows = catalog.achievements.map((definition) => ({
    definition,
    ...achievementStatus(state, definition),
  }));
  return (
    <section className="achievements-panel">
      <p className="info-note">{text('achievements.rules')}</p>
      <p>
        {text('achievements.completed')} {rows.filter((row) => row.unlocked).length}/{rows.length} ·{' '}
        {text('achievements.claimed')} {state.achievements.claimedIds.length}
      </p>
      <div className="collection-filters" role="group" aria-label={text('achievements.filter')}>
        {['all', 'ready', 'locked', 'claimed'].map((id) => (
          <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {text(`achievements.${id}`)}
          </button>
        ))}
      </div>
      <p role="status" className="action-message">
        {message}
      </p>
      <div className="achievement-list">
        {rows
          .filter(
            (row) =>
              filter === 'all' ||
              (filter === 'ready' && row.ready) ||
              (filter === 'locked' && !row.unlocked) ||
              (filter === 'claimed' && row.claimed),
          )
          .map((row) => (
            <article className={row.ready ? 'achievement-ready' : ''} key={row.definition.id}>
              <div className="achievement-heading">
                <Icon name={row.claimed ? 'check' : 'trophy'} size={23} />
                <h3>{text(row.definition.nameKey)}</h3>
              </div>
              <p>
                {text(`achievements.metric.${row.definition.metric}`)}:{' '}
                <b>
                  {format(row.value)} / {format(row.definition.target)}
                </b>
              </p>
              <progress aria-label={text(row.definition.nameKey)} value={row.percent} max={100} />
              <ul>
                {row.definition.rewards.map((reward, index) => (
                  <li key={index}>{rewardLabel(reward, catalog, state, format)}</li>
                ))}
              </ul>
              <button
                className="primary-button"
                disabled={disabled || !row.ready}
                onClick={() => {
                  void onCommand({
                    type: 'ClaimAchievement',
                    achievementId: row.definition.id,
                  }).then((result) =>
                    setMessage(
                      text(result.ok ? 'achievements.saved' : `action.error.${result.error}`),
                    ),
                  );
                }}
                aria-label={`${text('achievements.claim')} ${text(row.definition.nameKey)}`}
              >
                {text(
                  row.claimed
                    ? 'achievements.claimed'
                    : row.ready
                      ? 'achievements.claim'
                      : 'achievements.locked',
                )}
              </button>
            </article>
          ))}
      </div>
      {!rows.some(
        (row) =>
          filter === 'all' ||
          (filter === 'ready' && row.ready) ||
          (filter === 'locked' && !row.unlocked) ||
          (filter === 'claimed' && row.claimed),
      ) && <p className="info-note">{text('achievements.empty')}</p>}
    </section>
  );
}
