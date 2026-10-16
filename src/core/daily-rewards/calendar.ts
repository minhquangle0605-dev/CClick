import type { DailyState } from '@core/progression/progression.types';

const DAY_MS = 86400000;
const VN_OFFSET_MS = 7 * 3600000;
/** Modern Vietnam uses UTC+7; independent of the browser/device timezone. */
export function vietnamDay(nowUtc: string): number {
  const ms = Date.parse(nowUtc);
  if (!Number.isFinite(ms)) throw new RangeError('Invalid UTC time');
  return Math.floor((ms + VN_OFFSET_MS) / DAY_MS);
}
export function dailyStatus(daily: DailyState, nowUtc: string) {
  const day = vietnamDay(nowUtc);
  const rollback = day < daily.highestDay;
  const available = !rollback && (daily.lastClaimDay === null || day > daily.lastClaimDay);
  const availableDay = Math.max(daily.highestDay, (daily.lastClaimDay ?? day - 1) + 1);
  return {
    day,
    rollback,
    available,
    nextReward: (daily.claimCount % 7) + 1,
    secondsRemaining: available
      ? 0
      : Math.max(0, Math.ceil((availableDay * DAY_MS - VN_OFFSET_MS - Date.parse(nowUtc)) / 1000)),
  };
}
