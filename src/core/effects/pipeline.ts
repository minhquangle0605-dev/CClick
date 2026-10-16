import { amount } from '@shared/amount';
import type { ActiveEffect, EffectTarget, Modifier } from './effect.types';

/** Flat additions, summed percentages per group, then independent multipliers. */
export function applyModifiers(base: string, target: EffectTarget, modifiers: readonly Modifier[]) {
  let flat = '0';
  const percentages = new Map<string, string>();
  const multipliers: string[] = [];
  for (const modifier of modifiers.filter((item) => item.target === target)) {
    if (modifier.operation === 'add') flat = amount.add(flat, modifier.value);
    else if (modifier.operation === 'percent')
      percentages.set(
        modifier.stackGroup,
        amount.add(percentages.get(modifier.stackGroup) ?? '0', modifier.value),
      );
    else multipliers.push(modifier.value);
  }
  let result = amount.add(base, flat);
  for (const [, percent] of [...percentages.entries()].sort(([a], [b]) => a.localeCompare(b)))
    result = amount.multiply(result, amount.add('1', amount.multiply(percent, '0.01')));
  for (const multiplier of multipliers) result = amount.multiply(result, multiplier);
  return result;
}

export function temporaryMultiplier(
  effects: readonly ActiveEffect[],
  target: EffectTarget,
  at: number,
  cap: string,
) {
  const groups = new Map<string, string>();
  for (const effect of effects) {
    if (effect.target !== target || effect.startsAt > at || effect.expiresAt <= at) continue;
    const current = groups.get(effect.stackGroup) ?? '1';
    if (amount.compare(effect.value, current) > 0) groups.set(effect.stackGroup, effect.value);
  }
  const values = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
  const capped = amount.productCapped(values, cap);
  // Test cap status without computing a potentially overflowing full product.
  const overCap = amount.productCapped(values, amount.add(cap, '1'));
  return { value: capped, capped: amount.compare(overCap, cap) > 0 };
}

export function extendEffect(
  effects: readonly ActiveEffect[],
  effect: ActiveEffect,
  durationMs: number,
  maxRemainingMs: number,
): ActiveEffect[] {
  const previous = effects.find(
    (item) =>
      item.sourceId === effect.sourceId &&
      item.target === effect.target &&
      item.expiresAt > effect.startsAt,
  );
  const expiresAt = Math.min(
    effect.startsAt + maxRemainingMs,
    Math.max(effect.startsAt, previous?.expiresAt ?? 0) + durationMs,
  );
  return [
    ...effects.filter(
      (item) =>
        !(item.sourceId === effect.sourceId && item.target === effect.target) &&
        item.expiresAt > effect.startsAt,
    ),
    { ...effect, expiresAt },
  ];
}
