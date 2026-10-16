import type { DisplaySettings } from '@shared/display-settings';
const KEY = 'coin-clicker-settings-v1';
export function loadSettings(): { settings: DisplaySettings; failed: boolean } {
  const settings: DisplaySettings = {
    numberFormat: 'compact',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    glow: true,
    sound: false,
    haptics: false,
  };
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (stored && typeof stored === 'object') {
      for (const key of ['reducedMotion', 'glow', 'sound', 'haptics'] as const) {
        if (key in stored && typeof (stored as Record<string, unknown>)[key] === 'boolean')
          settings[key] = (stored as DisplaySettings)[key];
      }
      if (
        'numberFormat' in stored &&
        (stored.numberFormat === 'full' || stored.numberFormat === 'compact')
      )
        settings.numberFormat = stored.numberFormat;
    }
    return { settings, failed: false };
  } catch {
    return { settings, failed: true };
  }
}
export function saveSettings(settings: DisplaySettings): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
