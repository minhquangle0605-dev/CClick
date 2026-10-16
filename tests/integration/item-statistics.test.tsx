// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { StatisticsPanel } from '@features/statistics/StatisticsPanel';
import { createGameSession } from '@app/game-session';
import { createEngine } from '@core/engine/create-engine';
import { createItemHistory, itemTotals } from '@core/statistics/item-history';
import { grantRewards } from '@core/rewards/grant-rewards';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';
beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('shows every item with its picture, exact received/spent/current counts, expandable sources and search', () => {
  const { state, catalog, clock } = gameFixture();
  const gifted = grantRewards(
    state,
    catalog,
    [{ kind: 'item', itemId: 'booster.power-tap', quantity: 3 }],
    'daily',
  ).state;
  const engine = createEngine(gifted, catalog, clock);
  engine.dispatch({ type: 'UseBooster', itemId: 'booster.power-tap' });
  render(<StatisticsPanel state={engine.getSnapshot()} catalog={catalog} />);
  expect(screen.getAllByRole('img')).toHaveLength(7);
  const row = screen.getByRole('img', { name: 'Power Tap' }).closest('details')!;
  expect(row.textContent).toContain('Đã kiếm được3');
  expect(row.textContent).toContain('Đã tiêu1');
  expect(row.textContent).toContain('Hiện có2');
  fireEvent.click(row.querySelector('summary')!);
  expect(within(row).getByText('Thưởng ngày').parentElement?.textContent).toBe('Thưởng ngày3');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'power' } });
  expect(screen.getAllByRole('img')).toHaveLength(1);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'không có món này' } });
  expect(screen.getByText('Không tìm thấy mục phù hợp.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Thẻ công nghệ' }));
  expect(screen.getAllByRole('img')).toHaveLength(12);
  fireEvent.click(screen.getByRole('button', { name: 'Tổng quan' }));
  expect(screen.getByRole('progressbar')).toBeTruthy();
});
it('labels incomplete legacy totals as lower bounds and keeps the old stock separate', () => {
  const { state, catalog, clock } = gameFixture();
  state.inventory['key.star'] = 4;
  state.itemHistory = createItemHistory(clock.nowUtc(), state);
  render(<StatisticsPanel state={state} catalog={catalog} />);
  expect(screen.getByRole('note').textContent).toContain('không phải tổng chính xác');
  const row = document.querySelector('[data-item-id="key.star"]')!;
  expect(row.textContent).toContain('Đã kiếm được≥ 4');
  expect(row.textContent).toContain('Đã tiêu≥ 0');
  expect(row.textContent).toContain('Hiện có4');
});
it('commits inventory and lifetime counts together; failure, retry and reset keep them consistent', async () => {
  const { state, catalog, clock } = gameFixture();
  state.wallet.goldCoin = '100';
  const repository = new MemorySaveRepository();
  const session = createGameSession(
    createEngine(state, catalog, clock),
    catalog,
    repository,
    clock,
  );
  repository.failWrites = true;
  expect(
    await session.commitCommand({ type: 'PurchaseItem', offerId: 'offer.turbo-mint' }),
  ).toMatchObject({ ok: false, error: 'save-failed' });
  expect(session.engine.getSnapshot().itemHistory.entries).toEqual({});
  repository.failWrites = false;
  expect(
    (await session.commitCommand({ type: 'PurchaseItem', offerId: 'offer.turbo-mint' })).ok,
  ).toBe(true);
  expect(itemTotals(repository.stored!.payload, 'booster.turbo-mint').earnedTotal).toBe(1);
  const before = session.engine.getSnapshot().itemHistory;
  await session.reset('RESET', session.engine.getSnapshot().runId);
  expect(session.engine.getSnapshot().itemHistory.entries).toEqual({});
  expect(session.engine.getSnapshot().itemHistory.complete).toBe(true);
  expect(repository.resetBackup!.payload.itemHistory).toEqual(before);
  session.dispose();
});
