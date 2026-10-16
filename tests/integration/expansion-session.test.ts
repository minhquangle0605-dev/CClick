import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { settleOffline } from '@core/offline/settle-offline';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

describe('Durable item/event actions and schema 3', () => {
  it('does not expose a Time Warp reward before commit and rejects concurrent consumption', async () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['booster.time-warp'] = 1;
    state.generators['generator.auto-press'] = 1;
    state.offlineCps = '1';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = repository.save.bind(repository);
    vi.spyOn(repository, 'save').mockImplementation(async (envelope) => {
      await gate;
      await original(envelope);
    });
    const pending = session.commitCommand({ type: 'UseBooster', itemId: 'booster.time-warp' });
    expect(session.getNotice().busy).toBe(true);
    expect(session.engine.getSnapshot().wallet.coin).toBe('0');
    expect(session.engine.getSnapshot().inventory['booster.time-warp']).toBe(1);
    expect(
      await session.commitCommand({ type: 'UseBooster', itemId: 'booster.time-warp' }),
    ).toEqual({ ok: false, error: 'paused' });
    expect(session.dispatch({ type: 'ClickCoin' }).ok).toBe(false);
    release();
    expect((await pending).ok).toBe(true);
    expect(session.engine.getSnapshot().wallet.coin).toBe('3600');
    expect(repository.stored?.payload.inventory['booster.time-warp']).toBe(0);
    expect((await decodeSave(repository.stored, catalog)).payload.wallet.coin).toBe('3600');
    session.dispose();
  });
  it('keeps the item and wallet on failed writes and commits exactly once on retry', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.goldCoin = '10';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    repository.failWrites = true;
    expect(
      await session.commitCommand({ type: 'PurchaseItem', offerId: 'offer.turbo-mint' }),
    ).toEqual({ ok: false, error: 'save-failed' });
    expect(session.engine.getSnapshot().wallet.goldCoin).toBe('10');
    expect(session.engine.getSnapshot().inventory).toEqual({});
    repository.failWrites = false;
    expect(
      (await session.commitCommand({ type: 'PurchaseItem', offerId: 'offer.turbo-mint' })).ok,
    ).toBe(true);
    expect(repository.stored?.payload.wallet.goldCoin).toBe('0');
    expect(repository.stored?.payload.inventory['booster.turbo-mint']).toBe(1);
    session.dispose();
  });
  it('persists automatic collection and continues the remaining rain offline without replay', async () => {
    const { state, catalog, clock } = gameFixture();
    state.events.nextRainAt = 1000;
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    clock.advance(1000);
    session.tick();
    const id = 'rain-1-0';
    await session.requestSave();
    const stored = (await repository.load())!;
    expect(stored.payload.wallet.goldCoin).toBe('1');
    expect(stored.payload.events.objects.some((object) => object.id === id)).toBe(false);
    clock.advance(86400000);
    const loaded = settleOffline(stored.payload, catalog, clock.nowUtc()).state;
    await repository.save(await createSave(loaded, catalog, clock.nowUtc()));
    expect(loaded.events.objects.some((object) => object.id === id)).toBe(false);
    expect(loaded.events.activeMs).toBe(stored.payload.events.activeMs + 86400000);
    expect(Number(loaded.wallet.goldCoin)).toBeGreaterThan(1);
    expect(settleOffline(loaded, catalog, clock.nowUtc()).summary.coin).toBe('0');
    expect(
      createEngine(loaded, catalog, clock).dispatch({ type: 'CollectEvent', objectId: id }),
    ).toEqual({ ok: false, error: 'expired-event' });
    session.dispose();
    repository.close();
  });
  it('preserves scheduled Gold on hide and auto collects it while away', async () => {
    const { state, catalog, clock } = gameFixture();
    state.events.nextRainAt = 1000;
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    clock.advance(1000);
    session.tick();
    const before = session.engine.getSnapshot().events;
    session.pause();
    await session.requestSave();
    expect(session.engine.getSnapshot().events.objects).toEqual(before.objects);
    clock.advance(60000);
    await session.resume();
    expect(session.engine.getSnapshot().events.nextRainAt).toBe(before.nextRainAt);
    expect(session.engine.getSnapshot().events.activeMs).toBe(61000);
    expect(session.engine.getSnapshot().wallet.goldCoin).toBe('10');
    session.dispose();
  });
  it.each(['inventory', 'rng', 'effect', 'gold', 'duplicate'] as const)(
    'rejects malformed %s even with a matching checksum',
    async (kind) => {
      const { state, catalog, clock } = gameFixture();
      if (kind === 'inventory') state.inventory['booster.unknown'] = 1;
      if (kind === 'rng') state.events.rng = 0;
      if (kind === 'gold') state.wallet.goldCoin = '1.5';
      if (kind === 'effect')
        state.effects = [
          {
            sourceId: 'booster.turbo-mint',
            target: 'production',
            operation: 'multiply',
            value: '999',
            stackGroup: 'booster-production',
            startsAt: state.effectsAtMs,
            expiresAt: state.effectsAtMs + 60000,
            stackPolicy: 'extend',
          },
        ];
      if (kind === 'duplicate') {
        state.events.rainEndsAt = 15000;
        const object = {
          id: 'same',
          kind: 'gold' as const,
          x: 50,
          lane: 0,
          spawnsAt: 0,
          expiresAt: 6000,
        };
        state.events.objects = [object, object];
      }
      await expect(
        decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
      ).rejects.toMatchObject({ code: 'invalid' });
    },
  );
});
