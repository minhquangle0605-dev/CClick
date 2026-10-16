import type { Clock } from '@core/ports';

export const browserClock: Clock = {
  nowUtc: () => new Date().toISOString(),
  monotonicMilliseconds: () => performance.now(),
};
