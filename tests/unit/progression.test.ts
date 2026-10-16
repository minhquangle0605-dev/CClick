import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { dailyStatus, vietnamDay } from '@core/daily-rewards/calendar';
import { achievementStatus } from '@core/achievements/selectors';
import { grantRewards } from '@core/rewards/grant-rewards';
import { sourceTotals } from '@core/progression/tracking';
import { settleOffline } from '@core/offline/settle-offline';
import { gameFixture } from '../helpers/game-fixture';

describe('Vietnam daily cycle', () => {
  it.each(['2026-01-31', '2026-12-31', '2028-02-29'])(
    'rolls over at Vietnam midnight at the end of %s',
    (date) => {
      const { state, catalog, clock } = gameFixture();
      clock.wallMilliseconds = Date.parse(`${date}T16:59:59.999Z`);
      state.daily.highestDay = vietnamDay(clock.nowUtc());
      const engine = createEngine(state, catalog, clock);
      expect(engine.dispatch({ type: 'ClaimDaily' }).ok).toBe(true);
      expect(engine.dispatch({ type: 'ClaimDaily' })).toEqual({
        ok: false,
        error: 'daily-claimed',
      });
      expect(dailyStatus(engine.getSnapshot().daily, clock.nowUtc()).secondsRemaining).toBe(1);
      clock.wallMilliseconds++;
      expect(dailyStatus(engine.getSnapshot().daily, clock.nowUtc()).available).toBe(true);
      expect(engine.dispatch({ type: 'ClaimDaily' }).ok).toBe(true);
      expect(engine.getSnapshot().daily.claimCount).toBe(2);
      expect(engine.getSnapshot().inventory['booster.turbo-mint']).toBe(1);
    },
  );
  it('keeps sequence after a skipped month, returns to day one after seven claims and does not replay missing days', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'ClaimDaily' });
    clock.wallMilliseconds += 30 * 86400000;
    for (let index = 1; index < 8; index++) {
      expect(dailyStatus(engine.getSnapshot().daily, clock.nowUtc()).nextReward).toBe(
        (index % 7) + 1,
      );
      expect(engine.dispatch({ type: 'ClaimDaily' }).ok).toBe(true);
      clock.wallMilliseconds += 86400000;
    }
    expect(engine.getSnapshot().daily.claimCount).toBe(8);
    expect(engine.getSnapshot().wallet.goldCoin).toBe('10');
    expect(engine.getSnapshot().inventory).toMatchObject({
      'chest.gold': 1,
      'chest.silver': 1,
      'key.star': 2,
      'booster.time-warp': 1,
    });
  });
  it('blocks a rolled-back day including one observed without claiming', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    clock.advance(86400000);
    engine.tick();
    const observed = engine.getSnapshot().daily.highestDay;
    clock.wallMilliseconds -= 86400000;
    expect(engine.dispatch({ type: 'ClaimDaily' })).toEqual({ ok: false, error: 'clock-rollback' });
    expect(engine.getSnapshot().daily.highestDay).toBe(observed);
    clock.wallMilliseconds += 86400000;
    expect(engine.dispatch({ type: 'ClaimDaily' }).ok).toBe(true);
  });
  it('does not advance the calendar or daily availability with Time Warp', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    state.inventory['booster.time-warp'] = 1;
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'ClaimDaily' });
    const before = engine.getSnapshot().daily;
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.time-warp' });
    expect(engine.getSnapshot().daily).toEqual(before);
    expect(engine.dispatch({ type: 'ClaimDaily' })).toEqual({ ok: false, error: 'daily-claimed' });
  });
  it('does not consume the day or grant partial rewards when inventory is full', () => {
    const { state, catalog, clock } = gameFixture();
    state.daily = {
      claimCount: 1,
      lastClaimDay: vietnamDay(clock.nowUtc()) - 1,
      highestDay: vietnamDay(clock.nowUtc()),
    };
    state.inventory['booster.turbo-mint'] = 9999;
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'ClaimDaily' })).toEqual({ ok: false, error: 'numeric-limit' });
    expect(engine.getSnapshot()).toEqual(state);
  });
});

