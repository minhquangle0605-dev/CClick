import type { LootTable } from './chest.types';
import { draw } from '@core/events/random';

export function lootOdds(table: LootTable) {
  const total = table.entries.reduce((sum, item) => sum + item.weight, 0);
  return table.entries.map((entry) => ({ ...entry, total, probability: entry.weight / total }));
}
export function selectLoot(table: LootTable, roll: number) {
  const total = table.entries.reduce((sum, item) => sum + item.weight, 0);
  if (!Number.isSafeInteger(roll) || roll < 0 || roll >= total)
    throw new RangeError('Invalid loot roll');
  let cursor = roll;
  for (const entry of table.entries) {
    if (cursor < entry.weight) return entry.reward;
    cursor -= entry.weight;
  }
  throw new RangeError('Empty loot table');
}
export function drawLoot(table: LootTable, seed: number) {
  const total = table.entries.reduce((sum, item) => sum + item.weight, 0);
  const next = draw(seed, 0, total - 1);
  return { seed: next.seed, reward: selectLoot(table, next.value) };
}
