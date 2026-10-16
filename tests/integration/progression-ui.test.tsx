// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act, within } from '@testing-library/react';
import { App } from '@app/App';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { DailyPanel } from '@features/daily-rewards/DailyPanel';
import { vietnamDay } from '@core/daily-rewards/calendar';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Daily, achievements and personal management screens', () => {
  it('claims daily, explicitly claims its achievement, then keeps both claims after remount', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Thưởng ngày' }));
    expect(repository.stored?.payload.daily.claimCount ?? 0).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Nhận quà hôm nay' }));
    await waitFor(() => expect(repository.stored?.payload.daily.claimCount).toBe(1));
    expect(repository.stored!.payload.wallet.goldCoin).toBe('5');
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    fireEvent.click(screen.getByRole('button', { name: /^Thành tích/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Nhận thưởng Lời chào mỗi ngày' }));
    await waitFor(() =>
      expect(repository.stored!.payload.achievements.claimedIds).toEqual(['achievement.daily-1']),
    );
    expect(repository.stored!.payload.wallet.goldCoin).toBe('10');
    view.unmount();
    session.dispose();
    const resumed = createGameSession(
      createEngine(repository.stored!.payload, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const reload = render(<App session={resumed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Thưởng ngày' }));
    expect(
      screen.getByRole('button', { name: 'Chờ ngày tiếp theo' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thống kê' }));
    expect(screen.getByRole('dialog', { name: 'Thống kê' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tổng quan' }));
    expect(
      screen
        .getByRole('progressbar', { name: 'Mục tiêu dài hạn · 10^15 Coin' })
        .getAttribute('value'),
    ).toBe('0');
    expect(screen.getByText('Sản xuất chưa phân loại (bản cũ)')).toBeTruthy();
    reload.unmount();
    resumed.dispose();
  });
  it('shows the reset preview, requires RESET, retains progress on failure and settings after success', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '100';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cài đặt' }));
    fireEvent.click(screen.getByRole('switch', { name: /Âm thanh chạm/ }));
    const preferences = localStorage.getItem('coin-clicker-settings-v1');
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu lượt chơi mới' }));
    expect(
      screen.getByText('Xóa lịch nhận thưởng ngày, thành tích và thống kê của lượt hiện tại.'),
    ).toBeTruthy();
    const confirm = screen.getByRole('button', { name: 'Xác nhận bắt đầu lại' });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByLabelText('Nhập RESET để xác nhận'), {
      target: { value: 'reset' },
    });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByLabelText('Nhập RESET để xác nhận'), {
      target: { value: 'RESET' },
    });
    repository.failWrites = true;
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Tiến trình cũ vẫn còn'),
    );
    expect(session.engine.getSnapshot().wallet.coin).toBe('100');
    repository.failWrites = false;
    fireEvent.click(confirm);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(session.engine.getSnapshot().wallet.coin).toBe('0');
    expect(session.engine.getSnapshot().runId).not.toBe(state.runId);
    expect(localStorage.getItem('coin-clicker-settings-v1')).toBe(preferences);
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sao lưu' }));
    await waitFor(() => expect(screen.getByText('Trước reset gần nhất')).toBeTruthy());
    const row = screen.getByText('Trước reset gần nhất').closest('li')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Xem trước' }));
    expect(session.engine.getSnapshot().wallet.coin).toBe('0');
    view.unmount();
    session.dispose();
  });
  it('updates the countdown at Vietnam midnight without closing the reward panel', async () => {
    vi.useFakeTimers();
    const { state, catalog, clock } = gameFixture();
    clock.wallMilliseconds = Date.parse('2026-12-31T16:59:59.000Z');
    const day = vietnamDay(clock.nowUtc());
    state.daily = { claimCount: 1, lastClaimDay: day, highestDay: day };
    render(
      <DailyPanel
        state={state}
        catalog={catalog}
        disabled={false}
        onCommand={vi.fn()}
        nowUtc={() => clock.nowUtc()}
      />,
    );
    expect(screen.getByText('00:00:01')).toBeTruthy();
    await act(async () => {
      clock.wallMilliseconds += 1000;
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole('button', { name: 'Nhận quà hôm nay' }).hasAttribute('disabled')).toBe(
      false,
    );
  });
});
