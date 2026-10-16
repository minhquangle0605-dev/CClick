import { z } from 'zod';
import { amount } from '@shared/amount';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { rewardSchema } from './collection.schema';
import { inventoryDefinitions } from '@core/catalog/inventory';

const rewards = z.array(rewardSchema).min(1).max(10);
export const progressionFields = {
  dailyRewards: z.array(z.strictObject({ day: z.number().int().min(1).max(7), rewards })).length(7),
  achievements: z
    .array(
      z.strictObject({
        id: z.string().regex(/^achievement\.[a-z0-9-]+$/),
        nameKey: z.string(),
        metric: z.enum([
          'clicks',
          'produced',
          'machines',
          'upgrades',
          'eventCoins',
          'rainbows',
          'cards',
          'chests',
          'daily',
        ]),
        target: z
          .string()
          .refine((value) => amount.isValid(value) && amount.compare(value, '0') > 0),
        rewards,
      }),
    )
    .min(1)
    .max(200),
};
export function validateProgression(catalog: GameCatalog, translations: Record<string, string>) {
  if (catalog.dailyRewards.some((reward, index) => reward.day !== index + 1))
    throw new Error('Daily sequence must be 1 through 7');
  const ids = new Set<string>();
  for (const item of catalog.achievements) {
    if (ids.has(item.id) || !translations[item.nameKey]?.trim())
      throw new Error('Invalid achievement ID/translation');
    ids.add(item.id);
  }
  const inventory = new Set(inventoryDefinitions(catalog).map((item) => item.id));
  for (const definition of [...catalog.dailyRewards, ...catalog.achievements])
    for (const reward of definition.rewards) {
      if (
        (reward.kind === 'item' && !inventory.has(reward.itemId)) ||
        (reward.kind === 'card' && !catalog.cards.some((card) => card.id === reward.cardId))
      )
        throw new Error('Unknown progression reward');
    }
}
