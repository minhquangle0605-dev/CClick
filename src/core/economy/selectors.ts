import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import { amount } from '@shared/amount';
import { applyModifiers, temporaryMultiplier } from '@core/effects/pipeline';
import { cardBonuses } from '@core/cards/selectors';

export function activeProductionPerSecond(state: Readonly<GameState>, catalog: GameCatalog) {
  return amount.productCapped(
    [
      productionPerSecond(state, catalog),
      temporaryMultiplier(
        state.effects,
        'production',
        state.effectsAtMs,
        catalog.events.temporaryCap,
      ).value,
    ],
    '1e100',
  );
}
export function activeClickPower(state: Readonly<GameState>, catalog: GameCatalog) {
  return amount.productCapped(
    [
      clickPower(state, catalog),
      temporaryMultiplier(state.effects, 'click', state.effectsAtMs, catalog.events.temporaryCap)
        .value,
    ],
    '1e100',
  );
}

export function productionPerSecond(state: Readonly<GameState>, catalog: GameCatalog): string {
  let result = '0';
  for (const generator of catalog.generators) {
    result = amount.add(
      result,
      amount.multiply(generator.baseCps, String(state.generators[generator.id] ?? 0)),
    );
  }
  const bonus = cardBonuses(state, catalog);
  return applyModifiers(applyUpgrades(result, 'production', state, catalog), 'production', [
    {
      target: 'production',
      operation: 'percent',
      value: bonus.productionPercent,
      stackGroup: 'cards',
    },
  ]);
}

export function clickPower(state: Readonly<GameState>, catalog: GameCatalog): string {
  const bonus = cardBonuses(state, catalog);
  return applyModifiers(
    applyUpgrades(amount.add(catalog.balance.baseClick, bonus.clickFlat), 'click', state, catalog),
    'click',
    [{ target: 'click', operation: 'percent', value: bonus.clickPercent, stackGroup: 'cards' }],
  );
}

function applyUpgrades(
  base: string,
  target: 'click' | 'production',
  state: Readonly<GameState>,
  catalog: GameCatalog,
): string {
  return applyModifiers(
    base,
    target,
    catalog.upgrades
      .filter((upgrade) => state.purchasedUpgradeIds.includes(upgrade.id))
      .map((upgrade) => ({ ...upgrade.effect, stackGroup: upgrade.id })),
  );
}
