import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { DurableAction } from '@core/engine/contracts';
import { previewBooster } from '@core/boosters/use-booster';
import { temporaryMultiplier } from '@core/effects/pipeline';
import { text } from '@ui/components/text';
import { ItemArtwork } from '@ui/components/ItemArtwork';
import { formatEffectDuration } from './format-effect-duration';
import './boosters.css';

export function BoostersPanel({
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
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const item = catalog.boosters.find((item) => item.id === selected);
  const preview = item ? previewBooster(state, catalog, item.id) : null;
  return (
    <div className="boosters-panel">
      <p className="info-note">{text('boosters.source')}</p>
      <div className="booster-grid">
        {catalog.boosters.map((item) => (
          <button
            className="booster-card"
            key={item.id}
            aria-pressed={selected === item.id}
            onClick={() => {
              setSelected(item.id);
              setMessage('');
            }}
          >
            <ItemArtwork id={item.id} size={88} />
            <strong>{text(item.nameKey)}</strong>
            <span>
              {text('shop.owned')} {format(state.inventory[item.id] ?? 0)}
            </span>
            <small>{text(item.descriptionKey)}</small>
          </button>
        ))}
      </div>
      {item && preview && (
        <div className="booster-preview">
          <ItemArtwork id={item.id} size={120} className="artwork-detail" />
          <h3>
            {text('boosters.preview')} · {text(item.nameKey)}
          </h3>
          <p>
            {item.warpSeconds ? (
              <>
                <strong title={preview.reward}>+{format(preview.reward)} Coin</strong>
                <br />
                {text('boosters.warpRule')}
              </>
            ) : (
              <>
                {text('boosters.duration')}{' '}
                <strong>{formatEffectDuration(preview.remainingSeconds)}</strong>
              </>
            )}
          </p>
          <p className="info-note">{text('boosters.offlineRule')}</p>
          <button
            className="primary-button"
            disabled={disabled || preview.error !== null}
            onClick={() => {
              void onCommand({ type: 'UseBooster', itemId: item.id }).then((result) =>
                setMessage(text(result.ok ? 'boosters.used' : `action.error.${result.error}`)),
              );
            }}
          >
            {preview.error ? text(`action.error.${preview.error}`) : text('boosters.confirm')}
          </button>
        </div>
      )}
      <p role="status" className="action-message">
        {message}
      </p>
    </div>
  );
}

export function EffectsBar({
  state,
  catalog,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
}) {
  const sources = [
    ...new Set(
      state.effects
        .filter((effect) => effect.expiresAt > state.effectsAtMs)
        .map((effect) => effect.sourceId),
    ),
  ];
  const capped = (['production', 'click', 'gold'] as const).some(
    (target) =>
      temporaryMultiplier(state.effects, target, state.effectsAtMs, catalog.events.temporaryCap)
        .capped,
  );
  return (
    <div className="effects-bar" aria-label={text('boosters.active')}>
      {sources.length ? (
        sources.map((id) => {
          const effects = state.effects.filter((effect) => effect.sourceId === id);
          const remaining =
            Math.max(...effects.map((effect) => effect.expiresAt)) - state.effectsAtMs;
          const item = catalog.boosters.find((item) => item.id === id);
          return (
            <span
              className={id === 'event.frenzy' ? 'effect-chip frenzy-chip' : 'effect-chip'}
              key={id}
            >
              <ItemArtwork id={id === 'event.frenzy' ? 'coin.rainbow' : id} size={28} />
              {id === 'event.frenzy' ? text('events.frenzy') : text(item?.nameKey ?? id)}{' '}
              <b>{formatEffectDuration(remaining / 1000)}</b>
            </span>
          );
        })
      ) : (
        <span className="effects-empty">{text('boosters.noneActive')}</span>
      )}
      {capped && (
        <span className="effect-chip">
          {text('boosters.capped')} ×{catalog.events.temporaryCap}
        </span>
      )}
    </div>
  );
}
