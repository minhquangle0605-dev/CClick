import type { NumberFormatter } from '@ui/components/number-format';
import type { Reward, AppliedReward } from '@core/rewards/reward.types';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import { inventoryDefinitions } from '@core/catalog/inventory';
import { amount } from '@shared/amount';
import { text } from '@ui/components/text';

export function rewardLabel(
  reward: Reward | AppliedReward,
  catalog: GameCatalog,
  state?: Readonly<GameState>,
  format: NumberFormatter = (value) => amount.format(String(value)),
): string {
  if (reward.kind === 'currency') {
    const base = `${format(reward.amount)} ${reward.currency === 'coin' ? 'Coin' : 'Gold'}`;
    if ('sourceCardId' in reward && reward.sourceCardId)
      return `${base} ← ${text(catalog.cards.find((card) => card.id === reward.sourceCardId)!.nameKey)} (${text('chests.converted')})`;
    return base;
  }
  if (reward.kind === 'item')
    return `${format(reward.quantity)} × ${text(inventoryDefinitions(catalog).find((item) => item.id === reward.itemId)!.nameKey)}`;
  const card = catalog.cards.find((card) => card.id === reward.cardId)!;
  const name = text(card.nameKey);
  if (state?.cards.owned[card.id]?.level === catalog.cardProgression.maxLevel)
    return `${name} → ${format(amount.multiply(catalog.cardProgression.maxDuplicateGold[card.rarity], String(reward.quantity)))} Gold`;
  const note = 'note' in reward && reward.note ? ` · ${text(`chests.${reward.note}`)}` : '';
  return `${format(reward.quantity)} × ${name}${note}`;
}
