import type { AmountString } from '@shared/amount';
import type { AchievementDefinition, DailyDefinition } from '@core/progression/progression.types';
import type { EffectTarget } from '@core/effects/effect.types';
import type { CardDefinition, CardSynergy } from '@core/cards/card.types';
import type { ChestDefinition, InventoryItemDefinition, LootTable } from '@core/chests/chest.types';

export interface BoosterDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  iconId: string;
  durationSeconds: number;
  maxDurationSeconds: number;
  warpSeconds: number;
  effects: { target: EffectTarget; value: string; stackGroup: string }[];
}
export interface EventRules {
  temporaryCap: string;
  rain: {
    waitMinSeconds: number;
    waitMaxSeconds: number;
    durationSeconds: number;
    count: number;
    spawnEverySeconds: number;
    coinLifetimeSeconds: number;
    goldPerCoin: string;
  };
  rainbow: {
    unlockAt: string;
    waitMinSeconds: number;
    waitMaxSeconds: number;
    lifetimeSeconds: number;
    frenzySeconds: number;
    maxFrenzySeconds: number;
    productionMultiplier: string;
    clickMultiplier: string;
    goldMultiplier: string;
  };
}

export interface GeneratorDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  iconId: string;
  basePrice: AmountString;
  baseCps: AmountString;
  priceGrowth: AmountString;
  unlockAt: AmountString;
}

export interface UpgradeDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  iconId: string;
  price: AmountString;
  requires: string[];
  effect: { target: 'click' | 'production'; operation: 'add' | 'multiply'; value: AmountString };
}

export interface GameCatalog {
  dailyRewards: DailyDefinition[];
  achievements: AchievementDefinition[];
  balance: {
    contentVersion: string;
    initialCoin: AmountString;
    initialGold: AmountString;
    baseClick: AmountString;
    milestoneCoin: AmountString;
    longTermMilestone: AmountString;
    autosaveSeconds: number;
    offlineCapSeconds: number;
    offlineEfficiency: AmountString;
  };
  generators: GeneratorDefinition[];
  upgrades: UpgradeDefinition[];
  boosters: BoosterDefinition[];
  events: EventRules;
  itemOffers: { id: string; itemId: string; goldPrice: string }[];
  cards: CardDefinition[];
  cardSynergies: CardSynergy[];
  cardProgression: {
    maxLevel: number;
    upgradeCosts: { level: number; duplicates: number; coin: string }[];
    rarityCost: Record<'common' | 'rare' | 'epic', string>;
    maxDuplicateGold: Record<'common' | 'rare' | 'epic', string>;
  };
  chests: ChestDefinition[];
  keys: InventoryItemDefinition[];
  lootTables: LootTable[];
  unlocks: {
    initialCardSlots: number;
    thirdCardSlotAt: string;
    starterChestAt: string;
    starterChestId: string;
    maxFrenzySeconds: number;
    maxRainSeconds: number;
    maxRainLifetimeSeconds: number;
    minRainbowWaitMultiplier: string;
  };
}
