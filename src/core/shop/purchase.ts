import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { GameCommand, CommandResult } from '@core/engine/contracts';
import { amount } from '@shared/amount';
import { productionPerSecond } from '@core/economy/selectors';
import { quoteGenerator, quoteUpgrade } from './quotes';

export function purchase(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  command: Extract<GameCommand, { type: 'PurchaseGenerator' | 'PurchaseUpgrade' }>,
): CommandResult {
  const generator = command.type === 'PurchaseGenerator';
  const quote = generator
    ? quoteGenerator(state, catalog, command.generatorId, command.quantity)
    : quoteUpgrade(state, catalog, command.upgradeId);
  if (quote.error) return { ok: false, error: quote.error };
  if (state.revision >= Number.MAX_SAFE_INTEGER) return { ok: false, error: 'numeric-limit' };
  const next: GameState = {
    ...state,
    revision: state.revision + 1,
    wallet: { ...state.wallet, coin: amount.subtract(state.wallet.coin, quote.cost!) },
    statistics: {
      ...state.statistics,
      totalSpentCoin: amount.add(state.statistics.totalSpentCoin, quote.cost!),
    },
    generators: generator
      ? {
          ...state.generators,
          [command.generatorId]: (state.generators[command.generatorId] ?? 0) + quote.quantity,
        }
      : state.generators,
    purchasedUpgradeIds: generator
      ? state.purchasedUpgradeIds
      : [...state.purchasedUpgradeIds, command.upgradeId],
  };
  next.offlineCps = productionPerSecond(next, catalog);
  return {
    ok: true,
    value: {
      state: next,
      events: [
        generator
          ? {
              type: 'GeneratorPurchased',
              generatorId: command.generatorId,
              quantity: quote.quantity,
            }
          : { type: 'UpgradePurchased', upgradeId: command.upgradeId },
      ],
    },
  };
}
