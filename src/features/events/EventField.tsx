import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { DurableAction } from '@core/engine/contracts';
import { text } from '@ui/components/text';
import { GoldArtwork } from '@ui/components/GoldArtwork';
import { Coin3D } from '@ui/coins/Coin3D';
import './events.css';

export function EventField({
  state,
  catalog,
  disabled,
  reducedMotion,
  onCommand,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
  disabled: boolean;
  reducedMotion: boolean;
  onCommand: DurableAction;
}) {
  const format = useNumberFormat();
  const [message, setMessage] = useState('');
  const events = state.events;
  const visible = events.objects.filter(
    (item) => item.spawnsAt <= events.activeMs && item.expiresAt > events.activeMs,
  );
  const rainActive = events.rainEndsAt !== null;
  return (
    <section
      className={`event-section ${visible.length ? 'has-event-coins' : ''} ${rainActive ? 'rain-active' : ''} ${reducedMotion ? 'events-still' : ''}`}
      aria-label={text('events.title')}
    >
      <div className="event-heading">
        <strong>
          <GoldArtwork size={22} /> {text('events.title')}
        </strong>
        <span>
          {rainActive
            ? text('events.raining')
            : `${text('events.nextRain')} ${Math.max(0, Math.ceil((events.nextRainAt - events.activeMs) / 1000))}s`}
        </span>
      </div>
      <div className="event-field">
        {!visible.length && (
          <p className="event-empty">
            {rainActive ? text('events.moreComing') : text('events.waitHint')}
          </p>
        )}
        {visible.map((object) => (
          <button
            key={object.id}
            className={`event-coin event-${object.kind}`}
            disabled={disabled}
            style={
              {
                '--coin-column': Math.min(5, Math.floor(object.x / 20) + 1),
                '--coin-lane': object.lane,
              } as CSSProperties
            }
            aria-label={`${text(object.kind === 'gold' ? 'events.collectGold' : 'events.collectRainbow')} ${object.id}`}
            onClick={() => {
              void onCommand({ type: 'CollectEvent', objectId: object.id }).then((result) => {
                const earned = result.ok
                  ? result.value.events.find((event) => event.type === 'GoldEarned')
                  : null;
                setMessage(
                  result.ok
                    ? earned?.type === 'GoldEarned'
                      ? `+${format(earned.amount)} Gold`
                      : text('events.frenzyStarted')
                    : text(`action.error.${result.error}`),
                );
              });
            }}
          >
            <Coin3D kind={object.kind} size={34} paused={disabled} reducedMotion={reducedMotion} />
            <small>{Math.ceil((object.expiresAt - events.activeMs) / 1000)}s</small>
          </button>
        ))}
      </div>
      <div className="event-footer">
        <span>
          {events.rainbowUnlocked
            ? `${text('events.nextRainbow')} ${Math.max(0, Math.ceil(((events.nextRainbowAt ?? events.activeMs) - events.activeMs) / 1000))}s`
            : `${text('events.rainbowUnlock')} ${format(catalog.events.rainbow.unlockAt)} Coin`}
        </span>
        <span role="status">
          {message || `${text('automation.eventGold')}: ${format(state.tracking.goldFromEvents)}`}
        </span>
      </div>
    </section>
  );
}
