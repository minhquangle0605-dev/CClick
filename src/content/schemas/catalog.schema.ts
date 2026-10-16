import { z } from 'zod';
import { progressionFields, validateProgression } from './progression.schema';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { amount as economyAmount } from '@shared/amount';
import { boosterSchema, eventsSchema, itemOfferSchema } from './expansion.schema';
import { collectionFields, validateCollection } from './collection.schema';

const amount = z
  .string()
  .regex(/^(0|[1-9]\d{0,100})(\.\d{1,18})?$/, 'Số thập phân không âm dạng chuỗi')
  .refine(economyAmount.isValid, 'Giá trị vượt phạm vi Amount');
const positiveAmount = amount.refine(
  (value) => economyAmount.isValid(value) && economyAmount.compare(value, '0') > 0,
  'Phải lớn hơn 0',
);
const generator = z.strictObject({
  id: z.string().regex(/^generator\.[a-z0-9-]+$/),
  nameKey: z.string(),
  descriptionKey: z.string(),
  iconId: z.string(),
  basePrice: positiveAmount,
  baseCps: positiveAmount,
  priceGrowth: amount.refine(
    (value) => economyAmount.isValid(value) && economyAmount.compare(value, '1') > 0,
    'Hệ số giá phải lớn hơn 1',
  ),
  unlockAt: amount,
});
const upgrade = z.strictObject({
  id: z.string().regex(/^upgrade\.[a-z0-9-]+$/),
  nameKey: z.string(),
  descriptionKey: z.string(),
  iconId: z.string(),
  price: positiveAmount,
  requires: z.array(z.string()),
  effect: z.strictObject({
    target: z.enum(['click', 'production']),
    operation: z.enum(['add', 'multiply']),
    value: positiveAmount,
  }),
});

export const catalogSchema = z.strictObject({
  ...progressionFields,
  ...collectionFields,
  balance: z.strictObject({
    contentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    initialCoin: amount,
    initialGold: amount,
    baseClick: positiveAmount,
    milestoneCoin: positiveAmount,
    longTermMilestone: positiveAmount,
    autosaveSeconds: z.number().int().positive(),
    offlineCapSeconds: z.number().int().positive(),
    offlineEfficiency: amount.refine(
      (value) => economyAmount.isValid(value) && economyAmount.compare(value, '1') <= 0,
      'Hiệu suất không vượt 1',
    ),
  }),
  generators: z.array(generator).min(1),
  upgrades: z.array(upgrade).min(1),
  boosters: z.array(boosterSchema).min(1),
  events: eventsSchema,
  itemOffers: z.array(itemOfferSchema).min(1),
});

export function validateCatalog(
  input: unknown,
  translations: Record<string, string>,
  iconIds: readonly string[],
): GameCatalog {
  const catalog = catalogSchema.parse(input);
  const inventory = [...catalog.boosters, ...catalog.chests, ...catalog.keys];
  const items = [...catalog.generators, ...catalog.upgrades, ...inventory, ...catalog.cards];
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`ID trùng: ${item.id}`);
    ids.add(item.id);
    for (const key of [item.nameKey, item.descriptionKey]) {
      if (!translations[key]?.trim()) throw new Error(`Thiếu bản dịch: ${key}`);
    }
    if (!iconIds.includes(item.iconId)) throw new Error(`Thiếu icon: ${item.iconId}`);
  }
  const prerequisites = new Map(catalog.upgrades.map((item) => [item.id, item.requires]));
  const visited = new Set<string>();
  const active = new Set<string>();
  function visit(id: string): void {
    if (active.has(id)) throw new Error(`Vòng điều kiện mở khóa: ${id}`);
    if (visited.has(id)) return;
    active.add(id);
    for (const required of prerequisites.get(id) ?? []) {
      if (!ids.has(required)) throw new Error(`Tham chiếu không tồn tại: ${required}`);
      visit(required);
    }
    active.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);
  const offers = new Set<string>();
  for (const offer of catalog.itemOffers) {
    if (offers.has(offer.id)) throw new Error(`ID trùng: ${offer.id}`);
    offers.add(offer.id);
    if (!inventory.some((item) => item.id === offer.itemId))
      throw new Error(`Tham chiếu không tồn tại: ${offer.itemId}`);
  }
  for (const item of inventory)
    if (!catalog.itemOffers.some((offer) => offer.itemId === item.id))
      throw new Error(`Vật phẩm thiếu nguồn nhận: ${item.id}`);
  validateCollection(catalog, translations);
  validateProgression(catalog, translations);
  return catalog;
}
