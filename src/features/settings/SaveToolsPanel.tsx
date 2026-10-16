import { useNumberFormat } from '@ui/components/number-format';
import { useEffect, useState } from 'react';
import type { SaveEnvelope } from '@core/state/game-state';
import { text } from '@ui/components/text';

export function SaveToolsPanel({
  busy,
  onExport,
  onReadFile,
  onRestore,
  onListBackups,
  onDiagnostic,
}: {
  busy: boolean;
  onExport: () => Promise<void>;
  onReadFile: (file: File) => Promise<SaveEnvelope>;
  onRestore: (save: SaveEnvelope) => Promise<void>;
  onListBackups: () => Promise<Array<{ id: string; envelope: SaveEnvelope }>>;
  onDiagnostic: () => Promise<boolean>;
}) {
  const format = useNumberFormat();
  const [backups, setBackups] = useState<Array<{ id: string; envelope: SaveEnvelope }>>([]);
  const [candidate, setCandidate] = useState<SaveEnvelope | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void onListBackups()
      .then((list) => {
        if (active) setBackups(list);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setMessage(text('saveTools.readError'));
        }
      });
    return () => {
      active = false;
    };
  }, [onListBackups]);
  async function run(action: () => Promise<void>, success?: string) {
    setWorking(true);
    setError(false);
    setMessage('');
    try {
      await action();
      if (success) setMessage(text(success));
    } catch {
      setError(true);
      setMessage(text('saveTools.failure'));
    } finally {
      setWorking(false);
    }
  }
  return (
    <section className="save-tools" aria-label={text('saveTools.title')}>
      <h3>{text('saveTools.title')}</h3>
      <p>{text('saveTools.description')}</p>
      <div className="save-tools-actions">
        <button
          disabled={busy || working}
          onClick={() => {
            void run(onExport, 'saveTools.exported');
          }}
        >
          {text('saveTools.export')}
        </button>
        <label className="import-label">
          {text('saveTools.import')}
          <input
            type="file"
            accept=".json,application/json"
            disabled={busy || working}
            aria-label={text('saveTools.import')}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              setCandidate(null);
              if (file)
                void run(async () => {
                  setCandidate(await onReadFile(file));
                });
            }}
          />
        </label>
      </div>
      <h4>{text('saveTools.backups')}</h4>
      {backups.length ? (
        <ul className="backup-list">
          {backups.map(({ id, envelope }) => (
            <li key={id}>
              <span>
                {id === 'reset-backup' && <strong>{text('reset.backupName')}</strong>}
                {new Date(envelope.savedAtUtc).toLocaleString('vi-VN')}
                <small>
                  {format(envelope.payload.wallet.coin)} {text('common.coin')}
                </small>
              </span>
              <button
                disabled={busy || working}
                onClick={() => {
                  setCandidate(envelope);
                  setMessage('');
                }}
              >
                {text('saveTools.preview')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{text('saveTools.noBackups')}</p>
      )}
      {candidate && (
        <div className="import-preview">
          <h4>{text('saveTools.previewTitle')}</h4>
          <p>
            {format(candidate.payload.wallet.coin)} {text('common.coin')} ·{' '}
            {format(
              Object.values(candidate.payload.generators).reduce((sum, value) => sum + value, 0),
            )}{' '}
            {text('saveTools.machines')}
          </p>
          <p>{new Date(candidate.savedAtUtc).toLocaleString('vi-VN')}</p>
          <p>
            {text('stats.cards')}: {Object.keys(candidate.payload.cards.owned).length} ·{' '}
            {text('stats.chests')}: {candidate.payload.chests.opened}
          </p>
          <p>
            {text('stats.daily')}: {candidate.payload.daily.claimCount} ·{' '}
            {text('achievements.claimed')}: {candidate.payload.achievements.claimedIds.length}
          </p>
          <p>{text('saveTools.replaceHint')}</p>
          <button
            className="primary-button"
            disabled={busy || working}
            onClick={() => {
              void run(async () => {
                await onRestore(candidate);
                setCandidate(null);
                setBackups(await onListBackups());
              }, 'saveTools.restored');
            }}
          >
            {text('saveTools.confirm')}
          </button>
          <button disabled={busy || working} onClick={() => setCandidate(null)}>
            {text('common.cancel')}
          </button>
        </div>
      )}
      <button
        className="diagnostic-button"
        disabled={busy || working}
        onClick={() => {
          void run(async () => {
            setMessage(
              text((await onDiagnostic()) ? 'saveTools.exported' : 'saveTools.noDiagnostic'),
            );
          });
        }}
      >
        {text('saveTools.diagnostic')}
      </button>
      <p role={error ? 'alert' : 'status'}>{message}</p>
    </section>
  );
}
