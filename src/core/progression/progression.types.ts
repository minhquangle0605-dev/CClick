import type { Reward } from '@core/rewards/reward.types';

export type ProducedSource = 'click' | 'production' | 'offline' | 'timeWarp';
export type GiftSource = 'chest' | 'daily' | 'achievement';
export type CoinSource = ProducedSource | GiftSource;
export interface ProgressTracking {
  coin: Record<CoinSource, string>;
  goldFromEvents: string;
  eventCoins: number;
  rainbows: number;
  boostersUsed: number;
  activeMs: number;
}
export interface DailyState {
  claimCount: number;
  lastClaimDay: number | null;
  highestDay: number;
}
export interface AchievementState {
  unlockedIds: string[];
  claimedIds: string[];
}
export type AchievementMetric =
  | 'clicks'
  | 'produced'
  | 'machines'
  | 'upgrades'
  | 'eventCoins'
  | 'rainbows'
  | 'cards'
  | 'chests'
  | 'daily';
export interface AchievementDefinition {
  id: string;
  nameKey: string;
  metric: AchievementMetric;
  target: string;
  rewards: Reward[];
}
export interface DailyDefinition {
  day: number;
  rewards: Reward[];
}

export function createTracking(): ProgressTracking {
  return {
    coin: {
      click: '0',
      production: '0',
      offline: '0',
      timeWarp: '0',
      chest: '0',
      daily: '0',
      achievement: '0',
    },
    goldFromEvents: '0',
    eventCoins: 0,
    rainbows: 0,
    boostersUsed: 0,
    activeMs: 0,
  };
}
