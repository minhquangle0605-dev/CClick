import { z } from 'zod';
import { amount } from '@shared/amount';
const positive = z
  .string()
  .refine((value) => amount.isValid(value) && amount.compare(value, '0') > 0);
const multiplier = positive.refine(
  (value) => amount.compare(value, '1') >= 0 && amount.compare(value, '1000') <= 0,
);
const integer = positive.refine((value) => /^\d+$/.test(value));
const seconds = z.number().int().positive().max(86400);
export const boosterSchema = z
  .strictObject({
    id: z.string().regex(/^booster\.[a-z0-9-]+$/),
    nameKey: z.string(),
    descriptionKey: z.string(),
    iconId: z.string(),
    durationSeconds: seconds.or(z.literal(0)),
    maxDurationSeconds: seconds.or(z.literal(0)),
    warpSeconds: seconds.or(z.literal(0)),
    effects: z
      .array(
        z.strictObject({
          target: z.enum(['production', 'click', 'gold', 'magnet']),
          value: multiplier,
          stackGroup: z.string().min(1),
        }),
      )
      .max(4),
  })
  .refine(
    (item) =>
      item.warpSeconds > 0
        ? item.effects.length === 0 && item.durationSeconds === 0 && item.maxDurationSeconds === 0
        : item.effects.length > 0 &&
          item.durationSeconds > 0 &&
          item.maxDurationSeconds >= item.durationSeconds,
    'Booster duration/effect mismatch',
  )
  .refine(
    (item) => new Set(item.effects.map((effect) => effect.target)).size === item.effects.length,
    'Duplicate effect target',
  )
  .refine(
    (item) =>
      item.effects.every(
        (effect) =>
          (effect.target !== 'gold' || /^\d+$/.test(effect.value)) &&
          (effect.target !== 'magnet' || amount.compare(effect.value, '1') > 0),
      ),
    'Gold must stay integer; Magnet must be active',
  );
export const eventsSchema = z
  .strictObject({
    temporaryCap: multiplier.refine((value) => /^\d+$/.test(value)),
    rain: z.strictObject({
      waitMinSeconds: seconds,
      waitMaxSeconds: seconds,
      durationSeconds: seconds,
      count: z.number().int().min(1).max(10),
      spawnEverySeconds: seconds,
      coinLifetimeSeconds: seconds,
      goldPerCoin: integer,
    }),
    rainbow: z.strictObject({
      unlockAt: positive,
      waitMinSeconds: seconds,
      waitMaxSeconds: seconds,
      lifetimeSeconds: seconds,
      frenzySeconds: seconds,
      maxFrenzySeconds: seconds,
      productionMultiplier: multiplier,
      clickMultiplier: multiplier,
      goldMultiplier: integer,
    }),
  })
  .refine(
    (rules) =>
      rules.rain.waitMaxSeconds >= rules.rain.waitMinSeconds &&
      rules.rainbow.waitMaxSeconds >= rules.rainbow.waitMinSeconds &&
      (rules.rain.count - 1) * rules.rain.spawnEverySeconds < rules.rain.durationSeconds &&
      rules.rainbow.maxFrenzySeconds >= rules.rainbow.frenzySeconds,
    'Invalid event schedule',
  );
export const itemOfferSchema = z.strictObject({
  id: z.string().regex(/^offer\.[a-z0-9-]+$/),
  itemId: z.string(),
  goldPrice: integer,
});
