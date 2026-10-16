import type { GameCatalog } from '../../src/core/catalog/catalog.types';
import type { GameEngine, GameCommand } from '../../src/core/engine/contracts';
import { quoteGenerator, quoteUpgrade } from '../../src/core/shop/quotes';
import { bulkPrice } from '../../src/core/shop/calculate-price';
import { amount } from '../../src/shared/amount';
import { dailyStatus } from '../../src/core/daily-rewards/calendar';
import { achievementStatus } from '../../src/core/achievements/selectors';
import { chestError } from '../../src/core/chests/commands';
import { previewCardUpgrade } from '../../src/core/cards/commands';
import { cardSlots } from '../../src/core/cards/selectors';
import type { PlayProfile } from './profiles';

/** Deterministic policy for comparison, not an optimal-player claim. Money stays in Amount. */
export function manage(
  engine: GameEngine,
  catalog: GameCatalog,
  profile: PlayProfile,
  now: string,
  remainingSeconds: number,
  send: (command: GameCommand) => boolean,
) {
  const state = () => engine.getSnapshot();
  if (dailyStatus(state().daily, now).available) send({ type: 'ClaimDaily' });
  for (const item of catalog.achievements)
    if (achievementStatus(state(), item).ready)
      send({ type: 'ClaimAchievement', achievementId: item.id });
  if (
    !state().chests.starterClaimed &&
    amount.compare(state().statistics.totalProducedCoin, catalog.unlocks.starterChestAt) >= 0
  )
    send({ type: 'ClaimStarterChest' });

  // Spend Gold on collection. Prefer free gold chests; buy missing keys, then silver chests.
  const goldChest = catalog.chests.find((chest) => chest.keyId);
  if (
    goldChest &&
    (state().inventory[goldChest.id] ?? 0) > 0 &&
    !(state().inventory[goldChest.keyId!] ?? 0)
  ) {
    const offer = catalog.itemOffers.find((item) => item.itemId === goldChest.keyId)!;
    if (amount.compare(state().wallet.goldCoin, offer.goldPrice) >= 0)
      send({ type: 'PurchaseItem', offerId: offer.id });
  }
  const silverOffer = catalog.itemOffers.find((item) => item.itemId === 'chest.silver')!;
  if (amount.compare(state().wallet.goldCoin, silverOffer.goldPrice) >= 0)
    send({ type: 'PurchaseItem', offerId: silverOffer.id });
  for (const chest of catalog.chests) {
    for (let opened = 0; opened < 100 && !chestError(state(), catalog, chest.id); opened++) {
      send({ type: 'OpenChest', chestId: chest.id });
      send({ type: 'AcknowledgeChest', receiptId: state().chests.lastResult!.id });
    }
  }
  // Fixed preference list avoids hindsight over the RNG outcome.
  const preference =
    profile.id === 'passive'
      ? ['card.dusk-battery', 'card.mint-gear', 'card.star-forge', 'card.clockwork']
      : ['card.mint-gear', 'card.star-forge', 'card.silver-touch', 'card.steady-hand'];
  const desired = [...preference, ...catalog.cards.map((card) => card.id)]
    .filter((id, index, ids) => ids.indexOf(id) === index && state().cards.owned[id])
    .slice(0, cardSlots(state(), catalog));
  for (const id of state().cards.equipped)
    if (!desired.includes(id)) send({ type: 'UnequipCard', cardId: id });
  for (const id of desired) {
    if (!state().cards.equipped.includes(id)) send({ type: 'EquipCard', cardId: id });
    const quote = previewCardUpgrade(state(), catalog, id);
    if (
      !quote.error &&
      amount.compare(quote.coin, amount.multiply(state().wallet.coin, '0.2')) <= 0
    )
      send({ type: 'UpgradeCard', cardId: id });
  }

  // Choose best marginal return among affordable items, recomputing after each purchase.
  for (let purchase = 0; purchase < 50; purchase++) {
    const options: { command: GameCommand; score: string }[] = [];
    const clicks = String(profile.clicksPerSecond);
    const add = (command: GameCommand, quote: ReturnType<typeof quoteGenerator>) => {
      if (quote.error || !quote.cost) return;
      const gain = amount.add(quote.deltaCps, amount.multiply(quote.deltaClick, clicks));
      if (amount.compare(gain, '0') > 0)
        options.push({ command, score: amount.divideCeil(quote.cost, gain) });
    };
    for (const item of catalog.generators) {
      if (amount.compare(state().statistics.totalProducedCoin, item.unlockAt) < 0) continue;
      const cost = bulkPrice(item, state().generators[item.id] ?? 0, 1);
      if (cost && amount.compare(state().wallet.coin, cost) >= 0)
        add(
          { type: 'PurchaseGenerator', generatorId: item.id, quantity: 1 },
          quoteGenerator(state(), catalog, item.id, 1),
        );
    }
    for (const item of catalog.upgrades) {
      if (
        state().purchasedUpgradeIds.includes(item.id) ||
        amount.compare(state().wallet.coin, item.price) < 0
      )
        continue;
      add({ type: 'PurchaseUpgrade', upgradeId: item.id }, quoteUpgrade(state(), catalog, item.id));
    }
    options.sort((a, b) => amount.compare(a.score, b.score));
    if (!options[0] || !send(options[0].command)) break;
  }
  for (const booster of catalog.boosters) {
    if (
      !(state().inventory[booster.id] ?? 0) ||
      state().effects.some((effect) => effect.sourceId === booster.id)
    )
      continue;
    if (booster.effects.some((effect) => effect.target === 'click') && !profile.clicksPerSecond)
      continue;
    if (
      booster.effects.some((effect) => effect.target === 'magnet') &&
      !state().events.objects.length
    )
      continue;
    if (booster.durationSeconds && remainingSeconds < booster.durationSeconds) continue;
    send({ type: 'UseBooster', itemId: booster.id });
  }
}
