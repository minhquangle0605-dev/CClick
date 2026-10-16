import { describe, expect, it, vi } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { createSave, parseSaveFile } from '@platform/storage/save-codec';
import { settleOffline } from '@core/offline/settle-offline';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

describe('Offline and restore commit barriers', () => {
  it('commits wallet and watermark before allowing play, and ignores repeat resumes', async () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 10;
    state.offlineCps = '10';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    session.pause();
    await session.requestSave();
    clock.advance(60000);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = repository.save.bind(repository);
    vi.spyOn(repository, 'save').mockImplementation(async (envelope) => {
      await gate;
      await original(envelope);
    });
    const resuming = session.resume();
    expect(session.getNotice().busy).toBe(true);
    expect(session.engine.getSnapshot().wallet.coin).toBe('0');
    expect(session.dispatch({ type: 'ClickCoin' })).toEqual({ ok: false, error: 'paused' });
    await session.requestSave(); // Autosave is blocked while settlement owns the writer.
    release();
    await resuming;
    expect(session.engine.getSnapshot().wallet.coin).toBe('600');
    expect(repository.stored?.payload.wallet.coin).toBe('600');
    expect(repository.stored?.payload.lastSimulatedAtUtc).toBe(clock.nowUtc());
    await session.resume();
    expect(session.engine.getSnapshot().wallet.coin).toBe('600');
    expect(settleOffline(repository.stored!.payload, catalog, clock.nowUtc()).summary.coin).toBe(
      '0',
    );
    session.dispose();
  });
  it('keeps the engine paused after an offline write failure and pays once on retry', async () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 10;
    state.offlineCps = '10';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    session.pause();
    await session.requestSave();
    clock.advance(10000);
    repository.failWrites = true;
    await session.resume();
    expect(session.getNotice().error).toBe('offline.saveError');
    expect(session.engine.getSnapshot().wallet.coin).toBe('0');
    expect(session.dispatch({ type: 'ClickCoin' }).ok).toBe(false);
    repository.failWrites = false;
    await session.resume();
    expect(session.engine.getSnapshot().wallet.coin).toBe('100');
    await session.resume();
    expect(session.engine.getSnapshot().wallet.coin).toBe('100');
    session.dispose();
  });
  it('handles repeated hidden/visible cycles without charging active time at the offline rate', async () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 10;
    state.offlineCps = '10';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    for (let i = 0; i < 5; i++) {
      clock.advance(1000);
      session.tick();
      session.pause();
      await session.requestSave();
      clock.advance(1000);
      await session.resume();
    }
    expect(session.engine.getSnapshot().wallet.coin).toBe('150');
    session.dispose();
  });
  it('exports and restores exact progression, saves a live backup and skips imported offline time', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    for (let i = 0; i < 20; i++) session.dispatch({ type: 'ClickCoin' });
    const old = {
      ...structuredClone(state),
      wallet: { coin: '77', goldCoin: '0' },
      statistics: { ...state.statistics, totalProducedCoin: '77' },
      generators: { 'generator.auto-press': 10 },
      offlineCps: '10',
    };
    const candidate = await createSave(old, catalog, clock.nowUtc());
    clock.advance(86400000);
    await session.restore(candidate);
    expect(session.engine.getSnapshot().wallet.coin).toBe('77');
    expect(repository.backups[0]?.payload.wallet.coin).toBe('864020');
    const exported = await session.exportSave();
    const parsed = await parseSaveFile(JSON.stringify(exported), catalog);
    expect(parsed.payload).toEqual(session.engine.getSnapshot());
    expect(parsed.payload.lastSimulatedAtUtc).toBe(clock.nowUtc());
    session.dispose();
  });
  it('leaves live progression intact if restore or its backup cannot commit', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    session.dispatch({ type: 'ClickCoin' });
    await session.requestSave();
    const previous = await session.exportSave();
    const candidate = await createSave(state, catalog, clock.nowUtc());
    repository.failWrites = true;
    await expect(session.restore(candidate)).rejects.toThrow();
    expect(session.engine.getSnapshot()).toEqual(previous.payload);
    expect(repository.stored?.payload).toEqual(previous.payload);
    expect(session.getNotice().busy).toBe(false);
    session.dispose();
  });
});
