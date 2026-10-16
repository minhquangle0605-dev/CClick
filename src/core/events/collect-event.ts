import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import type { CommandResult, DomainEvent } from '@core/engine/contracts';
import { extendEffect, temporaryMultiplier } from '@core/effects/pipeline';
import { amount } from '@shared/amount';
import { eventCatalog } from '@core/cards/selectors';
import { increment } from '@core/progression/tracking';

export function collectEvent(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  objectId: string,
): CommandResult {
  catalog = eventCatalog(state, catalog);
  const object = state.events.objects.find((item) => item.id === objectId);
  if (
    !object ||
    object.spawnsAt > state.events.activeMs ||
    object.expiresAt <= state.events.activeMs
  )
    return { ok: false, error: 'expired-event' };
  let effects = state.effects;
  let gold = '0';
  if (object.kind === 'gold')
    gold = amount.multiply(
      catalog.events.rain.goldPerCoin,
      temporaryMultiplier(effects, 'gold', state.effectsAtMs, catalog.events.temporaryCap).value,
    );
  else {
    const rules = catalog.events.rainbow;
    for (const [target, value] of [
      ['production', rules.productionMultiplier],
      ['click', rules.clickMultiplier],
      ['gold', rules.goldMultiplier],
    ] as const)
      effects = extendEffect(
        effects,
        {
          sourceId: 'event.frenzy',
          target,
          operation: 'multiply',
          value,
          stackGroup: 'frenzy',
          startsAt: state.effectsAtMs,
          expiresAt: 0,
          stackPolicy: 'extend',
        },
        rules.frenzySeconds * 1000,
        rules.maxFrenzySeconds * 1000,
      );
  }
  const events: DomainEvent[] = [{ type: 'EventCollected', objectId }];
  if (gold !== '0') events.push({ type: 'GoldEarned', amount: gold });
  return {
    ok: true,
    value: {
      state: {
        ...state,
        revision: state.revision + 1,
        tracking: {
          ...state.tracking,
          goldFromEvents: amount.add(state.tracking.goldFromEvents, gold),
          eventCoins: increment(state.tracking.eventCoins, object.kind === 'gold' ? 1 : 0),
          rainbows: increment(state.tracking.rainbows, object.kind === 'rainbow' ? 1 : 0),
        },
        effects,
        wallet: { ...state.wallet, goldCoin: amount.add(state.wallet.goldCoin, gold) },
        events: {
          ...state.events,
          objects: state.events.objects.filter((item) => item.id !== objectId),
        },
      },
      events,
    },
  };
}
