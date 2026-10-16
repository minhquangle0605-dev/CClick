import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import { text } from '@ui/components/text';
import './reset.css';

export function ResetPanel({
  state,
  disabled,
  onReset,
  onDone,
  onExport,
}: {
  state: Readonly<GameState>;
  disabled: boolean;
  onReset: (confirmation: string, runId: string) => Promise<void>;
  onDone: () => void;
  onExport: () => Promise<void>;
}) {
  const format = useNumberFormat();
  const [confirmation, setConfirmation] = useState('');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <section className="reset-panel">
      <p className="info-note">{text('reset.rules')}</p>
      <dl>
        <dt>{text('stats.produced')}</dt>
        <dd>{format(state.statistics.totalProducedCoin)} Coin</dd>
        <dt>{text('stats.cards')}</dt>
        <dd>{Object.keys(state.cards.owned).length}</dd>
        <dt>{text('stats.chests')}</dt>
        <dd>{format(state.chests.opened)}</dd>
      </dl>
      <ul>
        {['wallet', 'collection', 'progress'].map((id) => (
          <li key={id}>{text(`reset.remove.${id}`)}</li>
        ))}
      </ul>
      <p>{text('reset.keep')}</p>
      <p>{text('reset.backupRule')}</p>
      <button
        className="primary-button"
        disabled={disabled || working}
        onClick={() => {
          setWorking(true);
          void onExport()
            .then(() => setMessage(text('saveTools.exported')))
            .catch(() => setMessage(text('saveTools.failure')))
            .finally(() => setWorking(false));
        }}
      >
        {text('reset.export')}
      </button>
      <label className="reset-label">
        {text('reset.type')}
        <input
          value={confirmation}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || working}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>
      <button
        className="danger-button"
        disabled={disabled || working || confirmation !== 'RESET'}
        onClick={() => {
          setWorking(true);
          void onReset(confirmation, state.runId)
            .then(onDone)
            .catch(() => {
              setMessage(text('reset.failure'));
              setWorking(false);
            });
        }}
      >
        {text('reset.confirm')}
      </button>
      <p role="alert">{message}</p>
    </section>
  );
}
