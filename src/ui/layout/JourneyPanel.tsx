import { Icon } from '@ui/components/Icon';
import { text } from '@ui/components/text';
import './journey.css';

export function JourneyPanel({
  total,
  machines,
  clicks,
  goal,
  progress,
  onOpenStatistics,
}: {
  total: string;
  machines: string;
  clicks: string;
  goal: string;
  progress: number;
  onOpenStatistics: () => void;
}) {
  const stats = { total, machines, clicks };
  return (
    <aside className="journey-panel" aria-label={text('journey.title')}>
      <div className="milestone">
        <div className="milestone-label">
          <span>
            {text('journey.goal')} <strong>{goal} Coin</strong>
          </span>
          <span>{Math.floor(progress)}%</span>
        </div>
        <div
          className="milestone-track"
          role="progressbar"
          aria-label={text('journey.goal')}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <dl className="journey-stats">
        {(['total', 'machines', 'clicks'] as const).map((key) => (
          <div key={key}>
            <dt>{text(`journey.${key}`)}</dt>
            <dd>{stats[key]}</dd>
          </div>
        ))}
      </dl>
      <button
        className="journey-details"
        onClick={onOpenStatistics}
        aria-label={text('layout.statistics')}
      >
        <Icon name="trend" size={15} /> {text('stats.title')}
      </button>
    </aside>
  );
}
