// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor, within } from '@testing-library/react';
import { App } from '@app/App';
import { createGameSession } from '@app/game-session';
import { createEngine } from '@core/engine/create-engine';
import { decodeSave } from '@platform/storage/save-codec';
import { loadSettings } from '@platform/storage/settings-repository';
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
  vi.restoreAllMocks();
});

it('defaults old or invalid preferences to compact and preserves other settings', () => {
  localStorage.setItem(
    'coin-clicker-settings-v1',
    JSON.stringify({ sound: true, numberFormat: 'wrong' }),
  );
  expect(loadSettings().settings).toMatchObject({ sound: true, numberFormat: 'compact' });
  localStorage.setItem(
    'coin-clicker-settings-v1',
    JSON.stringify({ glow: false, numberFormat: 'full' }),
  );
  expect(loadSettings().settings).toMatchObject({ glow: false, numberFormat: 'full' });
});

it('switches all displayed amounts immediately, remembers the choice after remount and keeps the wallet exact', async () => {
  const { state, catalog, clock } = gameFixture();
  state.wallet.coin = state.statistics.totalProducedCoin = '1234567.8901';
  const repository = new MemorySaveRepository();
  const session = createGameSession(
    createEngine(state, catalog, clock),
    catalog,
    repository,
    clock,
  );
  let view = render(<App session={session} />);
  expect(screen.getByTestId('coin-balance').textContent).toBe('1,23 M');
  fireEvent.click(screen.getByRole('button', { name: 'Cài đặt' }));
  fireEvent.change(screen.getByRole('combobox', { name: /Hiển thị số/ }), {
    target: { value: 'full' },
  });
  expect(screen.getByTestId('coin-balance').textContent).toBe('1.234.567,8901');
  expect(loadSettings().settings.numberFormat).toBe('full');
  expect(session.engine.getSnapshot().wallet.coin).toBe('1234567.8901');
  view.unmount();
  view = render(<App session={session} />);
  expect(screen.getByTestId('coin-balance').textContent).toBe('1.234.567,8901');
  fireEvent.click(document.querySelector('.journey-details')!);
  fireEvent.click(screen.getByRole('button', { name: 'Tổng quan' }));
  const stats = screen.getByRole('dialog', { name: 'Thống kê' });
  expect(within(stats).getByRole('heading', { name: 'Chi tiết vật phẩm' })).toBeTruthy();
  expect(within(stats).getByRole('img', { name: 'Power Tap' })).toBeTruthy();
  expect(stats.querySelectorAll('.item-stat-row')).toHaveLength(19);
  expect(stats.textContent).toContain('1.234.567,8901');
  const row = stats.querySelector<HTMLElement>('[data-item-id="booster.power-tap"]')!;
  fireEvent.click(row.querySelector('summary')!);
  expect(row.hasAttribute('open')).toBe(true);
  expect(within(row).getByText('ĐÃ DÙNG VÀO')).toBeTruthy();
  view.unmount();
  session.dispose();
});

it('turning auto on in the actual app buys an affordable item, persists it and continues after reload', async () => {
  const { state, catalog, clock } = gameFixture();
  state.wallet.coin = state.statistics.totalProducedCoin = '15';
  const repository = new MemorySaveRepository();
  const session = createGameSession(
    createEngine(state, catalog, clock),
    catalog,
    repository,
    clock,
  );
  const view = render(<App session={session} />);
  fireEvent.click(screen.getByRole('button', { name: /Auto nâng cấp/ }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Auto nâng cấp/ }).getAttribute('aria-pressed')).toBe(
      'true',
    ),
  );
  expect(document.querySelector('.auto-plan')?.textContent).toContain('Sắp mua');
  await act(async () => {
    clock.advance(100);
    session.tick();
    await session.requestSave();
  });
  expect(session.engine.getSnapshot().generators['generator.hand-press']).toBe(1);
  expect(document.querySelector('.auto-plan')?.textContent).toContain('Đang tích Coin');
  expect(repository.stored?.payload.generators['generator.hand-press']).toBe(1);
  const saved = await decodeSave(repository.stored, catalog);
  const reload = createEngine(saved.payload, catalog, clock);
  clock.advance(10000);
  expect(reload.tick().ok).toBe(true);
  expect(reload.getSnapshot().automation.actions).toBeGreaterThan(saved.payload.automation.actions);
  view.unmount();
  session.dispose();
});
