export const itemSources = ['shop', 'chest', 'daily', 'achievement', 'starter'] as const;
export const itemUses = ['activated', 'opened', 'key', 'upgrade', 'converted'] as const;
export type ItemSource = (typeof itemSources)[number];
export type ItemUse = (typeof itemUses)[number];
export interface ItemHistoryEntry {
  opening: number;
  earned: Partial<Record<ItemSource, number | undefined>>;
  spent: Partial<Record<ItemUse, number | undefined>>;
}
export interface ItemHistory {
  sinceUtc: string;
  complete: boolean;
  entries: Record<string, ItemHistoryEntry>;
}
