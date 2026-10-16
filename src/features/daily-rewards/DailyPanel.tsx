import { useNumberFormat } from '@ui/components/number-format';
import { useEffect, useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { DurableAction } from '@core/engine/contracts';
import { dailyStatus } from '@core/daily-rewards/calendar';
import { rewardLabel } from '@features/rewards/reward-label';
import { text } from '@ui/components/text';
import { Icon } from '@ui/components/Icon';
import './daily.css';

function countdown(seconds: number) {
  const days = Math.floor(seconds / 86400);
  return (
    (days ? `${days} ${text('daily.days')} ` : '') +
    [Math.floor((seconds % 86400) / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
      .map((n) => String(n).padStart(2, '0'))
      .join(':')
  );
}
export function DailyPanel({
  state,
  catalog,
  disabled,
  onCommand,
  nowUtc,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
  disabled: boolean;
  onCommand: DurableAction;
  nowUtc: () => string;
}) {
  const format = useNumberFormat();
  const [now, setNow] = useState(nowUtc);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = window.setInterval(() => setNow(nowUtc()), 1000);
    return () => window.clearInterval(timer);
  }, [nowUtc]);
  const status = dailyStatus(state.daily, now);
  const completed = state.daily.claimCount % 7;
  return (
    <section className="daily-panel">
      <p className="info-note">{text('daily.rules')}</p>
      <div className="daily-summary">
        <Icon name="clock" size={28} />
        <div>
          <strong>
            {text(
              status.available
                ? 'daily.ready'
                : status.rollback
                  ? 'daily.rollback'
                  : 'daily.received',
            )}
          </strong>
          <p>
            {text('daily.total')} {format(state.daily.claimCount)} · {text('daily.cycle')}{' '}
            {Math.floor(state.daily.claimCount / 7) + 1}
          </p>
          {!status.available && (
            <p>
              {text('daily.countdown')} <b>{countdown(status.secondsRemaining)}</b>
            </p>
          )}
        </div>
      </div>
      <div className="daily-grid">
        {catalog.dailyRewards.map((day, index) => (
          <article
            key={day.day}
            className={
              day.day === status.nextReward ? 'daily-next' : index < completed ? 'daily-done' : ''
            }
          >
            <span>
              {text('daily.claimNumber')} {day.day}
            </span>
            <Icon name={day.day === 7 ? 'gem' : index < completed ? 'check' : 'star'} size={27} />
            <ul>
              {day.rewards.map((reward, index) => (
                <li key={index}>{rewardLabel(reward, catalog, state, format)}</li>
              ))}
            </ul>
            <small>
              {text(
                day.day === status.nextReward
                  ? 'daily.next'
                  : index < completed
                    ? 'daily.done'
                    : 'daily.future',
              )}
            </small>
          </article>
        ))}
      </div>
      <button
        className="primary-button"
        disabled={disabled || !status.available}
        onClick={() => {
          void onCommand({ type: 'ClaimDaily' }).then((result) => {
            setMessage(text(result.ok ? 'daily.saved' : `action.error.${result.error}`));
            setNow(nowUtc());
          });
        }}
      >
        {text(status.available ? 'daily.claim' : 'daily.wait')}
      </button>
      <p role="status" className="action-message">
        {message}
      </p>
    </section>
  );
}
