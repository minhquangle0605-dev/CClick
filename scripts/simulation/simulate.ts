import type { GameCatalog } from '../../src/core/catalog/catalog.types';
import type { Clock } from '../../src/core/ports';
import type { GameCommand } from '../../src/core/engine/contracts';
import { createInitialState } from '../../src/core/state/initial-state';
import { createEngine } from '../../src/core/engine/create-engine';
import { settleOffline } from '../../src/core/offline/settle-offline';
import { endActiveSession } from '../../src/core/events/end-active-session';
import { productionPerSecond, clickPower } from '../../src/core/economy/selectors';
import { amount } from '../../src/shared/amount';
import { createSave, decodeSave } from '../../src/platform/storage/save-codec';
import { seedFromRun } from '../../src/core/events/random';
import { manage } from './policy';
import { checkpoints, simulationStart, type PlayProfile } from './profiles';

class SimulationClock implements Clock {
  elapsedMs = 0;
  nowUtc = () => new Date(simulationStart + this.elapsedMs).toISOString();
  monotonicMilliseconds = () => this.elapsedMs;
}
export async function simulate(
  catalog: GameCatalog,
  profile: PlayProfile,
  seed: number,
  horizon = 30 * 86400,
) {
  const clock = new SimulationClock();
  const engine = createEngine(
    createInitialState(catalog, `simulation-${seed}`, clock.nowUtc()),
    catalog,
    clock,
  );
  const milestones: Record<string, number> = {};
  const samples: Record<string, unknown>[] = [];
  let goldEarned = '0',
    goldSpent = '0',
    lastPurchase = 0,
    longestActivePurchaseGap = 0;
  let maxObjects = 0,
    maxEffects = 0;
  const observe = () => {
    const s = engine.getSnapshot();
    for (const goal of ['1000', '1000000', '1000000000', '1000000000000', '1000000000000000'])
      if (
        milestones[goal] === undefined &&
        amount.compare(s.statistics.totalProducedCoin, goal) >= 0
      )
        milestones[goal] = clock.elapsedMs / 1000;
    for (const [id, count] of Object.entries(s.generators))
      if (count && milestones[id] === undefined) milestones[id] = clock.elapsedMs / 1000;
    maxObjects = Math.max(maxObjects, s.events.objects.length);
    maxEffects = Math.max(maxEffects, s.effects.length);
  };
  const send = (command: GameCommand) => {
    const before = engine.getSnapshot();
    const result = engine.dispatch(command);
    if (!result.ok) {
      if (result.error === 'numeric-limit') throw new Error(`Simulation overflow: ${command.type}`);
      return false;
    }
    const after = engine.getSnapshot();
    const delta = amount.compare(after.wallet.goldCoin, before.wallet.goldCoin);
    if (delta > 0)
      goldEarned = amount.add(
        goldEarned,
        amount.subtract(after.wallet.goldCoin, before.wallet.goldCoin),
      );
    if (delta < 0)
      goldSpent = amount.add(
        goldSpent,
        amount.subtract(before.wallet.goldCoin, after.wallet.goldCoin),
      );
    if (
      command.type === 'PurchaseGenerator' ||
      command.type === 'PurchaseUpgrade' ||
      command.type === 'UpgradeCard'
    ) {
      longestActivePurchaseGap = Math.max(
        longestActivePurchaseGap,
        (after.tracking.activeMs - lastPurchase) / 1000,
      );
      lastPurchase = after.tracking.activeMs;
    }
    return true;
  };
  function offlineUntil(seconds: number, record = true) {
    engine.pause();
    engine.replaceState(endActiveSession(engine.getSnapshot(), clock.nowUtc()));
    clock.elapsedMs = seconds * 1000;
    engine.replaceState(settleOffline(engine.getSnapshot(), catalog, clock.nowUtc()).state);
    engine.resume();
    if (record) observe();
  }
  async function sample() {
    const s = engine.getSnapshot();
    await decodeSave(await createSave(s, catalog, clock.nowUtc()), catalog);
    samples.push({
      seconds: clock.elapsedMs / 1000,
      coin: s.wallet.coin,
      produced: s.statistics.totalProducedCoin,
      spent: s.statistics.totalSpentCoin,
      gold: s.wallet.goldCoin,
      goldEarned,
      goldSpent,
      cps: productionPerSecond(s, catalog),
      clickPower: clickPower(s, catalog),
      generators: Object.keys(s.generators).length,
      upgrades: s.purchasedUpgradeIds.length,
      chests: s.chests.opened,
      cards: Object.keys(s.cards.owned).length,
      cardLevels: Object.fromEntries(
        Object.entries(s.cards.owned).map(([id, card]) => [id, card.level]),
      ),
      daily: s.daily.claimCount,
      achievements: s.achievements.claimedIds.length,
      sources: s.tracking.coin,
      eventCoins: s.tracking.eventCoins,
      rainbows: s.tracking.rainbows,
      activeSeconds: s.tracking.activeMs / 1000,
    });
  }
  // Capture checkpoints by projecting an offline snapshot without splitting the real absence/cap.
  async function captureBetween(end: number) {
    for (const target of checkpoints.filter(
      (t) => t > clock.elapsedMs / 1000 && t <= end && t <= horizon,
    )) {
      const saved = structuredClone(engine.getSnapshot()),
        oldTime = clock.elapsedMs;
      offlineUntil(target, false);
      await sample();
      clock.elapsedMs = oldTime;
      engine.replaceState(saved);
    }
  }
  const interval = 86400 / profile.sessionsPerDay;
  for (let start = 0; start < horizon; start += interval) {
    if (start > 0) {
      await captureBetween(start);
      offlineUntil(start);
    }
    const duration = Math.min(profile.sessionSeconds, horizon - start);
    manage(engine, catalog, profile, clock.nowUtc(), duration, send);
    for (let second = 0; second < duration; second++) {
      const goldBefore = engine.getSnapshot().wallet.goldCoin;
      clock.elapsedMs += 1000;
      if (!engine.tick().ok) throw new Error('Simulation tick overflow');
      goldEarned = amount.add(
        goldEarned,
        amount.subtract(engine.getSnapshot().wallet.goldCoin, goldBefore),
      );
      const bootstrapClick =
        !Object.keys(engine.getSnapshot().generators).length &&
        engine.getSnapshot().statistics.clicks < 15;
      const clicks = bootstrapClick
        ? Math.min(2, 15 - engine.getSnapshot().statistics.clicks)
        : profile.clicksPerSecond;
      for (let click = 0; click < clicks; click++) send({ type: 'ClickCoin' });
      for (const object of engine.getSnapshot().events.objects) {
        if (object.spawnsAt > engine.getSnapshot().events.activeMs) continue;
        if (seedFromRun(`${seed}:${object.id}`) % 100 < profile.collectPercent)
          send({ type: 'CollectEvent', objectId: object.id });
      }
      if (second % 15 === 14)
        manage(engine, catalog, profile, clock.nowUtc(), duration - second - 1, send);
      observe();
      if (checkpoints.includes(clock.elapsedMs / 1000)) await sample();
    }
    engine.pause();
    engine.replaceState(endActiveSession(engine.getSnapshot(), clock.nowUtc()));
  }
  await captureBetween(horizon);
  offlineUntil(horizon);
  if (!samples.some((s) => s.seconds === horizon)) await sample();
  longestActivePurchaseGap = Math.max(
    longestActivePurchaseGap,
    (engine.getSnapshot().tracking.activeMs - lastPurchase) / 1000,
  );
  return {
    profile: profile.id,
    seed,
    horizon,
    milestones,
    longestActivePurchaseGap,
    maxObjects,
    maxEffects,
    samples,
  };
}
