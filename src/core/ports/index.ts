import type { SaveEnvelope } from '@core/state/game-state';

export interface Clock {
  nowUtc(): string;
  monotonicMilliseconds(): number;
}

export interface RandomSource {
  next(): number;
}

export interface SaveRepository {
  load(): Promise<SaveEnvelope | null>;
  save(envelope: SaveEnvelope, beforeReplacement?: SaveEnvelope): Promise<void>;
}

export interface BackupRepository extends SaveRepository {
  reset(envelope: SaveEnvelope, beforeReset: SaveEnvelope): Promise<void>;
  listBackups(): Promise<Array<{ id: string; envelope: SaveEnvelope }>>;
  loadBackup(id: string): Promise<SaveEnvelope>;
  readDamaged(): Promise<unknown | null>;
}
