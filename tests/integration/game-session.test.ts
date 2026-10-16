import { describe, expect, it, vi } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

describe('Save coordinator', () => {
  it('serializes slow writes and catches clicks arriving during an in-flight save', async () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    const repository = new MemorySaveRepository();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    let activeWrites = 0;
    let peak = 0;
    const original = repository.save.bind(repository);
    vi.spyOn(repository, 'save').mockImplementation(async (envelope) => {
      activeWrites++;
      peak = Math.max(peak, activeWrites);
      if (envelope.payload.revision === 1) await wait;
      await original(envelope);
      activeWrites--;
    });
    const session = createGameSession(engine, catalog, repository, clock);
    engine.dispatch({ type: 'ClickCoin' });
    const writing = session.requestSave();
    await vi.waitFor(() => expect(activeWrites).toBe(1));
    for (let i = 0; i < 99; i++) {
      engine.dispatch({ type: 'ClickCoin' });
      void session.requestSave();
    }
    expect(session.getSaveStatus().phase).toBe('saving');
    release();
    await writing;
    expect(peak).toBe(1);
    expect(repository.writes).toBe(2);
    expect((await repository.load())?.payload.wallet.coin).toBe('100');
    expect(session.getSaveStatus()).toMatchObject({ phase: 'saved', savedRevision: 100 });
    session.dispose();
  });
  it('keeps live progress on write failure and retries the latest state', async () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    const repository = new MemorySaveRepository();
    const session = createGameSession(engine, catalog, repository, clock);
    await session.requestSave();
    repository.failWrites = true;
    engine.dispatch({ type: 'ClickCoin' });
    await session.requestSave();
    expect(session.getSaveStatus().phase).toBe('error');
    expect(engine.getSnapshot().wallet.coin).toBe('1');
    expect(repository.stored?.payload.wallet.coin).toBe('0');
    engine.dispatch({ type: 'ClickCoin' });
    repository.failWrites = false;
    await session.requestSave();
    expect(session.getSaveStatus().phase).toBe('saved');
    expect(repository.stored?.payload.wallet.coin).toBe('2');
    await session.requestSave();
    expect(repository.writes).toBe(2);
    session.dispose();
  });
});
