import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { Clock } from '@core/ports';
import { applyClick } from '@core/clicking/apply-click';
import { purchase } from '@core/shop/purchase';
import { monotonicUtc } from '@core/offline/settle-offline';
import { unlockRainbow } from '@core/events/scheduler';
import { collectEvent } from '@core/events/collect-event';
import { useBooster } from '@core/boosters/use-booster';
import { purchaseItem } from '@core/shop/purchase-item';
import { eventCatalog } from '@core/cards/selectors';
import { changeCard } from '@core/cards/commands';
import { chestCommand } from '@core/chests/commands';
import { claimDaily } from '@core/daily-rewards/claim-daily';
import { claimAchievement } from '@core/achievements/claim-achievement';
import { refreshProgress } from '@core/progression/refresh-progress';
import { amount } from '@shared/amount';
import { createTimeSimulation } from '@core/automation/advance-game';
import { snapshotRates } from '@core/automation/upgrade-planner';
import type { CommandResult, DomainEvent, GameEngine } from './contracts';

function freezeState(state: GameState): GameState {
  for (const entry of Object.values(state.itemHistory.entries)) {
    Object.freeze(entry.earned);
    Object.freeze(entry.spent);
    Object.freeze(entry);
  }
  Object.freeze(state.itemHistory.entries);
  Object.freeze(state.itemHistory);
  Object.freeze(state.automation);
  Object.freeze(state.daily);
  Object.freeze(state.achievements.unlockedIds);
  Object.freeze(state.achievements.claimedIds);
  Object.freeze(state.achievements);
  Object.freeze(state.tracking.coin);
  Object.freeze(state.tracking);
  Object.freeze(state.wallet);
  Object.freeze(state.generators);
  Object.freeze(state.purchasedUpgradeIds);
  Object.freeze(state.statistics);
  Object.freeze(state.inventory);
  for (const effect of state.effects) Object.freeze(effect);
  Object.freeze(state.effects);
  for (const object of state.events.objects) Object.freeze(object);
  Object.freeze(state.events.objects);
  Object.freeze(state.events);
  for (const card of Object.values(state.cards.owned)) Object.freeze(card);
  Object.freeze(state.cards.owned);
  Object.freeze(state.cards.equipped);
  Object.freeze(state.cards);
  if (state.chests.lastResult) {
    for (const reward of state.chests.lastResult.rewards) Object.freeze(reward);
    Object.freeze(state.chests.lastResult.rewards);
    Object.freeze(state.chests.lastResult);
  }
  Object.freeze(state.chests);
  return Object.freeze(state);
}

export function createEngine(initial: GameState, catalog: GameCatalog, clock: Clock): GameEngine {
  let state = freezeState(structuredClone(initial));
  let watermark = Math.floor(clock.monotonicMilliseconds());
  let paused = false;
  const simulation = createTimeSimulation(catalog);
  const listeners = new Set<() => void>();
  const success = (events: DomainEvent[] = []): CommandResult => ({
    ok: true,
    value: { state, events },
  });
  function publish(next: GameState) {
    state = freezeState(refreshProgress(next, catalog, clock.nowUtc()));
    for (const listener of listeners) listener();
    return state;
  }
  function tick(): CommandResult {
    if (paused) return success();
    const now = Math.floor(clock.monotonicMilliseconds());
    const elapsed = now - watermark;
    if (elapsed <= 0) return success();
    watermark = now;
    try {
      const wallStart = Math.max(state.effectsAtMs, Date.parse(clock.nowUtc()) - elapsed);
      const advanced = simulation.advance(state, wallStart, elapsed);
      publish({
        ...advanced.state,
        lastSimulatedAtUtc: monotonicUtc(state.lastSimulatedAtUtc, clock.nowUtc()),
      });
      return success([
        { type: 'CoinEarned', source: 'production', amount: advanced.production },
        { type: 'CoinEarned', source: 'click', amount: advanced.click },
        ...(advanced.gold !== '0' ? [{ type: 'GoldEarned' as const, amount: advanced.gold }] : []),
        ...(advanced.actions ? [{ type: 'AutoUpgraded' as const, count: advanced.actions }] : []),
      ]);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      return { ok: false, error: 'numeric-limit' };
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    tick,
    pause() {
      const result = tick();
      paused = true;
      return result;
    },
    resume() {
      watermark = Math.floor(clock.monotonicMilliseconds());
      paused = false;
    },
    replaceState(next) {
      simulation.invalidate();
      publish(structuredClone(next));
      watermark = Math.floor(clock.monotonicMilliseconds());
    },
    dispatch(command) {
      if (paused) return { ok: false, error: 'paused' };
      const settled = tick();
      if (!settled.ok) return settled;
      try {
        simulation.invalidate();
        if (state.revision >= Number.MAX_SAFE_INTEGER) throw new RangeError('Revision limit');
        if (command.type !== 'ClickCoin') {
          const result =
            command.type === 'SetAutoUpgrade' || command.type === 'SetAutoEquip'
              ? {
                  ok: true as const,
                  value: {
                    state: {
                      ...state,
                      revision: state.revision + 1,
                      automation: {
                        ...state.automation,
                        [command.type === 'SetAutoUpgrade' ? 'upgradeEnabled' : 'autoEquipEnabled']:
                          command.enabled,
                      },
                    },
                    events: [{ type: 'AutomationChanged' as const }],
                  },
                }
              : command.type === 'ClaimDaily'
                ? claimDaily(state, catalog, clock.nowUtc())
                : command.type === 'ClaimAchievement'
                  ? claimAchievement(state, catalog, command.achievementId)
                  : command.type === 'UseBooster'
                    ? useBooster(state, catalog, command.itemId)
                    : command.type === 'PurchaseItem'
                      ? purchaseItem(state, catalog, command.offerId)
                      : command.type === 'CollectEvent'
                        ? collectEvent(state, catalog, command.objectId)
                        : command.type === 'EquipCard' ||
                            command.type === 'UnequipCard' ||
                            command.type === 'UpgradeCard'
                          ? changeCard(state, catalog, command)
                          : command.type === 'OpenChest' ||
                              command.type === 'AcknowledgeChest' ||
                              command.type === 'ClaimStarterChest'
                            ? chestCommand(state, catalog, command, clock.nowUtc())
                            : purchase(state, catalog, command);
          if (result.ok) {
            result.value.state = publish(snapshotRates(result.value.state, catalog));
          }
          return result;
        }
        const { next, earned } = applyClick(
          state,
          catalog,
          monotonicUtc(state.lastSimulatedAtUtc, clock.nowUtc()),
        );
        if (amount.compare(next.statistics.totalProducedCoin, catalog.events.rainbow.unlockAt) >= 0)
          next.events = unlockRainbow(next.events, eventCatalog(next, catalog));
        publish(next);
        return success([
          ...settled.value.events,
          { type: 'CoinEarned', source: 'click', amount: earned },
        ]);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return { ok: false, error: 'numeric-limit' };
      }
    },
  };
}
