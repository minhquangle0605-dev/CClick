import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameCommand } from '@core/engine/contracts';
import { amount } from '@shared/amount';
import { upgradeUnlocked } from '@core/shop/quotes';
import { bulkPrice, MAX_GENERATOR_COUNT } from '@core/shop/calculate-price';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { cardBonuses, offlineEfficiency } from '@core/cards/selectors';
import { temporaryMultiplier } from '@core/effects/pipeline';
import { permanentIncome, addIncome } from './loadout';
type Investment = {
  command: Extract<GameCommand, { type: 'PurchaseGenerator' | 'PurchaseUpgrade' }>;
  cost: string;
  gain: string;
  unlockAt: string;
  name: string;
};

/** Buy the affordable improvement with shortest payback. If none is affordable,
 * wake at the first purchasable improvement, using payback and price to break ties.
 * Preview and simulation share this decision; no Gold or inventory is spent.
 */
export function selectAutoInvestment(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  offline = false,
  at = state.effectsAtMs,
) {
  const currentIncome = permanentIncome(state, catalog, offline);
  const cps = productionPerSecond(state, catalog);
  const click = clickPower(state, catalog);
  const bonus = cardBonuses(state, catalog);
  const efficiency = offline ? offlineEfficiency(state, catalog) : '1';
  const multiplier = (target: 'production' | 'click') =>
    amount.productCapped(
      [
        ...catalog.upgrades
          .filter(
            (item) =>
              state.purchasedUpgradeIds.includes(item.id) &&
              item.effect.target === target &&
              item.effect.operation === 'multiply',
          )
          .map((item) => item.effect.value),
        amount.add(
          '1',
          amount.multiply(
            target === 'production' ? bonus.productionPercent : bonus.clickPercent,
            '0.01',
          ),
        ),
      ],
      '1e100',
    );
  const productionFactor = multiplier('production');
  const clickFactor = multiplier('click');
  const actualIncome = amount.productCapped(
    [
      addIncome(
        amount.productCapped(
          [
            offline ? state.offlineCps : productionPerSecond(state, catalog),
            temporaryMultiplier(state.effects, 'production', at, catalog.events.temporaryCap).value,
          ],
          '1e100',
        ),
        amount.productCapped(
          [
            offline ? state.offlineClickPower : clickPower(state, catalog),
            '10',
            temporaryMultiplier(state.effects, 'click', at, catalog.events.temporaryCap).value,
          ],
          '1e100',
        ),
      ),
      offline ? state.offlineEfficiency : '1',
    ],
    '1e100',
  );
  const candidates: Investment[] = [];
  for (const item of catalog.generators) {
    const owned = state.generators[item.id] ?? 0;
    if (owned >= MAX_GENERATOR_COUNT) continue;
    const cost = bulkPrice(item, owned, 1);
    const gain = amount.productCapped(
      [item.baseCps, productionFactor, efficiency],
      amount.subtract('1e100', currentIncome),
    );
    if (cost && gain !== '0')
      candidates.push({
        command: { type: 'PurchaseGenerator', generatorId: item.id, quantity: 1 },
        cost,
        gain,
        unlockAt: item.unlockAt,
        name: item.nameKey,
      });
  }
  for (const item of catalog.upgrades) {
    if (state.purchasedUpgradeIds.includes(item.id) || !upgradeUnlocked(state, item)) continue;
    const isClick = item.effect.target === 'click';
    if (item.effect.operation === 'multiply' && amount.compare(item.effect.value, '1') <= 0)
      continue;
    const factors =
      item.effect.operation === 'add'
        ? [item.effect.value, isClick ? clickFactor : productionFactor]
        : [isClick ? click : cps, amount.subtract(item.effect.value, '1')];
    const gain = amount.productCapped(
      [...factors, isClick ? '10' : '1', efficiency],
      amount.subtract('1e100', currentIncome),
    );
    if (gain !== '0')
      candidates.push({
        command: { type: 'PurchaseUpgrade', upgradeId: item.id },
        cost: item.price,
        gain,
        unlockAt: '0',
        name: item.nameKey,
      });
  }
  let best: Investment | null = null;
  let bestScore = '1e100';
  let bestWait = '0';
  for (const candidate of candidates) {
    const need =
      amount.compare(candidate.cost, state.wallet.coin) > 0
        ? amount.subtract(candidate.cost, state.wallet.coin)
        : '0';
    const locked =
      amount.compare(candidate.unlockAt, state.statistics.totalProducedCoin) > 0
        ? amount.subtract(candidate.unlockAt, state.statistics.totalProducedCoin)
        : '0';
    const required = amount.compare(need, locked) > 0 ? need : locked;
    if (actualIncome === '0' && required !== '0') continue;
    try {
      const wait = required === '0' ? '0' : amount.scaledDivideCeil(required, actualIncome, '1000');
      const score = addIncome(
        wait,
        amount.scaledDivideCeil(candidate.cost, candidate.gain, '1000'),
      );
      if (
        !best ||
        amount.compare(wait, bestWait) < 0 ||
        (amount.compare(wait, bestWait) === 0 &&
          (amount.compare(score, bestScore) < 0 ||
            (amount.compare(score, bestScore) === 0 &&
              amount.compare(candidate.cost, best.cost) < 0)))
      ) {
        best = candidate;
        bestScore = score;
        bestWait = wait;
      }
    } catch {
      /* A payback beyond the numeric range is not a useful investment. */
    }
  }

  return { target: best, waitMs: bestWait };
}
