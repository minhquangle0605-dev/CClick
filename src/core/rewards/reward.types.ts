export type Reward =
  | { kind: 'currency'; currency: 'coin' | 'goldCoin'; amount: string }
  | { kind: 'item'; itemId: string; quantity: number }
  | { kind: 'card'; cardId: string; quantity: number };
export type AppliedReward = Reward & {
  note?: 'new' | 'duplicate' | 'converted' | undefined;
  sourceCardId?: string | undefined;
};
