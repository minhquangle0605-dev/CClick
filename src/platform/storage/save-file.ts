import { MAX_SAVE_BYTES, parseSaveFile } from './save-codec';
import type { GameCatalog } from '@core/catalog/catalog.types';
export async function readSaveFile(file: File, catalog: GameCatalog) {
  if (file.size > MAX_SAVE_BYTES) throw new Error('saveTools.tooLarge');
  return parseSaveFile(await file.text(), catalog);
}
export function downloadJson(value: unknown, prefix = 'coin-clicker') {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
