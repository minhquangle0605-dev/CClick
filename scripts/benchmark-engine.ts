import { writeFileSync, mkdirSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { rawCatalog, validateCatalog } from '../src/content/index';
import vi from '../src/locales/vi.json';
import icons from '../src/assets/item-icon-ids.json';
import { createInitialState } from '../src/core/state/initial-state';
import { createEngine } from '../src/core/engine/create-engine';
import { createSave, decodeSave } from '../src/platform/storage/save-codec';
import { quoteGenerator, quoteUpgrade } from '../src/core/shop/quotes';
import type { GameState } from '../src/core/state/game-state';
import { APP_VERSION } from '../src/shared/version';
const catalog = validateCatalog(rawCatalog, vi, icons);
let elapsed = 0;
const clock = {
  nowUtc: () => new Date(Date.parse('2026-10-15T00:00:00.000Z') + elapsed).toISOString(),
  monotonicMilliseconds: () => elapsed,
};
const state = createInitialState(catalog, 'benchmark-stage-7', clock.nowUtc());
state.wallet.coin = state.statistics.totalProducedCoin = '1e30';
state.generators = Object.fromEntries(catalog.generators.map((g) => [g.id, 100]));
state.purchasedUpgradeIds = catalog.upgrades.map((u) => u.id);
state.cards.owned = Object.fromEntries(
  catalog.cards.map((c) => [c.id, { level: 10, duplicates: 0, convertedGold: '0' }]),
);
state.cards.equipped = ['card.mint-gear', 'card.star-forge', 'card.dusk-battery'];
const engine = createEngine(state, catalog, clock);
const timings: number[] = [],
  quotes: number[] = [],
  memory = [];
let maxObjects = 0,
  maxEffects = 0,
  maxSaveBytes = 0;
const started = performance.now();
for (let tick = 0; tick <= 72000; tick++) {
  if (tick) {
    elapsed += 100;
    const start = performance.now();
    if (!engine.tick().ok) throw new Error('Tick failed during two-hour workload');
    if (tick % 5 === 0 && !engine.dispatch({ type: 'ClickCoin' }).ok)
      throw new Error('Click failed');
    timings.push(performance.now() - start);
  }
  const current = engine.getSnapshot();
  maxObjects = Math.max(maxObjects, current.events.objects.length);
  maxEffects = Math.max(maxEffects, current.effects.length);
  if (tick % 100 === 0) {
    const start = performance.now();
    for (const item of catalog.generators) quoteGenerator(current, catalog, item.id, 100);
    // Unowned copies exercise benefit calculations, not only already-owned early returns.
    const shopState: GameState = { ...current, purchasedUpgradeIds: [] };
    for (const item of catalog.upgrades) quoteUpgrade(shopState, catalog, item.id);
    quotes.push(performance.now() - start);
  }
  if (tick % 18000 === 0) {
    const envelope = await createSave(current, catalog, clock.nowUtc());
    await decodeSave(envelope, catalog);
    maxSaveBytes = Math.max(maxSaveBytes, Buffer.byteLength(JSON.stringify(envelope)));
    global.gc?.();
    memory.push({
      simulatedMinutes: elapsed / 60000,
      heapUsedBytes: process.memoryUsage().heapUsed,
    });
  }
}
const stats = (values: number[]) => {
  values.sort((a, b) => a - b);
  return {
    count: values.length,
    p50Ms: values[Math.floor(values.length * 0.5)],
    p95Ms: values[Math.floor(values.length * 0.95)],
    maxMs: values.at(-1),
  };
};
const report = {
  appVersion: APP_VERSION,
  contentVersion: catalog.balance.contentVersion,
  environment: {
    node: process.version,
    platform: platform(),
    osRelease: release(),
    cpu: cpus()[0]?.model,
    gcAvailable: !!global.gc,
  },
  simulatedHours: 2,
  runtimeSeconds: (performance.now() - started) / 1000,
  tickAndOptionalClick: stats(timings),
  shop42Quotes: stats(quotes),
  memory,
  maxObjects,
  maxEffects,
  maxSaveBytes,
  note: 'Accelerated Node engine workload, not browser FPS, rendering latency, real two-hour play or browser memory.',
};
mkdirSync('docs/balance', { recursive: true });
writeFileSync('docs/balance/engine-benchmark.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