describe('Achievements and income sources', () => {
  it('unlocks on the threshold, waits for explicit claim, then rejects a second grant', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    const achievement = catalog.achievements.find((item) => item.id === 'achievement.click-1')!;
    for (let i = 0; i < 9; i++) engine.dispatch({ type: 'ClickCoin' });
    expect(engine.dispatch({ type: 'ClaimAchievement', achievementId: achievement.id })).toEqual({
      ok: false,
      error: 'locked',
    });
    engine.dispatch({ type: 'ClickCoin' });
    expect(engine.getSnapshot().wallet.goldCoin).toBe('0');
    expect(achievementStatus(engine.getSnapshot(), achievement)).toMatchObject({
      ready: true,
      claimed: false,
      percent: 100,
    });
    expect(engine.dispatch({ type: 'ClaimAchievement', achievementId: achievement.id }).ok).toBe(
      true,
    );
    expect(engine.getSnapshot().wallet.goldCoin).toBe('5');
    expect(engine.dispatch({ type: 'ClaimAchievement', achievementId: achievement.id })).toEqual({
      ok: false,
      error: 'already-claimed',
    });
    expect(engine.getSnapshot().achievements.claimedIds).toEqual([achievement.id]);
  });
  it('keeps 10^15 production progress after spending and excludes gift Coin', () => {
    const { state, catalog, clock } = gameFixture();
    const achievement = catalog.achievements.find((item) => item.target === '1e15')!;
    const gift = grantRewards(
      state,
      catalog,
      [{ kind: 'currency', currency: 'coin', amount: '1e15' }],
      'achievement',
    ).state;
    expect(achievementStatus(gift, achievement).unlocked).toBe(false);
    state.wallet.coin = state.statistics.totalProducedCoin = '1e15';
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({
      type: 'PurchaseGenerator',
      generatorId: 'generator.hand-press',
      quantity: 1,
    });
    expect(engine.getSnapshot().wallet.coin).not.toBe('1e15');
    expect(achievementStatus(engine.getSnapshot(), achievement)).toMatchObject({
      ready: true,
      percent: 100,
    });
  });
  it('records actual credited click, production, offline and Time Warp amounts exactly', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    state.inventory['booster.time-warp'] = 1;
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'ClickCoin' });
    clock.advance(10000);
    engine.tick();
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.time-warp' });
    clock.advance(60000);
    const offline = settleOffline(engine.getSnapshot(), catalog, clock.nowUtc()).state;
    expect(offline.tracking.coin).toMatchObject({
      click: '101',
      production: '10',
      offline: '330',
      timeWarp: '3600',
    });
    expect(offline.statistics.totalProducedCoin).toBe('4041');
    const withGift = grantRewards(
      offline,
      catalog,
      [{ kind: 'currency', currency: 'coin', amount: '250' }],
      'daily',
    ).state;
    expect(withGift.tracking.coin.daily).toBe('250');
    expect(withGift.statistics.totalGiftCoin).toBe('250');
    expect(sourceTotals(withGift)).toEqual({ unclassifiedProduced: '0', unclassifiedGift: '0' });
  });
  it('counts manual and Magnet collection once, with event Gold independent from gift Gold', () => {
    const { state, catalog, clock } = gameFixture();
    state.events.nextRainAt = 1000;
    state.inventory['booster.golden-magnet'] = 1;
    const engine = createEngine(state, catalog, clock);
    clock.advance(1000);
    engine.tick();
    const id = engine.getSnapshot().events.objects[0]!.id;
    engine.dispatch({ type: 'CollectEvent', objectId: id });
    engine.dispatch({ type: 'CollectEvent', objectId: id });
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.golden-magnet' });
    clock.advance(10000);
    engine.tick();
    expect(engine.getSnapshot().tracking).toMatchObject({
      eventCoins: 10,
      goldFromEvents: '10',
      boostersUsed: 1,
    });
    engine.dispatch({ type: 'ClaimDaily' });
    expect(engine.getSnapshot().wallet.goldCoin).toBe('15');
    expect(engine.getSnapshot().tracking.goldFromEvents).toBe('10');
    expect(engine.getSnapshot().achievements.unlockedIds).toContain('achievement.gold-rain-1');
  });
  it('unlocks achievements when offline settlement crosses a production threshold', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '999';
    state.offlineCps = '2';
    clock.advance(1000);
    const result = settleOffline(state, catalog, clock.nowUtc());
    expect(result.state.achievements.unlockedIds).toContain('achievement.production-1');
    expect(result.state.wallet.goldCoin).toBe('0');
  });
});
