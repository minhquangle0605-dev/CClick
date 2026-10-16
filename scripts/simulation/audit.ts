import type { GameCatalog } from '../../src/core/catalog/catalog.types';
import type { Reward } from '../../src/core/rewards/reward.types';
import { amount } from '../../src/shared/amount';

/** Exhaustive bound for direct cashback at max card level; not an estimate from random draws. */
export function auditEconomy(catalog: GameCatalog) {
  const goldValue = (reward: Reward): string => {
    if (reward.kind === 'currency') return reward.currency === 'goldCoin' ? reward.amount : '0';
    if (reward.kind === 'card') {
      const card = catalog.cards.find((card) => card.id === reward.cardId)!;
      return amount.multiply(
        catalog.cardProgression.maxDuplicateGold[card.rarity],
        String(reward.quantity),
      );
    }
    // Returning a purchasable chest/key could form an indirect loop; reject it for manual audit.
    if (
      catalog.chests.some((chest) => chest.id === reward.itemId) ||
      catalog.keys.some((key) => key.id === reward.itemId)
    )
      throw new Error(`Recursive chest/key reward requires audit: ${reward.itemId}`);
    return '0';
  };
  const chests = catalog.chests.map((chest) => {
    const cost = amount.add(
      catalog.itemOffers.find((offer) => offer.itemId === chest.id)!.goldPrice,
      chest.keyId
        ? catalog.itemOffers.find((offer) => offer.itemId === chest.keyId)!.goldPrice
        : '0',
    );
    let maximumGold = chest.guaranteed.reduce(
      (sum, reward) => amount.add(sum, goldValue(reward)),
      '0',
    );
    for (const draw of chest.draws) {
      const table = catalog.lootTables.find((table) => table.id === draw.tableId)!;
      const maximum = table.entries
        .map((entry) => goldValue(entry.reward))
        .reduce((best, value) => (amount.compare(value, best) > 0 ? value : best), '0');
      maximumGold = amount.add(maximumGold, amount.multiply(maximum, String(draw.count)));
    }
    if (amount.compare(maximumGold, cost) >= 0) throw new Error(`Self-funding chest: ${chest.id}`);
    return {
      id: chest.id,
      goldCostWithKey: cost,
      maximumGoldAtMaxCards: maximumGold,
      minimumNetGoldCost: amount.subtract(cost, maximumGold),
    };
  });
  const daily = catalog.dailyRewards.flatMap((day) => day.rewards);
  const items = [...catalog.boosters, ...catalog.chests, ...catalog.keys].map((item) => ({
    id: item.id,
    sources: [
      ...(catalog.itemOffers.some((offer) => offer.itemId === item.id) ? ['shop'] : []),
      ...(daily.some((r) => r.kind === 'item' && r.itemId === item.id) ? ['daily'] : []),
      ...(catalog.achievements.some((a) =>
        a.rewards.some((r) => r.kind === 'item' && r.itemId === item.id),
      )
        ? ['achievement']
        : []),
      ...(catalog.lootTables.some((table) =>
        table.entries.some(({ reward: r }) => r.kind === 'item' && r.itemId === item.id),
      )
        ? ['loot']
        : []),
      ...(catalog.unlocks.starterChestId === item.id ? ['milestone'] : []),
    ],
    use: catalog.boosters.some((b) => b.id === item.id)
      ? 'temporary effect or time warp'
      : catalog.chests.some((c) => c.id === item.id)
        ? 'collection and rewards'
        : catalog.chests.some((c) => c.keyId === item.id)
          ? 'open chest'
          : null,
  }));
  if (items.some((item) => !item.sources.length || !item.use))
    throw new Error('Unusable or unreachable item');
  return {
    contentVersion: catalog.balance.contentVersion,
    chests,
    items,
    limits: [
      'Only direct Gold cashback and chest/key recursion are bounded here.',
      'Rain, daily and production intentionally renew over time; there is no sale-back market.',
      'Time Warp costs inventory and does not advance event/daily clocks; booster stacking has caps.',
    ],
  };
}
