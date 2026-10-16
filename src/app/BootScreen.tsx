import { useNumberFormat } from '@ui/components/number-format';
import { useState } from 'react';
import { SaveReadError } from '@platform/storage/save-codec';
import { text } from '@ui/components/text';
import './app.css';
import {
  readRecoveryFile,
  recoverFromFile,
  exportRecoverableSave,
  readResetBackupForRecovery,
} from './recovery';
import { downloadJson } from '@platform/storage/save-file';
import type { SaveEnvelope } from '@core/state/game-state';

export function BootScreen({ error, onRetry }: { error?: unknown; onRetry?: () => Promise<void> }) {
  const format = useNumberFormat();
  const [retrying, setRetrying] = useState(false);
  const [candidate, setCandidate] = useState<SaveEnvelope | null>(null);
  const [fileError, setFileError] = useState(false);
  const message =
    error instanceof SaveReadError
      ? text(`boot.${error.code}`)
      : error instanceof Error
        ? error.message
        : text('boot.generic');
  return (
    <main className="boot-screen">
      <span className="brand-symbol">✦</span>
      <h1>Coin Clicker</h1>
      {error ? (
        <>
          <h2>{text('boot.error')}</h2>
          <p role="alert">{message}</p>
          <p>{text('boot.preserved')}</p>
          <button
            disabled={retrying}
            onClick={() => {
              setRetrying(true);
              void onRetry?.().finally(() => setRetrying(false));
            }}
          >
            {text('save.retry')}
          </button>
          <div className="boot-recovery">
            {error instanceof SaveReadError && error.code === 'invalid' && (
              <button
                disabled={retrying}
                onClick={() => {
                  setRetrying(true);
                  setCandidate(null);
                  setFileError(false);
                  void readResetBackupForRecovery()
                    .then(setCandidate)
                    .catch(() => setFileError(true))
                    .finally(() => setRetrying(false));
                }}
              >
                {text('boot.previewResetBackup')}
              </button>
            )}
            <button
              disabled={retrying}
              onClick={() => {
                setRetrying(true);
                setFileError(false);
                void exportRecoverableSave()
                  .then((save) => downloadJson(save, 'coin-clicker-recovery'))
                  .catch(() => setFileError(true))
                  .finally(() => setRetrying(false));
              }}
            >
              {text('boot.exportExisting')}
            </button>
            <p>{text('boot.exportHint')}</p>
            <p>{text('boot.importHint')}</p>
            <input
              type="file"
              accept=".json,application/json"
              disabled={retrying}
              aria-label={text('saveTools.import')}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                setCandidate(null);
                setFileError(false);
                if (file) {
                  setRetrying(true);
                  void readRecoveryFile(file)
                    .then(setCandidate)
                    .catch(() => setFileError(true))
                    .finally(() => setRetrying(false));
                }
              }}
            />
            {candidate && (
              <div>
                <p>
                  {format(candidate.payload.wallet.coin)} {text('common.coin')} ·{' '}
                  {new Date(candidate.savedAtUtc).toLocaleString('vi-VN')}
                </p>
                <p>{text('boot.restoreHint')}</p>
                <button
                  disabled={retrying}
                  onClick={() => {
                    setRetrying(true);
                    setFileError(false);
                    void recoverFromFile(candidate)
                      .then(() => onRetry?.())
                      .catch(() => setFileError(true))
                      .finally(() => setRetrying(false));
                  }}
                >
                  {text('saveTools.confirm')}
                </button>
              </div>
            )}
            {fileError && <p role="alert">{text('saveTools.failure')}</p>}
          </div>
        </>
      ) : (
        <p role="status">{text('boot.loading')}</p>
      )}
    </main>
  );
}
