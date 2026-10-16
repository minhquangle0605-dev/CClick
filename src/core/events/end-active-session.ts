import type { GameState } from '@core/state/game-state';

/** Gold has a persistent automatic collector; its scheduled drops continue offline. */
export function endActiveSession(state: Readonly<GameState>, now: string): GameState {
  const effectsAtMs = Math.max(state.effectsAtMs, Date.parse(now));
  const effects = state.effects.filter((effect) => effect.expiresAt > effectsAtMs);
  if (
    effectsAtMs === state.effectsAtMs &&
    effects.length === state.effects.length &&
    !state.events.objects.some((item) => item.kind === 'rainbow')
  )
    return state as GameState;
  if (state.revision >= Number.MAX_SAFE_INTEGER) throw new RangeError('Revision limit');
  return {
    ...state,
    revision: state.revision + 1,
    effectsAtMs,
    effects,
    events: {
      ...state.events,
      objects: state.events.objects.filter((item) => item.kind === 'gold'),
    },
  };
}
