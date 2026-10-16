import type {
  GameCatalog,
  GeneratorDefinition,
  UpgradeDefinition,
} from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CommandError, PurchaseQuantity } from '@core/engine/contracts';
import { amount } from '@shared/amount';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { AUTO_CLICKS_PER_SECOND } from '@core/automation/constants';
import { bulkPrice, maxAffordable, MAX_GENERATOR_COUNT } from './calculate-price';

export interface PurchaseQuote {
  quantity: number;
  cost: string | null;
  deltaCps: string;
  deltaClick: string;
  paybackSeconds: string | null;
  error: CommandError | null;
}
const empty = (error: CommandError): PurchaseQuote => ({
  quantity: 0,
  cost: null,
  deltaCps: '0',
  deltaClick: '0',
  paybackSeconds: null,
  error,
});
export const generatorUnlocked = (state: Readonly<GameState>, item: GeneratorDefinition) =>
  amount.compare(state.statistics.totalProducedCoin, item.unlockAt) >= 0;
export const upgradeUnlocked = (state: Readonly<GameState>, item: UpgradeDefinition) =>
  item.requires.every((id) =>
    id.startsWith('generator.')
      ? (state.generators[id] ?? 0) > 0
      : state.purchasedUpgradeIds.includes(id),
  );
function benefit(state: Readonly<GameState>, next: GameState, catalog: GameCatalog, cost: string) {
  const deltaCps = amount.subtract(
    productionPerSecond(next, catalog),
    productionPerSecond(state, catalog),
  );
  const deltaClick = amount.subtract(clickPower(next, catalog), clickPower(state, catalog));
  const autoGain = amount.productCapped(
    [deltaClick, String(AUTO_CLICKS_PER_SECOND)],
    amount.subtract('1e100', deltaCps),
  );
  const incomeGain = amount.add(deltaCps, autoGain);
  let paybackSeconds: string | null = null;
  if (amount.compare(incomeGain, '0') > 0) {
    try {
      paybackSeconds = amount.divideCeil(cost, incomeGain);
    } catch {
      /* Too large to display. */
    }
  }
  return { deltaCps, deltaClick, paybackSeconds };
}

export function quoteGenerator(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  id: string,
  requested: PurchaseQuantity,
): PurchaseQuote {
  const item = catalog.generators.find((item) => item.id === id);
  if (!item) return empty('unknown-item');
  if (
    requested !== 'max' &&
    (!Number.isSafeInteger(requested) || requested < 1 || requested > MAX_GENERATOR_COUNT)
  )
    return empty('invalid-quantity');
  const owned = state.generators[id] ?? 0;
  const quantity = requested === 'max' ? maxAffordable(item, owned, state.wallet.coin) : requested;
  const cost = bulkPrice(item, owned, Math.max(quantity, 1));
  const error = !generatorUnlocked(state, item)
    ? 'locked'
    : !cost
      ? 'numeric-limit'
      : !quantity
        ? 'insufficient-funds'
        : amount.compare(state.wallet.coin, cost) < 0
          ? 'insufficient-funds'
          : null;
  if (!cost) return { ...empty(error ?? 'numeric-limit'), quantity };
  try {
    const next = {
      ...state,
      generators: { ...state.generators, [id]: owned + Math.max(quantity, 1) },
    };
    return { quantity, cost, ...benefit(state, next, catalog, cost), error };
  } catch {
    return empty('numeric-limit');
  }
}

export function quoteUpgrade(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  id: string,
): PurchaseQuote {
  const item = catalog.upgrades.find((item) => item.id === id);
  if (!item) return empty('unknown-item');
  if (state.purchasedUpgradeIds.includes(id))
    return { ...empty('already-owned'), cost: item.price };
  const locked = !upgradeUnlocked(state, item);
  try {
    const next = { ...state, purchasedUpgradeIds: [...state.purchasedUpgradeIds, id] };
    return {
      quantity: 1,
      cost: item.price,
      ...benefit(state, next, catalog, item.price),
      error: locked
        ? 'locked'
        : amount.compare(state.wallet.coin, item.price) < 0
          ? 'insufficient-funds'
          : null,
    };
  } catch {
    return empty('numeric-limit');
  }
}
