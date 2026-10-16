import type { AmountString } from '@shared/amount';
import type { ActiveEffect } from '@core/effects/effect.types';
import type { EventState } from '@core/events/event.types';
import type { CardCollection } from '@core/cards/card.types';
import type { ChestState } from '@core/chests/chest.types';
import type { ItemHistory } from '@core/statistics/item-history.types';
import type {
  DailyState,
  AchievementState,
  ProgressTracking,
} from '@core/progression/progression.types';

/** Schema 7. Add later systems only together with their migrations. */
export interface GameState {
  runId: string;
  revision: number;
  wallet: { coin: AmountString; goldCoin: AmountString };
  generators: Record<string, number>;
  purchasedUpgradeIds: string[];
  statistics: {
    clicks: number;
    totalProducedCoin: AmountString;
    totalSpentCoin: AmountString;
    totalGiftCoin: AmountString;
  };
  lastSimulatedAtUtc: string;
  offlineCps: AmountString;
  offlineEfficiency: AmountString;
  offlineClickPower: AmountString;
  automation: {
    upgradeEnabled: boolean;
    clickRemainderMs: number;
    automaticClicks: number;
    actions: number;
    lastAction: string | null;
  };
  inventory: Record<string, number>;
  effects: ActiveEffect[];
  effectsAtMs: number;
  events: EventState;
  cards: CardCollection;
  chests: ChestState;
  daily: DailyState;
  achievements: AchievementState;
  tracking: ProgressTracking;
  itemHistory: ItemHistory;
}

export interface SaveEnvelope {
  schemaVersion: 7;
  contentVersion: string;
  appVersion: string;
  savedAtUtc: string;
  checksum: string;
  payload: GameState;
}
