import type { GameCatalog } from '@core/catalog/catalog.types';
import type { ActiveEffect } from '@core/effects/effect.types';
import { temporaryMultiplier } from '@core/effects/pipeline';
import { amount } from '@shared/amount';
import type { EventState } from './event.types';
import { draw, seedFromRun } from './random';

export function createEventState(catalog: GameCatalog, runId: string): EventState {
  const rain = catalog.events.rain;
  const next = draw(seedFromRun(runId), rain.waitMinSeconds * 1000, rain.waitMaxSeconds * 1000);
  return {
    activeMs: 0,
    rng: next.seed,
    sequence: 0,
    nextRainAt: next.value,
    rainEndsAt: null,
    nextRainbowAt: null,
    rainbowUnlocked: false,
    objects: [],
  };
}
export function unlockRainbow(events: EventState, catalog: GameCatalog): EventState {
  if (events.rainbowUnlocked) return events;
  const rules = catalog.events.rainbow;
  const next = draw(events.rng, rules.waitMinSeconds * 1000, rules.waitMaxSeconds * 1000);
  return {
    ...events,
    rng: next.seed,
    rainbowUnlocked: true,
    nextRainbowAt: events.activeMs + next.value,
  };
}
/** Ending a visible event never replays its remaining objects after resume/reload. */
export function dismissEventObjects(events: EventState): EventState {
  return { ...events, objects: [], rainEndsAt: null };
}

export function advanceEvents(
  initial: EventState,
  catalog: GameCatalog,
  effects: readonly ActiveEffect[],
  elapsed: number,
  wallStart: number,
  unlockOffset: number | null,
  autoGold = false,
) {
  const events = structuredClone(initial);
  const start = events.activeMs;
  const end = start + elapsed;
  if (!Number.isSafeInteger(end)) throw new RangeError('Active clock limit');
  let gold = '0';
  let collected = 0;
  let cursor = start;
  let unlockAt = !events.rainbowUnlocked && unlockOffset !== null ? start + unlockOffset : null;
  const { rain, rainbow, temporaryCap } = catalog.events;
  function random(min: number, max: number) {
    const next = draw(events.rng, min, max);
    events.rng = next.seed;
    return next.value;
  }
  function sequence() {
    if (events.sequence >= Number.MAX_SAFE_INTEGER) throw new RangeError('Event ID limit');
    return ++events.sequence;
  }
  for (;;) {
    if (unlockAt !== null && cursor >= unlockAt) {
      events.rainbowUnlocked = true;
      events.nextRainbowAt =
        cursor + random(rainbow.waitMinSeconds * 1000, rainbow.waitMaxSeconds * 1000);
      unlockAt = null;
    }
    if (cursor >= events.nextRainAt) {
      const id = sequence();
      events.rainEndsAt = cursor + Math.round(rain.durationSeconds * 1000);
      for (let index = 0; index < rain.count; index++) {
        const spawnsAt = cursor + index * rain.spawnEverySeconds * 1000;
        events.objects.push({
          id: `rain-${id}-${index}`,
          kind: 'gold',
          x: 10 + (index % 5) * 20 + random(-1, 1),
          lane: Math.floor(index / 5) % 2,
          spawnsAt,
          expiresAt: Math.min(
            spawnsAt + Math.round(rain.coinLifetimeSeconds * 1000),
            events.rainEndsAt,
          ),
        });
      }
      events.nextRainAt =
        events.rainEndsAt + random(rain.waitMinSeconds * 1000, rain.waitMaxSeconds * 1000);
    }
    if (events.nextRainbowAt !== null && cursor >= events.nextRainbowAt) {
      const id = sequence();
      const expiresAt = cursor + rainbow.lifetimeSeconds * 1000;
      events.objects.push({
        id: `rainbow-${id}`,
        kind: 'rainbow',
        x: random(15, 85),
        lane: 2,
        spawnsAt: cursor,
        expiresAt,
      });
      events.nextRainbowAt =
        expiresAt + random(rainbow.waitMinSeconds * 1000, rainbow.waitMaxSeconds * 1000);
    }
    if (events.rainEndsAt !== null && cursor >= events.rainEndsAt) events.rainEndsAt = null;
    events.objects = events.objects.filter((item) => item.expiresAt > cursor);
    const wall = wallStart + cursor - start;
    if (
      autoGold ||
      amount.compare(temporaryMultiplier(effects, 'magnet', wall, temporaryCap).value, '1') > 0
    ) {
      const caught = events.objects.filter(
        (item) => item.kind === 'gold' && item.spawnsAt <= cursor,
      );
      if (caught.length) {
        collected += caught.length;
        gold = amount.add(
          gold,
          amount.multiply(
            amount.multiply(rain.goldPerCoin, String(caught.length)),
            temporaryMultiplier(effects, 'gold', wall, temporaryCap).value,
          ),
        );
        const ids = new Set(caught.map((item) => item.id));
        events.objects = events.objects.filter((item) => !ids.has(item.id));
      }
    }
    if (cursor >= end) break;
    const boundaries = [
      end,
      events.nextRainAt,
      events.nextRainbowAt ?? end,
      events.rainEndsAt ?? end,
      unlockAt ?? end,
    ];
    for (const item of events.objects) boundaries.push(item.spawnsAt, item.expiresAt);
    for (const effect of effects)
      boundaries.push(start + effect.startsAt - wallStart, start + effect.expiresAt - wallStart);
    cursor = Math.min(...boundaries.filter((value) => value > cursor));
  }
  events.activeMs = end;
  return { events, gold, collected };
}
