import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { amount } from '@shared/amount';
import { advanceEvents } from '@core/events/scheduler';
import { eventCatalog } from '@core/cards/selectors';
import { increment, trackCoin } from '@core/progression/tracking';
import { integrateIncome } from './integrate-income';
import { createUpgradePlanner, snapshotRates } from './upgrade-planner';

export function createTimeSimulation(catalog: GameCatalog, offline = false) {
  const planner = createUpgradePlanner(catalog, offline);
  return {
    invalidate: () => planner.invalidate(),
    advance(initial: Readonly<GameState>, start: number, elapsed: number) {
      let state = initial as GameState;
      let cursor = start;
      const end = start + elapsed;
      let production = '0',
        click = '0',
        gold = '0',
        actions = 0;
      const addCapped = (a: string, b: string) =>
        amount.add(a, amount.min(b, amount.subtract('1e100', a)));
      function upgrade() {
        const result = planner.run(state, cursor);
        state = result.state;
        actions = increment(actions, result.count);
      }
      while (cursor < end) {
        upgrade();
        let until = state.automation.upgradeEnabled ? Math.min(end, planner.nextAt()) : end;
        const nextEffect = Math.min(
          ...state.effects
            .flatMap((effect) => [effect.startsAt, effect.expiresAt])
            .filter((at) => at > cursor),
          Infinity,
        );
        until = Math.min(until, nextEffect);
        if (until <= cursor) throw new RangeError('Invalid automation boundary');
        let duration = until - cursor;
        let income = integrateIncome(state, catalog, cursor, duration, offline);
        let slotBoundary = false;
        if (
          state.automation.upgradeEnabled &&
          Object.keys(state.cards.owned).length > catalog.unlocks.initialCardSlots &&
          amount.compare(state.statistics.totalProducedCoin, catalog.unlocks.thirdCardSlotAt) < 0
        ) {
          const slot = income.crossing(catalog.unlocks.thirdCardSlotAt);
          if (slot !== null && slot > 0) {
            slotBoundary = true;
            until = cursor + slot;
            duration = slot;
            income = integrateIncome(state, catalog, cursor, duration, offline);
          }
        }
        const room = amount.min(
          amount.subtract('1e100', state.wallet.coin),
          amount.subtract('1e100', state.statistics.totalProducedCoin),
        );
        const produced = amount.min(income.production, room);
        const clicked = amount.min(income.click, amount.subtract(room, produced));
        const earned = amount.add(produced, clicked);
        const events = advanceEvents(
          state.events,
          eventCatalog(state, catalog),
          state.effects,
          duration,
          cursor,
          income.unlockOffset,
          true,
        );
        const earnedGold = amount.min(events.gold, amount.subtract('1e100', state.wallet.goldCoin));
        let tracking = offline
          ? trackCoin(state.tracking, 'offline', earned)
          : trackCoin(trackCoin(state.tracking, 'production', produced), 'click', clicked);
        tracking = {
          ...tracking,
          goldFromEvents: addCapped(tracking.goldFromEvents, earnedGold),
          eventCoins: increment(tracking.eventCoins, events.collected),
          activeMs: offline ? tracking.activeMs : increment(tracking.activeMs, duration),
        };
        state = {
          ...state,
          revision: increment(state.revision),
          wallet: {
            coin: amount.add(state.wallet.coin, earned),
            goldCoin: amount.add(state.wallet.goldCoin, earnedGold),
          },
          statistics: {
            ...state.statistics,
            clicks: increment(state.statistics.clicks, income.clicks),
            totalProducedCoin: amount.add(state.statistics.totalProducedCoin, earned),
          },
          tracking,
          automation: {
            ...state.automation,
            clickRemainderMs: income.remainder,
            automaticClicks: increment(state.automation.automaticClicks, income.clicks),
          },
          effectsAtMs: until,
          effects: state.effects.filter((effect) => effect.expiresAt > until),
          events: events.events,
        };
        production = addCapped(production, produced);
        click = addCapped(click, clicked);
        gold = addCapped(gold, earnedGold);
        cursor = until;
        if (until === nextEffect || slotBoundary) planner.invalidate();
      }
      if (elapsed > 0) upgrade();
      return {
        state: offline ? state : snapshotRates(state, catalog),
        production,
        click,
        gold,
        actions,
      };
    },
  };
}
