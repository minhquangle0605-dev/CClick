import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from './game-state';
import { createEventState } from '@core/events/scheduler';
import { seedFromRun } from '@core/events/random';
import { createTracking } from '@core/progression/progression.types';
import { vietnamDay } from '@core/daily-rewards/calendar';
import { createItemHistory } from '@core/statistics/item-history';

export function createInitialState(catalog: GameCatalog, runId: string, nowUtc: string): GameState {
  return {
    runId,
    revision: 0,
    daily: { claimCount: 0, lastClaimDay: null, highestDay: vietnamDay(nowUtc) },
    achievements: { unlockedIds: [], claimedIds: [] },
    tracking: createTracking(),
    itemHistory: createItemHistory(nowUtc),
    wallet: { coin: catalog.balance.initialCoin, goldCoin: catalog.balance.initialGold },
    generators: {},
    purchasedUpgradeIds: [],
    statistics: { clicks: 0, totalProducedCoin: '0', totalSpentCoin: '0', totalGiftCoin: '0' },
    lastSimulatedAtUtc: nowUtc,
    offlineCps: '0',
    offlineEfficiency: catalog.balance.offlineEfficiency,
    offlineClickPower: catalog.balance.baseClick,
    automation: {
      upgradeEnabled: false,
      autoEquipEnabled: true,
      clickRemainderMs: 0,
      automaticClicks: 0,
      actions: 0,
      lastAction: null,
    },
    inventory: {},
    effects: [],
    effectsAtMs: Date.parse(nowUtc),
    events: createEventState(catalog, runId),
    cards: { owned: {}, equipped: [] },
    chests: {
      rng: seedFromRun(runId + ':chests'),
      opened: 0,
      starterClaimed: false,
      lastResult: null,
      acknowledged: true,
    },
  };
}
