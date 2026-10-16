import balance from './balance.json';
import dailyRewards from './daily-rewards.json';
import achievements from './achievements.json';
import generators from './generators.json';
import upgrades from './upgrades.json';
import boosters from './boosters.json';
import events from './events.json';
import itemOffers from './item-offers.json';
import cards from './cards.json';
import cardSynergies from './card-synergies.json';
import cardProgression from './card-progression.json';
import chests from './chests.json';
import keys from './keys.json';
import lootTables from './loot-tables.json';
import unlocks from './unlocks.json';

export const rawCatalog = {
  dailyRewards,
  achievements,
  balance,
  generators,
  upgrades,
  boosters,
  events,
  itemOffers,
  cards,
  cardSynergies,
  cardProgression,
  chests,
  keys,
  lootTables,
  unlocks,
};
export { validateCatalog } from './schemas/catalog.schema';
