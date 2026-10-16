import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { gameFixture } from '../helpers/game-fixture';
import { activeProductionPerSecond } from '@core/economy/selectors';

describe('Deterministic active events', () => {
  it('Magnet uses the Gold multiplier at each spawn and not the end of a long tick', () => {
    const { state, catalog, clock } = gameFixture();
    catalog.events.rainbow.frenzySeconds = 3;
    state.inventory['booster.golden-magnet'] = 1;
    state.events.nextRainAt = 1000;
    state.events.rainbowUnlocked = true;
    state.events.nextRainbowAt = 900000;
    state.events.objects = [
      { id: 'rainbow-test', kind: 'rainbow', x: 50, lane: 2, spawnsAt: 0, expiresAt: 8000 },
    ];
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'CollectEvent', objectId: 'rainbow-test' });
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.golden-magnet' });
    clock.advance(20000);
    engine.tick();
    expect(engine.getSnapshot().wallet.goldCoin).toBe('12');
  });
  it('automatically collects Gold at its spawn boundary and rejects manual replay', () => {
    const { state, catalog, clock } = gameFixture();
    state.events.nextRainAt = 1000;
    const engine = createEngine(state, catalog, clock);
    clock.advance(1000);
    engine.tick();
    const objects = engine.getSnapshot().events.objects;
    expect(objects).toHaveLength(9);
    expect(engine.dispatch({ type: 'CollectEvent', objectId: objects[0]!.id })).toEqual({
      ok: false,
      error: 'expired-event',
    });
    expect(engine.dispatch({ type: 'CollectEvent', objectId: 'rain-1-0' })).toEqual({
      ok: false,
      error: 'expired-event',
    });
    expect(engine.getSnapshot().wallet.goldCoin).toBe('1');
    clock.advance(7000);
    engine.tick();
    expect(engine.dispatch({ type: 'CollectEvent', objectId: objects[1]!.id })).toEqual({
      ok: false,
      error: 'expired-event',
    });
  });
  it('Frenzy multiplies Gold separately and extends to 40 seconds without multiplying again', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    state.events.nextRainAt = 1000;
    state.events.rainbowUnlocked = true;
    state.events.nextRainbowAt = 1000;
    const engine = createEngine(state, catalog, clock);
    clock.advance(1000);
    engine.tick();
    const rainbow = engine.getSnapshot().events.objects.find((item) => item.kind === 'rainbow')!;
    engine.dispatch({ type: 'CollectEvent', objectId: rainbow.id });
    // The first Gold spawned before Frenzy; the next one benefits from it.
    clock.advance(1000);
    engine.tick();
    expect(engine.getSnapshot().wallet.goldCoin).toBe('3');
    const next = structuredClone(engine.getSnapshot());
    next.events.objects.push({ ...rainbow, id: 'second-rainbow' });
    engine.replaceState(next);
    engine.dispatch({ type: 'CollectEvent', objectId: 'second-rainbow' });
    expect(activeProductionPerSecond(engine.getSnapshot(), catalog)).toBe('3');
    expect(
      engine.getSnapshot().effects.every((effect) => effect.expiresAt - effect.startsAt === 39000),
    ).toBe(true);
  });
  it.each([100, 1000, 20000])(
    'Magnet collects all 10 Gold but no Rainbow at %s ms callbacks',
    (step) => {
      const { state, catalog, clock } = gameFixture();
      state.inventory['booster.golden-magnet'] = 1;
      state.events.nextRainAt = 1000;
      state.events.rainbowUnlocked = true;
      state.events.nextRainbowAt = 1000;
      const engine = createEngine(state, catalog, clock);
      engine.dispatch({ type: 'UseBooster', itemId: 'booster.golden-magnet' });
      for (let elapsed = 0; elapsed < 20000; elapsed += step) {
        clock.advance(step);
        engine.tick();
      }
      expect(engine.getSnapshot().wallet.goldCoin).toBe('10');
      expect(
        engine.getSnapshot().effects.every((effect) => effect.sourceId !== 'event.frenzy'),
      ).toBe(true);
      expect(engine.getSnapshot().events.sequence).toBe(2);
    },
  );
  it('reproduces RNG, object IDs and rewards with the same seed, independent of tick grouping', () => {
    function simulate(step: number) {
      const { state, catalog, clock } = gameFixture();
      state.inventory['booster.golden-magnet'] = 1;
      state.events.nextRainAt = 1000;
      const engine = createEngine(state, catalog, clock);
      engine.dispatch({ type: 'UseBooster', itemId: 'booster.golden-magnet' });
      for (let elapsed = 0; elapsed < 600000; elapsed += step) {
        clock.advance(step);
        engine.tick();
      }
      return { events: engine.getSnapshot().events, gold: engine.getSnapshot().wallet.goldCoin };
    }
    expect(simulate(100)).toEqual(simulate(10000));
  });
  it('unlocks Rainbow at the production crossing, not at the end of a long callback', () => {
    function simulate(step: number) {
      const { state, catalog, clock } = gameFixture();
      state.generators['generator.auto-press'] = 10;
      state.wallet.coin = state.statistics.totalProducedCoin = '9995';
      const engine = createEngine(state, catalog, clock);
      for (let elapsed = 0; elapsed < 30000; elapsed += step) {
        clock.advance(step);
        engine.tick();
      }
      return engine.getSnapshot().events;
    }
    expect(simulate(100)).toEqual(simulate(30000));
  });
  it('buys an inventory item atomically using integer Gold and rejects unaffordable repeats', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.goldCoin = '10';
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'PurchaseItem', offerId: 'offer.turbo-mint' }).ok).toBe(true);
    expect(engine.getSnapshot().wallet.goldCoin).toBe('0');
    expect(engine.getSnapshot().inventory['booster.turbo-mint']).toBe(1);
    expect(engine.dispatch({ type: 'PurchaseItem', offerId: 'offer.turbo-mint' })).toEqual({
      ok: false,
      error: 'insufficient-funds',
    });
    expect(engine.getSnapshot().inventory['booster.turbo-mint']).toBe(1);
  });
});
