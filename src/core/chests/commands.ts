import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CommandResult, DurableCommand, CommandError } from '@core/engine/contracts';
import { grantRewards } from '@core/rewards/grant-rewards';
import { drawLoot } from './loot';
import { amount } from '@shared/amount';
import { recordItem } from '@core/statistics/item-history';

export function chestError(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  chestId: string,
): CommandError | null {
  const chest = catalog.chests.find((chest) => chest.id === chestId);
  if (!chest) return 'unknown-item';
  if (state.chests.lastResult && !state.chests.acknowledged) return 'unread-result';
  if (!(state.inventory[chest.id] ?? 0)) return 'missing-item';
  if (chest.keyId && !(state.inventory[chest.keyId] ?? 0)) return 'missing-key';
  return null;
}
export function chestCommand(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  command: Extract<
    DurableCommand,
    { type: 'OpenChest' | 'AcknowledgeChest' | 'ClaimStarterChest' }
  >,
  nowUtc: string,
): CommandResult {
  if (command.type === 'AcknowledgeChest') {
    if (state.chests.lastResult?.id !== command.receiptId || state.chests.acknowledged)
      return { ok: false, error: 'stale-result' };
    return {
      ok: true,
      value: {
        state: {
          ...state,
          revision: state.revision + 1,
          chests: { ...state.chests, acknowledged: true },
        },
        events: [{ type: 'ChestAcknowledged', receiptId: command.receiptId }],
      },
    };
  }
  if (command.type === 'ClaimStarterChest') {
    if (state.chests.starterClaimed) return { ok: false, error: 'already-owned' };
    if (amount.compare(state.statistics.totalProducedCoin, catalog.unlocks.starterChestAt) < 0)
      return { ok: false, error: 'locked' };
    const next = grantRewards(
      state,
      catalog,
      [{ kind: 'item', itemId: catalog.unlocks.starterChestId, quantity: 1 }],
      'chest',
      'starter',
    ).state;
    next.revision++;
    next.chests.starterClaimed = true;
    return {
      ok: true,
      value: {
        state: next,
        events: [{ type: 'ItemPurchased', itemId: catalog.unlocks.starterChestId }],
      },
    };
  }
  const error = chestError(state, catalog, command.chestId);
  if (error) return { ok: false, error };
  if (state.chests.opened >= Number.MAX_SAFE_INTEGER) return { ok: false, error: 'numeric-limit' };
  const chest = catalog.chests.find((chest) => chest.id === command.chestId)!;
  const rewards = [...chest.guaranteed];
  let rng = state.chests.rng;
  for (const draw of chest.draws) {
    const table = catalog.lootTables.find((table) => table.id === draw.tableId)!;
    for (let index = 0; index < draw.count; index++) {
      const result = drawLoot(table, rng);
      rng = result.seed;
      rewards.push(result.reward);
    }
  }
  const staged: GameState = structuredClone(state);
  staged.itemHistory = recordItem(
    staged.itemHistory,
    chest.id,
    'spent',
    'opened',
    1,
    staged.inventory[chest.id]!,
  );
  staged.inventory[chest.id]!--;
  if (chest.keyId) {
    staged.itemHistory = recordItem(
      staged.itemHistory,
      chest.keyId,
      'spent',
      'key',
      1,
      staged.inventory[chest.keyId]!,
    );
    staged.inventory[chest.keyId]!--;
  }
  const { state: next, applied } = grantRewards(staged, catalog, rewards);
  const id = state.chests.opened + 1;
  next.revision++;
  next.chests = {
    ...next.chests,
    rng,
    opened: id,
    acknowledged: false,
    lastResult: { id, chestId: chest.id, openedAtUtc: nowUtc, rewards: applied },
  };
  return { ok: true, value: { state: next, events: [{ type: 'ChestOpened', receiptId: id }] } };
}
