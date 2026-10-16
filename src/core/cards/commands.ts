import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CommandError, CommandResult, DurableCommand } from '@core/engine/contracts';
import { amount } from '@shared/amount';
import { cardSlots } from './selectors';
import { recordItem } from '@core/statistics/item-history';

export function previewCardUpgrade(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  cardId: string,
) {
  const card = catalog.cards.find((item) => item.id === cardId);
  const owned = state.cards.owned[cardId];
  let error: CommandError | null = !card
    ? 'unknown-item'
    : !owned
      ? 'card-not-owned'
      : owned.level >= catalog.cardProgression.maxLevel
        ? 'max-level'
        : null;
  const cost = owned
    ? catalog.cardProgression.upgradeCosts.find((cost) => cost.level === owned.level + 1)
    : undefined;
  const coin =
    cost && card
      ? amount.multiply(cost.coin, catalog.cardProgression.rarityCost[card.rarity])
      : '0';
  const duplicates = cost?.duplicates ?? 0;
  if (!error && owned) {
    if (owned.duplicates < duplicates) error = 'missing-duplicates';
    else if (amount.compare(state.wallet.coin, coin) < 0) error = 'insufficient-funds';
  }
  const convertedGold =
    owned && card && owned.level + 1 === catalog.cardProgression.maxLevel
      ? amount.multiply(
          String(Math.max(0, owned.duplicates - duplicates)),
          catalog.cardProgression.maxDuplicateGold[card.rarity],
        )
      : '0';
  return {
    error,
    coin,
    duplicates,
    nextLevel: owned ? Math.min(owned.level + 1, catalog.cardProgression.maxLevel) : 1,
    convertedGold,
  };
}
export function changeCard(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  command: Extract<DurableCommand, { type: 'EquipCard' | 'UnequipCard' | 'UpgradeCard' }>,
): CommandResult {
  const id = command.cardId;
  const owned = state.cards.owned[id];
  if (!catalog.cards.some((card) => card.id === id)) return { ok: false, error: 'unknown-item' };
  if (!owned) return { ok: false, error: 'card-not-owned' };
  let next: GameState = { ...state, revision: state.revision + 1 };
  if (command.type === 'EquipCard') {
    if (state.cards.equipped.includes(id)) return { ok: false, error: 'already-owned' };
    if (state.cards.equipped.length >= cardSlots(state, catalog))
      return { ok: false, error: 'slots-full' };
    next.cards = { ...state.cards, equipped: [...state.cards.equipped, id] };
  } else if (command.type === 'UnequipCard') {
    if (!state.cards.equipped.includes(id)) return { ok: false, error: 'card-not-owned' };
    next.cards = { ...state.cards, equipped: state.cards.equipped.filter((card) => card !== id) };
  } else {
    const preview = previewCardUpgrade(state, catalog, id);
    if (preview.error) return { ok: false, error: preview.error };
    const atMax = preview.nextLevel === catalog.cardProgression.maxLevel;
    let itemHistory = recordItem(
      state.itemHistory,
      id,
      'spent',
      'upgrade',
      preview.duplicates,
      1 + owned.duplicates,
    );
    if (atMax)
      itemHistory = recordItem(
        itemHistory,
        id,
        'spent',
        'converted',
        owned.duplicates - preview.duplicates,
        1 + owned.duplicates - preview.duplicates,
      );
    next = {
      ...next,
      itemHistory,
      wallet: {
        ...state.wallet,
        coin: amount.subtract(state.wallet.coin, preview.coin),
        goldCoin: amount.add(state.wallet.goldCoin, preview.convertedGold),
      },
      statistics: {
        ...state.statistics,
        totalSpentCoin: amount.add(state.statistics.totalSpentCoin, preview.coin),
      },
      cards: {
        ...state.cards,
        owned: {
          ...state.cards.owned,
          [id]: {
            level: preview.nextLevel,
            duplicates: atMax ? 0 : owned.duplicates - preview.duplicates,
            convertedGold: amount.add(owned.convertedGold, preview.convertedGold),
          },
        },
      },
    };
  }
  return { ok: true, value: { state: next, events: [{ type: 'CardChanged', cardId: id }] } };
}
