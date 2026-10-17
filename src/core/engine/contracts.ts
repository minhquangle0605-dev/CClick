import type { AmountString } from '@shared/amount';
import type { Result } from '@shared/result';
import type { GameState } from '@core/state/game-state';
import type { Reward } from '@core/rewards/reward.types';

export type PurchaseQuantity = number | 'max';
export type DurableCommand =
  | { type: 'SetAutoUpgrade'; enabled: boolean }
  | { type: 'SetAutoEquip'; enabled: boolean }
  | { type: 'ClaimDaily' }
  | { type: 'ClaimAchievement'; achievementId: string }
  | { type: 'PurchaseItem'; offerId: string }
  | { type: 'UseBooster'; itemId: string }
  | { type: 'CollectEvent'; objectId: string }
  | { type: 'EquipCard'; cardId: string }
  | { type: 'UnequipCard'; cardId: string }
  | { type: 'UpgradeCard'; cardId: string }
  | { type: 'OpenChest'; chestId: string }
  | { type: 'AcknowledgeChest'; receiptId: number }
  | { type: 'ClaimStarterChest' };
export type GameCommand =
  | DurableCommand
  | { type: 'ClickCoin' }
  | { type: 'PurchaseGenerator'; generatorId: string; quantity: PurchaseQuantity }
  | { type: 'PurchaseUpgrade'; upgradeId: string };

export type DomainEvent =
  | { type: 'AutomationChanged' }
  | { type: 'AutoUpgraded'; count: number }
  | { type: 'DailyClaimed'; day: number }
  | { type: 'AchievementClaimed'; achievementId: string }
  | { type: 'CoinEarned'; amount: AmountString; source: 'click' | 'production' | 'time-warp' }
  | { type: 'GoldEarned'; amount: AmountString }
  | { type: 'ItemPurchased'; itemId: string }
  | { type: 'BoosterUsed'; itemId: string }
  | { type: 'EventCollected'; objectId: string }
  | { type: 'CardChanged'; cardId: string }
  | { type: 'ChestOpened'; receiptId: number }
  | { type: 'ChestAcknowledged'; receiptId: number }
  | { type: 'GeneratorPurchased'; generatorId: string; quantity: number }
  | { type: 'UpgradePurchased'; upgradeId: string };

export type RewardBundle = readonly Reward[];

export type CommandError =
  | 'clock-rollback'
  | 'daily-claimed'
  | 'already-claimed'
  | 'insufficient-funds'
  | 'unknown-item'
  | 'invalid-quantity'
  | 'already-owned'
  | 'not-implemented'
  | 'numeric-limit'
  | 'paused'
  | 'locked'
  | 'missing-item'
  | 'effect-cap'
  | 'no-production'
  | 'expired-event'
  | 'save-failed'
  | 'requires-commit'
  | 'card-not-owned'
  | 'slots-full'
  | 'max-level'
  | 'missing-duplicates'
  | 'missing-key'
  | 'unread-result'
  | 'stale-result';
export type CommandResult = Result<{ state: GameState; events: DomainEvent[] }, CommandError>;
export type DurableAction = (command: DurableCommand) => Promise<CommandResult>;

export interface GameEngine {
  getSnapshot(): Readonly<GameState>;
  dispatch(command: GameCommand): CommandResult;
  subscribe(listener: () => void): () => void;
  tick(): CommandResult;
  pause(): CommandResult;
  resume(): void;
  replaceState(state: GameState): void;
}
