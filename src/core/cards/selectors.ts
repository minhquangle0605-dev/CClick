import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CardTarget } from './card.types';
import { amount } from '@shared/amount';

export const MAX_DUPLICATES = 999999;
export function cardSlots(state: Readonly<GameState>, catalog: GameCatalog) {
  return (
    catalog.unlocks.initialCardSlots +
    (amount.compare(state.statistics.totalProducedCoin, catalog.unlocks.thirdCardSlotAt) >= 0
      ? 1
      : 0)
  );
}
export function activeSynergies(state: Readonly<GameState>, catalog: GameCatalog) {
  return catalog.cardSynergies.filter((synergy) =>
    synergy.requires.every((id) => state.cards.equipped.includes(id)),
  );
}
export function cardBonuses(
  state: Readonly<GameState>,
  catalog: GameCatalog,
): Record<CardTarget, string> {
  const bonuses: Record<CardTarget, string> = {
    clickFlat: '0',
    clickPercent: '0',
    productionPercent: '0',
    goldFlat: '0',
    rainLifetimeSeconds: '0',
    rainDurationSeconds: '0',
    rainbowWaitReduction: '0',
    frenzySeconds: '0',
    offlineBonus: '0',
  };
  for (const id of state.cards.equipped) {
    const item = catalog.cards.find((card) => card.id === id);
    const owned = state.cards.owned[id];
    if (!item || !owned) continue;
    for (const effect of item.effects)
      bonuses[effect.target] = amount.add(
        bonuses[effect.target],
        amount.multiply(effect.valuePerLevel, String(owned.level)),
      );
  }
  for (const synergy of activeSynergies(state, catalog))
    for (const effect of synergy.effects)
      bonuses[effect.target] = amount.add(bonuses[effect.target], effect.value);
  return bonuses;
}
export function offlineEfficiency(state: Readonly<GameState>, catalog: GameCatalog) {
  return amount.min(
    '1',
    amount.add(catalog.balance.offlineEfficiency, cardBonuses(state, catalog).offlineBonus),
  );
}
/** Existing objects, effects and waits retain their committed timestamps. */
export function eventCatalog(state: Readonly<GameState>, catalog: GameCatalog): GameCatalog {
  const bonus = cardBonuses(state, catalog);
  const wait = amount.subtract(
    '1',
    amount.min(
      bonus.rainbowWaitReduction,
      amount.subtract('1', catalog.unlocks.minRainbowWaitMultiplier),
    ),
  );
  const seconds = (base: number, extra: string, cap: number) => Math.min(cap, base + Number(extra));
  return {
    ...catalog,
    events: {
      ...catalog.events,
      rain: {
        ...catalog.events.rain,
        goldPerCoin: amount.add(catalog.events.rain.goldPerCoin, bonus.goldFlat),
        durationSeconds: seconds(
          catalog.events.rain.durationSeconds,
          bonus.rainDurationSeconds,
          catalog.unlocks.maxRainSeconds,
        ),
        coinLifetimeSeconds: seconds(
          catalog.events.rain.coinLifetimeSeconds,
          bonus.rainLifetimeSeconds,
          catalog.unlocks.maxRainLifetimeSeconds,
        ),
      },
      rainbow: {
        ...catalog.events.rainbow,
        waitMinSeconds: Number(
          amount.multiply(String(catalog.events.rainbow.waitMinSeconds), wait),
        ),
        waitMaxSeconds: Number(
          amount.multiply(String(catalog.events.rainbow.waitMaxSeconds), wait),
        ),
        frenzySeconds: seconds(
          catalog.events.rainbow.frenzySeconds,
          bonus.frenzySeconds,
          catalog.unlocks.maxFrenzySeconds,
        ),
        maxFrenzySeconds: seconds(
          catalog.events.rainbow.maxFrenzySeconds,
          bonus.frenzySeconds,
          catalog.unlocks.maxFrenzySeconds,
        ),
      },
    },
  };
}
