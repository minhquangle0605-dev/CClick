import { text } from '@ui/components/text';
import './settings.css';
import type { DisplaySettings } from '@shared/display-settings';
export type { DisplaySettings } from '@shared/display-settings';

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: DisplaySettings;
  onChange: (value: DisplaySettings) => void;
}) {
  return (
    <div className="settings-panel">
      <label className="setting-row number-format-setting">
        <span>
          <strong>{text('settings.numberFormat')}</strong>
          <small>{text('settings.numberFormatHint')}</small>
        </span>
        <select
          value={settings.numberFormat}
          onChange={(event) =>
            onChange({
              ...settings,
              numberFormat: event.target.value === 'full' ? 'full' : 'compact',
            })
          }
        >
          <option value="compact">{text('settings.numberCompact')}</option>
          <option value="full">{text('settings.numberFull')}</option>
        </select>
      </label>
      {(['reducedMotion', 'glow', 'sound', 'haptics'] as const).map((key) => {
        const label = key === 'reducedMotion' ? 'motion' : key;
        return (
          <label className="setting-row" key={key}>
            <span>
              <strong>{text(`settings.${label}`)}</strong>
              <small>{text(`settings.${label}Hint`)}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={settings[key]}
              onChange={(event) => onChange({ ...settings, [key]: event.target.checked })}
            />
            <span className="toggle-track" aria-hidden="true" />
          </label>
        );
      })}
      <p className="settings-note">{text('settings.note')}</p>
    </div>
  );
}
