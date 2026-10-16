import type { Reward, AppliedReward } from '@core/rewards/reward.types';
export interface InventoryItemDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  iconId: string;
}
export interface ChestDefinition extends InventoryItemDefinition {
  keyId: string | null;
  guaranteed: Reward[];
  draws: { tableId: string; count: number }[];
}
export interface LootTable {
  id: string;
  entries: { weight: number; reward: Reward }[];
}
export interface ChestReceipt {
  id: number;
  chestId: string;
  openedAtUtc: string;
  rewards: AppliedReward[];
}
export interface ChestState {
  rng: number;
  opened: number;
  starterClaimed: boolean;
  lastResult: ChestReceipt | null;
  acknowledged: boolean;
}
