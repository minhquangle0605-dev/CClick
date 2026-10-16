import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { cardBonuses, cardSlots } from '@core/cards/selectors';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { amount } from '@shared/amount';
import { AUTO_CLICKS_PER_SECOND } from './constants';

export const addIncome = (a: string, b: string) =>
  amount.add(a, amount.min(b, amount.subtract('1e100', a)));
export function permanentIncome(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  offline: boolean,
) {
  const income = addIncome(
    productionPerSecond(state, catalog),
    amount.productCapped([clickPower(state, catalog), String(AUTO_CLICKS_PER_SECOND)], '1e100'),
  );
  return amount.productCapped(
    [
      income,
      offline
        ? amount.min(
            '1',
            amount.add(catalog.balance.offlineEfficiency, cardBonuses(state, catalog).offlineBonus),
          )
        : '1',
    ],
    '1e100',
  );
}

type Loadout = { equipped: string[]; bonus: ReturnType<typeof cardBonuses> };
/** Reuse bonus combinations until card levels/ownership or slot count change. */
export function createLoadoutOptimizer(catalog: GameCatalog) {
  const cache = new WeakMap<GameState['cards']['owned'], Map<number, Loadout[]>>();
  return function bestLoadout(state: Readonly<GameState>, offline: boolean) {
    const slots = cardSlots(state, catalog);
    let cached = cache.get(state.cards.owned);
    if (!cached) {
      cached = new Map();
      cache.set(state.cards.owned, cached);
    }
    const cacheKey = slots * 2 + Number(offline);
    let loadouts = cached.get(cacheKey);
    if (!loadouts) {
      loadouts = [];
      const ids = Object.keys(state.cards.owned).sort();
      const size = Math.min(ids.length, slots);
      const visit = (equipped: string[], from: number) => {
        if (equipped.length === size) {
          loadouts!.push({
            equipped,
            bonus: cardBonuses({ ...state, cards: { ...state.cards, equipped } }, catalog),
          });
          return;
        }
        for (let i = from; i < ids.length; i++) visit([...equipped, ids[i]!], i + 1);
      };
      visit([], 0);
      // Discard combinations that can never beat another combination for any
      // production/click mix. Compare all coefficients exactly, including Gold
      // ties and offline efficiency, so this does not approximate the optimum.
      const frontier: { loadout: Loadout; coefficients: string[] }[] = [];
      const dominates = (left: string[], right: string[]) =>
        left.every((value, index) => amount.compare(value, right[index]!) >= 0);
      for (const loadout of loadouts) {
        const bonus = loadout.bonus;
        const efficiency = offline
          ? amount.min('1', amount.add(catalog.balance.offlineEfficiency, bonus.offlineBonus))
          : '1';
        const clickFactor = amount.multiply(
          amount.add('1', amount.multiply(bonus.clickPercent, '0.01')),
          efficiency,
        );
        const coefficients = [
          amount.multiply(
            amount.add('1', amount.multiply(bonus.productionPercent, '0.01')),
            efficiency,
          ),
          clickFactor,
          amount.multiply(bonus.clickFlat, clickFactor),
          bonus.goldFlat,
          efficiency,
        ];
        if (frontier.some((item) => dominates(item.coefficients, coefficients))) continue;
        for (let index = frontier.length - 1; index >= 0; index--)
          if (dominates(coefficients, frontier[index]!.coefficients)) frontier.splice(index, 1);
        frontier.push({ loadout, coefficients });
      }
      loadouts = frontier.map((item) => item.loadout);
      cached.set(cacheKey, loadouts);
    }
    const empty = { ...state, cards: { ...state.cards, equipped: [] } };
    const baseProduction = productionPerSecond(empty, catalog);
    const baseClick = clickPower(empty, catalog);
    const flatMultiplier = amount.productCapped(
      catalog.upgrades
        .filter(
          (item) =>
            state.purchasedUpgradeIds.includes(item.id) &&
            item.effect.target === 'click' &&
            item.effect.operation === 'multiply',
        )
        .map((item) => item.effect.value),
      '1e100',
    );
    const score = (bonus: Loadout['bonus']) => {
      const production = amount.productCapped(
        [baseProduction, amount.add('1', amount.multiply(bonus.productionPercent, '0.01'))],
        '1e100',
      );
      const click = amount.productCapped(
        [
          addIncome(baseClick, amount.productCapped([bonus.clickFlat, flatMultiplier], '1e100')),
          amount.add('1', amount.multiply(bonus.clickPercent, '0.01')),
          String(AUTO_CLICKS_PER_SECOND),
        ],
        '1e100',
      );
      return amount.productCapped(
        [
          addIncome(production, click),
          offline
            ? amount.min('1', amount.add(catalog.balance.offlineEfficiency, bonus.offlineBonus))
            : '1',
        ],
        '1e100',
      );
    };
    let best = { equipped: [...state.cards.equipped], bonus: cardBonuses(state, catalog) };
    let income = score(best.bonus);
    for (const candidate of loadouts) {
      const nextIncome = score(candidate.bonus);
      if (
        amount.compare(nextIncome, income) > 0 ||
        (amount.compare(nextIncome, income) === 0 &&
          amount.compare(candidate.bonus.goldFlat, best.bonus.goldFlat) > 0)
      ) {
        best = candidate;
        income = nextIncome;
      }
    }
    return { equipped: best.equipped, income };
  };
}
