import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { temporaryMultiplier } from '@core/effects/pipeline';
import { amount } from '@shared/amount';
import { AUTO_CLICK_MS } from './constants';

/** Production is continuous; automatic clicks occur at exact 100 ms boundaries, including across saves. */
export function integrateIncome(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  start: number,
  elapsed: number,
  offline = false,
) {
  const passive = offline ? state.offlineCps : productionPerSecond(state, catalog);
  const power = offline ? state.offlineClickPower : clickPower(state, catalog);
  const efficiency = offline ? state.offlineEfficiency : '1';
  const remainder = state.automation.clickRemainderMs;
  const first = AUTO_CLICK_MS - remainder;
  const totalClicks =
    offline && power === '0' ? 0 : Math.floor((remainder + elapsed) / AUTO_CLICK_MS);
  const clicks = Math.min(totalClicks, Number.MAX_SAFE_INTEGER - state.statistics.clicks);
  const cap = '1e100';
  const addCapped = (a: string, b: string) => amount.add(a, amount.min(b, amount.subtract(cap, a)));
  function integrate(duration: number) {
    const end = start + duration;
    const boundaries = [
      ...new Set([
        start,
        end,
        ...state.effects
          .flatMap((effect) => [effect.startsAt, effect.expiresAt])
          .filter((at) => at > start && at < end),
      ]),
    ].sort((a, b) => a - b);
    let production = '0';
    let click = '0';
    const clickValue = (at: number, count: number) =>
      amount.productCapped(
        [
          power,
          efficiency,
          String(count),
          temporaryMultiplier(state.effects, 'click', at, catalog.events.temporaryCap).value,
        ],
        cap,
      );
    for (let i = 0; i < boundaries.length - 1; i++) {
      const from = boundaries[i]!;
      const to = boundaries[i + 1]!;
      production = addCapped(
        production,
        amount.productCapped(
          [
            passive,
            efficiency,
            String((to - from) / 1000),
            temporaryMultiplier(state.effects, 'production', from, catalog.events.temporaryCap)
              .value,
          ],
          cap,
        ),
      );
      const before = (at: number) =>
        Math.min(clicks, Math.max(0, Math.ceil((at - start - first) / AUTO_CLICK_MS)));
      click = addCapped(click, clickValue(from, before(to) - before(from)));
    }
    const endClick = (duration + remainder) / AUTO_CLICK_MS;
    if (duration > 0 && Number.isInteger(endClick) && endClick > 0 && endClick <= clicks)
      click = addCapped(click, clickValue(end, 1));
    return { production, click, total: addCapped(production, click) };
  }
  const earned = integrate(elapsed);
  function crossing(target: string): number | null {
    let offset: number | null = null;
    if (amount.compare(state.statistics.totalProducedCoin, target) >= 0) offset = 0;
    else {
      const remaining = amount.subtract(target, state.statistics.totalProducedCoin);
      if (amount.compare(earned.total, remaining) >= 0) {
        let low = 0,
          high = elapsed;
        while (low < high) {
          const middle = Math.floor((low + high) / 2);
          if (amount.compare(integrate(middle).total, remaining) >= 0) high = middle;
          else low = middle + 1;
        }
        offset = low;
      }
    }
    return offset;
  }
  return {
    ...earned,
    clicks,
    remainder: (remainder + elapsed) % AUTO_CLICK_MS,
    unlockOffset: crossing(catalog.events.rainbow.unlockAt),
    crossing,
  };
}
