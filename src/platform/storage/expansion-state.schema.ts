import { z } from 'zod';
import { amount } from '@shared/amount';
import { MAX_ITEM_COUNT } from '@core/boosters/use-booster';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { inventoryDefinitions } from '@core/catalog/inventory';

const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const expansionStateFields = {
  inventory: z.record(z.string(), z.number().int().nonnegative().max(MAX_ITEM_COUNT)),
  effectsAtMs: time.max(8640000000000000),
  effects: z
    .array(
      z.strictObject({
        sourceId: z.string(),
        target: z.enum(['production', 'click', 'gold', 'magnet']),
        operation: z.literal('multiply'),
        value: z.string().refine(amount.isValid),
        stackGroup: z.string(),
        startsAt: time,
        expiresAt: time,
        stackPolicy: z.literal('extend'),
      }),
    )
    .max(32),
  events: z.strictObject({
    activeMs: time,
    rng: z.number().int().min(1).max(4294967295),
    sequence: time,
    nextRainAt: time,
    rainEndsAt: time.nullable(),
    nextRainbowAt: time.nullable(),
    rainbowUnlocked: z.boolean(),
    objects: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(128),
          kind: z.enum(['gold', 'rainbow']),
          x: z.number().min(0).max(100),
          lane: z.number().int().min(0).max(2),
          spawnsAt: time,
          expiresAt: time,
        }),
      )
      .max(33),
  }),
};

export function validateExpansionState(state: GameState, catalog: GameCatalog) {
  if (amount.normalize(state.wallet.goldCoin).includes('.'))
    throw new RangeError('Fractional Gold');
  for (const id of Object.keys(state.inventory))
    if (!inventoryDefinitions(catalog).some((item) => item.id === id))
      throw new RangeError('Unknown inventory item');
  const keys = new Set<string>();
  for (const effect of state.effects) {
    const key = `${effect.sourceId}:${effect.target}`;
    if (keys.has(key) || effect.startsAt > state.effectsAtMs || effect.expiresAt <= effect.startsAt)
      throw new RangeError('Invalid effect timeline');
    keys.add(key);
    const booster = catalog.boosters.find((item) => item.id === effect.sourceId);
    const definition = booster?.effects.find((item) => item.target === effect.target);
    const frenzy = catalog.events.rainbow;
    const frenzyValue =
      effect.target === 'production'
        ? frenzy.productionMultiplier
        : effect.target === 'click'
          ? frenzy.clickMultiplier
          : effect.target === 'gold'
            ? frenzy.goldMultiplier
            : null;
    const expected =
      definition ??
      (effect.sourceId === 'event.frenzy' && frenzyValue
        ? { value: frenzyValue, stackGroup: 'frenzy' }
        : null);
    const maxDuration = booster ? booster.maxDurationSeconds : catalog.unlocks.maxFrenzySeconds;
    if (
      !expected ||
      expected.value !== effect.value ||
      expected.stackGroup !== effect.stackGroup ||
      effect.expiresAt - effect.startsAt > maxDuration * 1000
    )
      throw new RangeError('Unknown effect');
  }
  const events = state.events;
  if (
    events.nextRainAt <= events.activeMs ||
    (events.nextRainbowAt !== null && events.nextRainbowAt <= events.activeMs) ||
    events.rainbowUnlocked !== (events.nextRainbowAt !== null) ||
    (events.rainEndsAt !== null && events.rainEndsAt <= events.activeMs)
  )
    throw new RangeError('Invalid event clock');
  if (new Set(events.objects.map((item) => item.id)).size !== events.objects.length)
    throw new RangeError('Duplicate event ID');
  for (const object of events.objects)
    if (
      object.expiresAt <= object.spawnsAt ||
      object.expiresAt <= events.activeMs ||
      (object.kind === 'gold' && events.rainEndsAt === null) ||
      (object.kind === 'rainbow' && !events.rainbowUnlocked)
    )
      throw new RangeError('Invalid event object');
}
