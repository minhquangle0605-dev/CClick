import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameEngine } from '@core/engine/contracts';
import type { Clock, SaveRepository, BackupRepository } from '@core/ports';
import { createSave } from '@platform/storage/save-codec';
import { decodeSave } from '@platform/storage/save-codec';
import type { GameCommand } from '@core/engine/contracts';
import type { SaveEnvelope } from '@core/state/game-state';
import { monotonicUtc } from '@core/offline/settle-offline';
import { settleOfflineAsync } from '@platform/time/settle-offline-async';
import type { OfflineSummary } from '@core/offline/settle-offline';
import { productionPerSecond, clickPower } from '@core/economy/selectors';
import { createEngine } from '@core/engine/create-engine';
import type { DurableCommand, CommandResult } from '@core/engine/contracts';
import { endActiveSession } from '@core/events/end-active-session';
import { offlineEfficiency } from '@core/cards/selectors';
import { createInitialState } from '@core/state/initial-state';
import { refreshProgress } from '@core/progression/refresh-progress';

export interface SaveStatus {
  phase: 'dirty' | 'saving' | 'saved' | 'error';
  savedAt: string | null;
  savedRevision: number;
}
export interface SessionNotice {
  offline: OfflineSummary | null;
  busy: boolean;
  error: string | null;
  recovered: boolean;
}

