import { z } from 'zod';
import { amount } from '@shared/amount';
import type { GameCatalog } from '@core/catalog/catalog.types';
const money = z.string().refine((value) => amount.isValid(value) && amount.compare(value, '0') > 0);
const integer = money.refine((value) => /^\d+$/.test(value));
const target = z.enum([
  'clickFlat',
  'clickPercent',
  'productionPercent',
  'goldFlat',
  'rainLifetimeSeconds',
  'rainDurationSeconds',
  'rainbowWaitReduction',
  'frenzySeconds',
  'offlineBonus',
]);
const bonus = money.refine(
  (value) => amount.compare(value, '100') <= 0 && /^\d+(\.\d{1,3})?$/.test(value),
);
const effect = z
  .strictObject({ target, valuePerLevel: bonus })
  .refine((effect) => effect.target !== 'goldFlat' || /^\d+$/.test(effect.valuePerLevel));
export const rewardSchema = z.discriminatedUnion('kind', [
  z
    .strictObject({
      kind: z.literal('currency'),
      currency: z.enum(['coin', 'goldCoin']),
      amount: money,
    })
    .refine((reward) => reward.currency !== 'goldCoin' || /^\d+$/.test(reward.amount)),
  z.strictObject({
    kind: z.literal('item'),
    itemId: z.string(),
    quantity: z.number().int().min(1).max(10),
  }),
  z.strictObject({
    kind: z.literal('card'),
    cardId: z.string(),
    quantity: z.number().int().min(1).max(10),
  }),
]);
const named = {
  id: z.string(),
  nameKey: z.string(),
  descriptionKey: z.string(),
  iconId: z.string(),
};
export const collectionFields = {
  cards: z
    .array(
      z.strictObject({
        ...named,
        id: z.string().regex(/^card\.[a-z0-9-]+$/),
        rarity: z.enum(['common', 'rare', 'epic']),
        effects: z.array(effect).min(1).max(4),
      }),
    )
    .min(12),
  cardSynergies: z
    .array(
      z.strictObject({
        id: z.string().regex(/^synergy\.[a-z0-9-]+$/),
        nameKey: z.string(),
        requires: z.array(z.string()).min(2).max(3),
        effects: z
          .array(
            z
              .strictObject({ target, value: bonus })
              .refine((effect) => effect.target !== 'goldFlat' || /^\d+$/.test(effect.value)),
          )
          .min(1)
          .max(4),
      }),
    )
    .min(3),
  cardProgression: z.strictObject({
    maxLevel: z.literal(10),
    upgradeCosts: z
      .array(
        z.strictObject({
          level: z.number().int().min(2).max(10),
          duplicates: z.number().int().min(1).max(999999),
          coin: integer,
        }),
      )
      .length(9),
    rarityCost: z.strictObject({ common: integer, rare: integer, epic: integer }),
    maxDuplicateGold: z.strictObject({ common: integer, rare: integer, epic: integer }),
  }),
  chests: z
    .array(
      z.strictObject({
        ...named,
        id: z.string().regex(/^chest\.[a-z0-9-]+$/),
        keyId: z.string().nullable(),
        guaranteed: z.array(rewardSchema).max(10),
        draws: z
          .array(z.strictObject({ tableId: z.string(), count: z.number().int().min(1).max(5) }))
          .min(1)
          .max(3),
      }),
    )
    .min(2),
  keys: z.array(z.strictObject({ ...named, id: z.string().regex(/^key\.[a-z0-9-]+$/) })).min(1),
  lootTables: z
    .array(
      z.strictObject({
        id: z.string().regex(/^loot\.[a-z0-9-]+$/),
        entries: z
          .array(
            z.strictObject({ weight: z.number().int().min(1).max(10000), reward: rewardSchema }),
          )
          .min(1)
          .max(100),
      }),
    )
    .min(1),
  unlocks: z.strictObject({
    initialCardSlots: z.literal(2),
    thirdCardSlotAt: money,
    starterChestAt: money,
    starterChestId: z.string(),
    maxFrenzySeconds: z.number().int().min(40).max(120),
    maxRainSeconds: z.number().int().min(15).max(60),
    maxRainLifetimeSeconds: z.number().int().min(6).max(30),
    minRainbowWaitMultiplier: money.refine((value) => amount.compare(value, '1') <= 0),
  }),
};
export function validateCollection(catalog: GameCatalog, translations: Record<string, string>) {
  const cards = new Set(catalog.cards.map((item) => item.id));
  const inventory = new Set(
    [...catalog.boosters, ...catalog.chests, ...catalog.keys].map((item) => item.id),
  );
  const ids = new Set<string>();
  for (const item of [...catalog.cardSynergies, ...catalog.lootTables]) {
    if (ids.has(item.id)) throw new Error(`ID trùng: ${item.id}`);
    ids.add(item.id);
  }
  for (const synergy of catalog.cardSynergies) {
    if (!translations[synergy.nameKey]) throw new Error(`Thiếu bản dịch: ${synergy.nameKey}`);
    if (
      new Set(synergy.requires).size !== synergy.requires.length ||
      synergy.requires.some((id) => !cards.has(id))
    )
      throw new Error('Invalid synergy references');
  }
  if (catalog.cardProgression.upgradeCosts.some((cost, index) => cost.level !== index + 2))
    throw new Error('Missing card upgrade level');
  function checkReward(reward: z.infer<typeof rewardSchema>) {
    if (
      (reward.kind === 'card' && !cards.has(reward.cardId)) ||
      (reward.kind === 'item' && !inventory.has(reward.itemId))
    )
      throw new Error('Unknown loot reward');
  }
  for (const table of catalog.lootTables)
    for (const entry of table.entries) checkReward(entry.reward);
  const reachable = new Set<string>();
  for (const chest of catalog.chests) {
    if (chest.keyId && !catalog.keys.some((key) => key.id === chest.keyId))
      throw new Error('Unknown chest key');
    for (const reward of chest.guaranteed) {
      checkReward(reward);
      if (reward.kind === 'card') reachable.add(reward.cardId);
    }
    for (const draw of chest.draws) {
      const table = catalog.lootTables.find((table) => table.id === draw.tableId);
      if (!table) throw new Error('Unknown loot table');
      for (const entry of table.entries)
        if (entry.reward.kind === 'card') reachable.add(entry.reward.cardId);
    }
  }
  if (catalog.cards.some((card) => !reachable.has(card.id))) throw new Error('Unreachable card');
  if (!catalog.chests.some((chest) => chest.id === catalog.unlocks.starterChestId && !chest.keyId))
    throw new Error('Starter chest must open without a key');
}
