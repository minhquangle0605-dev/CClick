import { z } from 'zod';
import { amount } from '@shared/amount';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState, SaveEnvelope } from '@core/state/game-state';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { MAX_GENERATOR_COUNT } from '@core/shop/calculate-price';
import { createEventState } from '@core/events/scheduler';
import { expansionStateFields, validateExpansionState } from './expansion-state.schema';
import { collectionStateFields, validateCollectionState } from './collection-state.schema';
import { seedFromRun } from '@core/events/random';
import { progressionStateFields, validateProgressionState } from './progression-state.schema';
import { createTracking } from '@core/progression/progression.types';
import { vietnamDay } from '@core/daily-rewards/calendar';
import { refreshProgress } from '@core/progression/refresh-progress';
import { APP_VERSION } from '@shared/version';
import { createItemHistory } from '@core/statistics/item-history';
import { itemHistorySchema, validateItemHistory } from './item-history.schema';

export class SaveReadError extends Error {
  constructor(public readonly code: 'invalid' | 'future-version' | 'content-version') {
    super(code);
  }
}

const value = z.string().refine(amount.isValid);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const utc = z.iso.datetime();
const legacyStateSchema = z.strictObject({
  runId: z.string().min(1).max(128),
  revision: count,
  wallet: z.strictObject({ coin: value, goldCoin: value }),
  generators: z.record(z.string(), count.max(MAX_GENERATOR_COUNT)),
  purchasedUpgradeIds: z.array(z.string()).max(10000),
  statistics: z.strictObject({ clicks: count, totalProducedCoin: value, totalSpentCoin: value }),
  lastSimulatedAtUtc: utc,
});
const v2StateSchema = legacyStateSchema.extend({ offlineCps: value });
const v3StateSchema = v2StateSchema.extend(expansionStateFields);
const v4StateSchema = v3StateSchema.extend({
  ...collectionStateFields,
  statistics: legacyStateSchema.shape.statistics.extend({ totalGiftCoin: value }),
});
const v5StateSchema = v4StateSchema.extend(progressionStateFields);
const v6StateSchema = v5StateSchema.extend({
  offlineClickPower: value,
  automation: z.strictObject({
    upgradeEnabled: z.boolean(),
    clickRemainderMs: z.number().int().min(0).max(99),
    automaticClicks: count,
    actions: count,
    lastAction: z.string().max(160).nullable(),
  }),
});
const stateSchema = v6StateSchema.extend({ itemHistory: itemHistorySchema });
const envelopeFields = {
  contentVersion: z.string(),
  appVersion: z.string(),
  savedAtUtc: utc,
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
};
const legacyEnvelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(1),
  payload: legacyStateSchema,
});
const v2Envelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(2),
  payload: v2StateSchema,
});
const v3Envelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(3),
  payload: v3StateSchema,
});
const v4Envelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(4),
  payload: v4StateSchema,
});
const v5Envelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(5),
  payload: v5StateSchema,
});
const v6Envelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(6),
  payload: v6StateSchema,
});
const currentEnvelope = z.strictObject({
  ...envelopeFields,
  schemaVersion: z.literal(7),
  payload: stateSchema,
});
const envelopeSchema = z.discriminatedUnion('schemaVersion', [
  legacyEnvelope,
  v2Envelope,
  v3Envelope,
  v4Envelope,
  v5Envelope,
  v6Envelope,
  currentEnvelope,
]);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function checksum(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSave(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  nowUtc: string,
): Promise<SaveEnvelope> {
  const unsigned = {
    schemaVersion: 7 as const,
    contentVersion: catalog.balance.contentVersion,
    appVersion: APP_VERSION,
    savedAtUtc: nowUtc,
    payload: structuredClone(state),
  };
  return { ...unsigned, checksum: await checksum(unsigned) };
}

export async function decodeSave(input: unknown, catalog: GameCatalog): Promise<SaveEnvelope> {
  if (
    input &&
    typeof input === 'object' &&
    'schemaVersion' in input &&
    typeof input.schemaVersion === 'number' &&
    input.schemaVersion > 7
  ) {
    throw new SaveReadError('future-version');
  }
  const parsed = envelopeSchema.safeParse(input);
  if (!parsed.success) throw new SaveReadError('invalid');
  const { checksum: expected, ...unsigned } = parsed.data;
  const migrating =
    ((unsigned.schemaVersion === 1 && unsigned.contentVersion === '0.1.0') ||
      (unsigned.schemaVersion === 2 && unsigned.contentVersion === '0.2.0') ||
      (unsigned.schemaVersion === 3 && unsigned.contentVersion === '0.3.0') ||
      (unsigned.schemaVersion === 4 && unsigned.contentVersion === '0.4.0') ||
      (unsigned.schemaVersion === 5 && ['0.5.0', '0.6.0'].includes(unsigned.contentVersion)) ||
      (unsigned.schemaVersion === 6 && unsigned.contentVersion === '0.7.0')) &&
    catalog.balance.contentVersion === '0.7.0';
  if (
    !migrating &&
    (unsigned.schemaVersion !== 7 || unsigned.contentVersion !== catalog.balance.contentVersion)
  )
    throw new SaveReadError('content-version');
  if ((await checksum(unsigned)) !== expected) throw new SaveReadError('invalid');
  const legacyState = unsigned.payload;
  // The two P1 machines and its single upgrade retain exactly the same CPS in P2.
  // Resolve old production from the retained IDs before introducing new content.
  const oldCps = () => {
    let cps = '0';
    for (const [id, count] of Object.entries(legacyState.generators)) {
      const rate =
        id === 'generator.hand-press' ? '0.1' : id === 'generator.auto-press' ? '1' : null;
      if (!rate) throw new SaveReadError('invalid');
      cps = amount.add(cps, amount.multiply(rate, String(count)));
    }
    if (legacyState.purchasedUpgradeIds.some((id) => id !== 'upgrade.polished-die'))
      throw new SaveReadError('invalid');
    return cps;
  };
  const previous =
    unsigned.schemaVersion === 3 ||
    unsigned.schemaVersion === 4 ||
    unsigned.schemaVersion === 5 ||
    unsigned.schemaVersion === 6 ||
    unsigned.schemaVersion === 7
      ? unsigned.payload
      : {
          ...legacyState,
          offlineCps: unsigned.schemaVersion === 1 ? oldCps() : unsigned.payload.offlineCps,
          inventory: {},
          effects: [],
          effectsAtMs: Date.parse(legacyState.lastSimulatedAtUtc),
          events: createEventState(catalog, legacyState.runId),
        };
  const collectionState =
    unsigned.schemaVersion === 4 ||
    unsigned.schemaVersion === 5 ||
    unsigned.schemaVersion === 6 ||
    unsigned.schemaVersion === 7
      ? unsigned.payload
      : {
          ...previous,
          statistics: { ...previous.statistics, totalGiftCoin: '0' },
          offlineEfficiency: catalog.balance.offlineEfficiency,
          cards: { owned: {}, equipped: [] },
          chests: {
            rng: seedFromRun(previous.runId + ':chests'),
            opened: 0,
            starterClaimed: false,
            lastResult: null,
            acknowledged: true,
          },
        };
  const progressionState =
    unsigned.schemaVersion === 5 || unsigned.schemaVersion === 6 || unsigned.schemaVersion === 7
      ? unsigned.payload
      : {
          ...collectionState,
          tracking: createTracking(),
          daily: {
            claimCount: 0,
            lastClaimDay: null,
            highestDay: vietnamDay(collectionState.lastSimulatedAtUtc),
          },
          achievements: { unlockedIds: [], claimedIds: [] },
        };
  const automationState =
    unsigned.schemaVersion === 6 || unsigned.schemaVersion === 7
      ? unsigned.payload
      : {
          ...progressionState,
          offlineClickPower: '0',
          automation: {
            upgradeEnabled: false,
            clickRemainderMs: 0,
            automaticClicks: 0,
            actions: 0,
            lastAction: null,
          },
        };
  const state: GameState =
    unsigned.schemaVersion === 7
      ? unsigned.payload
      : {
          ...automationState,
          itemHistory: createItemHistory(unsigned.savedAtUtc, automationState),
        };
  // Old saves receive the new click baseline on their first settlement, never retroactively.
  if (
    Object.keys(state.generators).some(
      (id) => !catalog.generators.some((item) => item.id === id),
    ) ||
    state.purchasedUpgradeIds.some((id) => !catalog.upgrades.some((item) => item.id === id)) ||
    new Set(state.purchasedUpgradeIds).size !== state.purchasedUpgradeIds.length
  )
    throw new SaveReadError('invalid');
  try {
    validateExpansionState(state, catalog);
    validateCollectionState(state, catalog);
    validateProgressionState(state, catalog);
    validateItemHistory(state, catalog);
    if (state.automation.automaticClicks > state.statistics.clicks)
      throw new RangeError('Invalid automatic click count');
    if (
      !amount.sumsEqual(
        [state.wallet.coin, state.statistics.totalSpentCoin],
        [
          state.statistics.totalProducedCoin,
          state.statistics.totalGiftCoin,
          catalog.balance.initialCoin,
        ],
      )
    )
      throw new RangeError('Inconsistent ledger');
    productionPerSecond(state, catalog);
    clickPower(state, catalog);
    if (!Number.isSafeInteger(Object.values(state.generators).reduce((sum, n) => sum + n, 0)))
      throw new RangeError();
    for (const id of state.purchasedUpgradeIds) {
      const upgrade = catalog.upgrades.find((item) => item.id === id)!;
      if (
        upgrade.requires.some((required) =>
          required.startsWith('generator.')
            ? !state.generators[required]
            : !state.purchasedUpgradeIds.includes(required),
        )
      )
        throw new RangeError();
    }
  } catch {
    throw new SaveReadError('invalid');
  }
  if (unsigned.schemaVersion !== 7 || unsigned.contentVersion !== catalog.balance.contentVersion)
    return createSave(
      refreshProgress(state, catalog, state.lastSimulatedAtUtc),
      catalog,
      unsigned.savedAtUtc,
    );
  return parsed.data as SaveEnvelope;
}

export const MAX_SAVE_BYTES = 2 * 1024 * 1024;
export async function parseSaveFile(contents: string, catalog: GameCatalog): Promise<SaveEnvelope> {
  if (new TextEncoder().encode(contents).length > MAX_SAVE_BYTES)
    throw new SaveReadError('invalid');
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new SaveReadError('invalid');
  }
  return decodeSave(parsed, catalog);
}
