import { text } from './text';

export function SaveIndicator({
  phase,
  savedAt,
  onSave,
}: {
  phase: 'dirty' | 'saving' | 'saved' | 'error';
  savedAt: string | null;
  onSave: () => void;
}) {
  return (
    <div className={`save-indicator save-${phase}`}>
      <span
        className="save-label"
        title={savedAt ? new Date(savedAt).toLocaleString('vi-VN') : undefined}
      >
        <span className="save-dot" />
        {text(`save.${phase}`)}
      </span>
      <button onClick={onSave} disabled={phase === 'saving'}>
        {text(phase === 'error' ? 'save.retry' : 'save.now')}
      </button>
      {phase === 'error' && <p role="alert">{text('save.errorHint')}</p>}
    </div>
  );
}