/** One writer; every queued save observes the latest snapshot. */
export function createGameSession(
  engine: GameEngine,
  catalog: GameCatalog,
  repository: SaveRepository & Partial<BackupRepository>,
  clock: Clock,
  previous?: { savedAt: string; savedRevision: number },
) {
  let status: SaveStatus = {
    phase: previous ? 'saved' : 'dirty',
    savedAt: previous?.savedAt ?? null,
    savedRevision: previous?.savedRevision ?? -1,
  };
  const listeners = new Set<() => void>();
  let notice: SessionNotice = { offline: null, busy: false, error: null, recovered: false };
  const noticeListeners = new Set<() => void>();
  function announce(next: Partial<SessionNotice>) {
    notice = { ...notice, ...next };
    for (const listener of noticeListeners) listener();
  }
  let hidden = false;
  let suspended = false;
  let backgroundedDuringCommit = false;
  function publish(next: SaveStatus) {
    status = next;
    for (const listener of listeners) listener();
  }
  const unsubscribe = engine.subscribe(() => {
    if (status.phase === 'saved') publish({ ...status, phase: 'dirty' });
  });
  let requested = false;
  let inFlight: Promise<void> | null = null;
  async function saveLoop() {
    while (requested) {
      requested = false;
      const state = engine.getSnapshot();
      if (state.revision === status.savedRevision) {
        publish({ ...status, phase: 'saved' });
        continue;
      }
      publish({ ...status, phase: 'saving' });
      try {
        const envelope = await createSave(state, catalog, clock.nowUtc());
        await repository.save(envelope);
        publish({
          phase: engine.getSnapshot().revision === state.revision ? 'saved' : 'dirty',
          savedAt: envelope.savedAtUtc,
          savedRevision: state.revision,
        });
      } catch {
        requested = false;
        publish({ ...status, phase: 'error' });
      }
    }
  }
  function requestSave(): Promise<void> {
    if (notice.busy) return inFlight ?? Promise.resolve();
    requested = true;
    if (!inFlight) {
      // Defer starting so synchronous subscriber callbacks also share this promise.
      inFlight = Promise.resolve()
        .then(saveLoop)
        .finally(async () => {
          inFlight = null;
          if (requested) await requestSave();
        });
    }
    return inFlight;
  }
  function pause() {
    hidden = true;
    if (notice.busy) backgroundedDuringCommit = true;
    if (notice.busy || suspended) return;
    suspended = true;
    engine.pause();
    engine.replaceState(endActiveSession(engine.getSnapshot(), clock.nowUtc()));
    void requestSave();
  }
  async function commitCommand(command: DurableCommand): Promise<CommandResult> {
    if (notice.busy || suspended) return { ok: false, error: 'paused' };
    const settled = engine.pause();
    if (!settled.ok) {
      engine.resume();
      return settled;
    }
    announce({ busy: true });
    try {
      // Stage on a separate engine. No inventory/reward is visible before commit.
      const candidate = createEngine(structuredClone(engine.getSnapshot()), catalog, clock);
      const result = candidate.dispatch(command);
      if (!result.ok) return result;
      await requestSave();
      const envelope = await createSave(result.value.state, catalog, clock.nowUtc());
      await repository.save(envelope);
      engine.replaceState(result.value.state);
      publish({
        phase: 'saved',
        savedAt: envelope.savedAtUtc,
        savedRevision: envelope.payload.revision,
      });
      return result;
    } catch {
      return { ok: false, error: 'save-failed' };
    } finally {
      suspended = hidden;
      if (backgroundedDuringCommit) {
        engine.replaceState(endActiveSession(engine.getSnapshot(), clock.nowUtc()));
        backgroundedDuringCommit = false;
      }
      if (!suspended) engine.resume();
      announce({ busy: false });
      if (hidden || status.phase === 'dirty') void requestSave();
    }
  }
  async function resume() {
    hidden = false;
    if (!suspended || notice.busy) return;
    announce({ busy: true, error: null });
    try {
      await requestSave();
      const result = await settleOfflineAsync(engine.getSnapshot(), catalog, clock.nowUtc());
      const saved = await createSave(result.state, catalog, clock.nowUtc());
      await repository.save(saved);
      engine.replaceState(result.state);
      publish({ phase: 'saved', savedAt: saved.savedAtUtc, savedRevision: saved.payload.revision });
      announce({
        offline:
          result.summary.seconds >= 1 || result.summary.clockRollback ? result.summary : null,
      });
      suspended = hidden;
      if (!hidden) engine.resume();
    } catch {
      announce({ error: 'offline.saveError' });
    } finally {
      backgroundedDuringCommit = false;
      announce({ busy: false });
    }
  }
  async function restore(candidate: SaveEnvelope) {
    if (notice.busy) throw new Error('saveTools.busy');
    const checked = await decodeSave(candidate, catalog);
    if (notice.busy) throw new Error('saveTools.busy');
    const wasSuspended = suspended;
    const previousError = notice.error;
    let restored = false;
    announce({ busy: true, error: null });
    engine.pause();
    try {
      await requestSave();
      const before = await createSave(engine.getSnapshot(), catalog, clock.nowUtc());
      const next = refreshProgress(
        {
          ...endActiveSession(structuredClone(checked.payload), clock.nowUtc()),
          revision: checked.payload.revision + 1,
          lastSimulatedAtUtc: monotonicUtc(checked.payload.lastSimulatedAtUtc, clock.nowUtc()),
          offlineCps: productionPerSecond(checked.payload, catalog),
          offlineClickPower: clickPower(checked.payload, catalog),
          offlineEfficiency: offlineEfficiency(checked.payload, catalog),
        },
        catalog,
        clock.nowUtc(),
      );
      const imported = await createSave(next, catalog, clock.nowUtc());
      await repository.save(imported, before);
      engine.replaceState(next);
      restored = true;
      publish({ phase: 'saved', savedAt: imported.savedAtUtc, savedRevision: next.revision });
      announce({ offline: null });
    } finally {
      suspended = hidden || (!restored && wasSuspended);
      if (backgroundedDuringCommit) {
        engine.replaceState(endActiveSession(engine.getSnapshot(), clock.nowUtc()));
        backgroundedDuringCommit = false;
      }
      if (!suspended) engine.resume();
      announce({ busy: false, error: restored ? null : previousError });
    }
  }
  async function reset(confirmation: string, expectedRunId: string) {
    if (confirmation !== 'RESET' || expectedRunId !== engine.getSnapshot().runId)
      throw new Error('reset.confirmationError');
    if (notice.busy || suspended) throw new Error('saveTools.busy');
    if (!repository.reset) throw new Error('reset.failure');
    const settled = engine.pause();
    // A capped run still has a valid last snapshot to back up and reset.
    if (!settled.ok && settled.error !== 'numeric-limit') {
      engine.resume();
      throw new Error('reset.failure');
    }
    announce({ busy: true });
    try {
      await requestSave();
      const before = await createSave(engine.getSnapshot(), catalog, clock.nowUtc());
      const next = createInitialState(catalog, crypto.randomUUID(), clock.nowUtc());
      const saved = await createSave(next, catalog, clock.nowUtc());
      await repository.reset(saved, before);
      engine.replaceState(next);
      publish({ phase: 'saved', savedAt: saved.savedAtUtc, savedRevision: next.revision });
      announce({ offline: null, recovered: false, error: null });
    } finally {
      suspended = hidden;
      if (backgroundedDuringCommit) {
        engine.replaceState(endActiveSession(engine.getSnapshot(), clock.nowUtc()));
        backgroundedDuringCommit = false;
      }
      if (!suspended) engine.resume();
      announce({ busy: false });
      if (hidden || status.phase === 'dirty') void requestSave();
    }
  }
  return {
    engine,
    catalog,
    requestSave,
    pause,
    resume,
    restore,
    reset,
    nowUtc: () => clock.nowUtc(),
    commitCommand,
    dispatch(command: GameCommand) {
      return notice.busy || suspended
        ? { ok: false as const, error: 'paused' as const }
        : command.type !== 'ClickCoin' &&
            command.type !== 'PurchaseGenerator' &&
            command.type !== 'PurchaseUpgrade'
          ? { ok: false as const, error: 'requires-commit' as const }
          : engine.dispatch(command);
    },
    tick() {
      if (notice.busy || suspended) return null;
      const result = engine.tick();
      if (
        result.ok &&
        result.value.events.some(
          (event) => event.type === 'GoldEarned' || event.type === 'AutoUpgraded',
        )
      )
        void requestSave();
      return result;
    },
    exportSave: () => createSave(engine.getSnapshot(), catalog, clock.nowUtc()),
    listBackups: () => repository.listBackups?.() ?? Promise.resolve([]),
    readDamaged: () => repository.readDamaged?.() ?? Promise.resolve(null),
    getNotice: () => notice,
    subscribeNotice(listener: () => void) {
      noticeListeners.add(listener);
      return () => {
        noticeListeners.delete(listener);
      };
    },
    showInitialNotice(offline: OfflineSummary | null, recovered: boolean) {
      announce({ offline, recovered });
    },
    dismissNotice() {
      announce({ offline: null, recovered: false });
    },
    getSaveStatus: () => status,
    subscribeSave(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      unsubscribe();
      listeners.clear();
      noticeListeners.clear();
    },
  };
}

export type GameSession = ReturnType<typeof createGameSession>;
