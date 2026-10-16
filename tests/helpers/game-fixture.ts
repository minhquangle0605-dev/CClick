import type { Clock, SaveRepository } from '@core/ports';
import type { SaveEnvelope } from '@core/state/game-state';
import { createInitialState } from '@core/state/initial-state';
import { rawCatalog, validateCatalog } from '@content/index';
import vi from '@locales/vi.json';
import icons from '@assets/item-icon-ids.json';

export class FakeClock implements Clock {
  milliseconds = 0;
  wallMilliseconds = Date.parse('2026-10-14T00:00:00.000Z');
  nowUtc() {
    return new Date(this.wallMilliseconds).toISOString();
  }
  monotonicMilliseconds() {
    return this.milliseconds;
  }
  advance(milliseconds: number) {
    this.milliseconds += milliseconds;
    this.wallMilliseconds += milliseconds;
  }
}

export class MemorySaveRepository implements SaveRepository {
  stored: SaveEnvelope | null = null;
  writes = 0;
  failWrites = false;
  recoverySource: string | null = null;
  backups: SaveEnvelope[] = [];
  resetBackup: SaveEnvelope | null = null;
  async reset(envelope: SaveEnvelope, before: SaveEnvelope) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.writes++;
    this.resetBackup = structuredClone(before);
    this.backups = [structuredClone(envelope), structuredClone(envelope)];
    this.stored = structuredClone(envelope);
  }
  async load() {
    return structuredClone(this.stored);
  }
  async save(envelope: SaveEnvelope, beforeReplacement?: SaveEnvelope) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.writes++;
    this.backups = [
      structuredClone(beforeReplacement ?? this.stored ?? envelope),
      ...this.backups,
    ].slice(0, 2);
    this.stored = structuredClone(envelope);
  }
  async listBackups() {
    return [
      ...this.backups.map((envelope, index) => ({
        id: `backup-${index + 1}`,
        envelope: structuredClone(envelope),
      })),
      ...(this.resetBackup
        ? [{ id: 'reset-backup', envelope: structuredClone(this.resetBackup) }]
        : []),
    ];
  }
  async loadBackup(id: string) {
    const saved =
      id === 'reset-backup' ? this.resetBackup : this.backups[Number(id.split('-')[1]) - 1];
    if (!saved) throw new Error('missing');
    return structuredClone(saved);
  }
  async readDamaged(): Promise<unknown> {
    return null;
  }
}

export function gameFixture() {
  const catalog = validateCatalog(structuredClone(rawCatalog), vi, icons);
  const clock = new FakeClock();
  const state = createInitialState(catalog, 'test-run', clock.nowUtc());
  return { catalog, clock, state };
}
