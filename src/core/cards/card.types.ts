export type CardTarget =
  | 'clickFlat'
  | 'clickPercent'
  | 'productionPercent'
  | 'goldFlat'
  | 'rainLifetimeSeconds'
  | 'rainDurationSeconds'
  | 'rainbowWaitReduction'
  | 'frenzySeconds'
  | 'offlineBonus';
export interface CardDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  iconId: string;
  rarity: 'common' | 'rare' | 'epic';
  effects: { target: CardTarget; valuePerLevel: string }[];
}
export interface CardSynergy {
  id: string;
  nameKey: string;
  requires: string[];
  effects: { target: CardTarget; value: string }[];
}
export interface CardCollection {
  owned: Record<string, { level: number; duplicates: number; convertedGold: string }>;
  equipped: string[];
}
