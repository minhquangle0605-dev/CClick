import { useNumberFormat } from '@ui/components/number-format';
import type { OfflineSummary } from '@core/offline/settle-offline';
import { text } from '@ui/components/text';
export function OfflineNotice({
  summary,
  recovered,
  onClose,
}: {
  summary: OfflineSummary | null;
  recovered: boolean;
  onClose: () => void;
}) {
  const format = useNumberFormat();
  return (
    <section className="offline-notice" aria-label={text('offline.title')}>
      <div>
        <strong>{text('offline.title')}</strong>
        {summary && (
          <p>
            {summary.clockRollback
              ? text('offline.clockRollback')
              : `+${format(summary.coin)} ${text('common.coin')} · ${format(Math.floor(summary.seconds))} ${text('common.seconds')}`}
          </p>
        )}
        {summary && !summary.clockRollback && (
          <p className="offline-automation-summary">
            +{format(summary.gold ?? '0')} Gold
            {(summary.upgrades ?? 0) > 0 && (
              <>
                {' '}
                · {format(summary.upgrades ?? 0)} {text('automation.offlineActions')} · −
                {format(summary.spent ?? '0')} Coin
              </>
            )}
          </p>
        )}
        {summary && !summary.clockRollback && (
          <small>{text(summary.capped ? 'offline.capped' : 'offline.rule')}</small>
        )}
        {recovered && <p>{text('offline.recovered')}</p>}
      </div>
      <button onClick={onClose}>{text('offline.continue')}</button>
    </section>
  );
}
