// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import { App } from '@app/App';
import { BootScreen } from '@app/BootScreen';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { SaveReadError } from '@platform/storage/save-codec';
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
});

describe('Click → visible balance → save → fresh mount', () => {
  it('exchanges Gold through the real item shop, confirms use and saves the resulting effect', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.goldCoin = '10';
    state.generators['generator.auto-press'] = 1;
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: /^Vật phẩm/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Đổi lấy 1 · 10 Gold' })[0]!);
    await waitFor(() => expect(repository.stored?.payload.inventory['booster.turbo-mint']).toBe(1));
    fireEvent.click(screen.getAllByRole('button', { name: 'Kho tăng tốc' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /^Turbo Mint/ }));
    expect(repository.stored?.payload.inventory['booster.turbo-mint']).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận dùng 1 vật phẩm' }));
    await waitFor(() => expect(repository.stored?.payload.inventory['booster.turbo-mint']).toBe(0));
    expect(repository.stored?.payload.effects[0]?.value).toBe('2');
    expect(repository.stored?.payload.wallet.goldCoin).toBe('0');
    view.unmount();
    session.dispose();
  });
  it('buys a machine from the actual shop UI, raises CPS and persists ownership', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '33';
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mua Máy ép xu thủ công 1' }));
    expect(screen.getByTestId('coin-balance').textContent).toBe('18');
    fireEvent.click(screen.getByRole('button', { name: 'Mua Máy ép xu thủ công 1' }));
    await waitFor(() => expect(session.getSaveStatus().phase).toBe('saved'));
    expect(repository.stored?.payload.generators['generator.hand-press']).toBe(2);
    expect(
      screen.getByRole('button', { name: 'Mua Máy ép xu thủ công 1' }).hasAttribute('disabled'),
    ).toBe(true);
    await act(async () => {
      clock.advance(10000);
      session.tick();
      await session.requestSave();
    });
    expect(screen.getByTestId('coin-balance').textContent).toBe('102');
    view.unmount();
    session.dispose();
  });
  it('persists display preferences independently and opens the backup UI', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cài đặt' }));
    fireEvent.click(screen.getByRole('switch', { name: /Âm thanh chạm/ }));
    expect(JSON.parse(localStorage.getItem('coin-clicker-settings-v1')!).sound).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: 'Sao lưu' }).at(-1)!);
    expect(screen.getByRole('button', { name: 'Xuất file save' })).toBeTruthy();
    await act(async () => {
      await session.requestSave();
    });
    view.unmount();
    session.dispose();
  });
  it('preserves balance and clicks after recreating the engine, UI and database connection', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    const repository = await openSaveRepository(catalog, factory);
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(
      <StrictMode>
        <App session={session} />
      </StrictMode>,
    );
    expect(screen.getByTestId('coin-balance').textContent).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' }));
    expect(screen.getByTestId('coin-balance').textContent).toBe('1');
    for (let i = 0; i < 9; i++)
      fireEvent.click(screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' }));
    await waitFor(() => expect(screen.getByText('Đã lưu trên máy')).toBeTruthy());
    expect(session.engine.getSnapshot().statistics.clicks).toBe(10);
    view.unmount();
    session.dispose();
    repository.close();
    const reopened = await openSaveRepository(catalog, factory);
    const saved = await reopened.load();
    expect(saved).not.toBeNull();
    const next = createGameSession(
      createEngine(saved!.payload, catalog, clock),
      catalog,
      reopened,
      clock,
      { savedAt: saved!.savedAtUtc, savedRevision: saved!.payload.revision },
    );
    const reload = render(
      <StrictMode>
        <App session={next} />
      </StrictMode>,
    );
    expect(screen.getByTestId('coin-balance').textContent).toBe('10');
    expect(next.engine.getSnapshot().statistics.clicks).toBe(10);
    fireEvent.click(screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' }));
    await waitFor(() => expect(screen.getByText('Đã lưu trên máy')).toBeTruthy());
    expect((await reopened.load())?.payload.wallet.coin).toBe('11');
    reload.unmount();
    next.dispose();
    reopened.close();
  });
  it('shows a save failure, keeps the new balance and offers a working retry', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = new MemorySaveRepository();
    repository.failWrites = true;
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' }));
    await waitFor(() => expect(screen.getByText('Chưa lưu được tiến trình')).toBeTruthy());
    expect(screen.getByTestId('coin-balance').textContent).toBe('1');
    expect(screen.getByRole('alert').textContent).toContain('Tiến trình mới vẫn còn');
    repository.failWrites = false;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.getByText('Đã lưu trên máy')).toBeTruthy());
    expect(repository.stored?.payload.wallet.coin).toBe('1');
    view.unmount();
    session.dispose();
  });
  it('autosaves active production and settles hidden time once at 50 percent', async () => {
    vi.useFakeTimers();
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 10;
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(
      <StrictMode>
        <App session={session} />
      </StrictMode>,
    );
    try {
      await act(async () => {
        clock.advance(10000);
        await vi.advanceTimersByTimeAsync(10000);
      });
      expect(session.engine.getSnapshot().wallet.coin).toBe('200');
      await act(async () => {
        await session.requestSave();
      });
      expect(repository.stored?.payload.wallet.coin).toBe('200');
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      fireEvent(document, new Event('visibilitychange'));
      await act(async () => {
        clock.advance(60000);
        await vi.advanceTimersByTimeAsync(60000);
      });
      expect(session.engine.getSnapshot().wallet.coin).toBe('200');
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      fireEvent(document, new Event('visibilitychange'));
      await act(async () => {
        await vi.waitFor(() => expect(session.getNotice().busy).toBe(false));
      });
      expect(session.engine.getSnapshot().wallet.coin).toBe('800');
      await act(async () => {
        clock.advance(1000);
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(session.engine.getSnapshot().wallet.coin).toBe('820');
    } finally {
      view.unmount();
      session.dispose();
      vi.useRealTimers();
    }
  });
  it('explains an incompatible save without offering a destructive reset', () => {
    render(<BootScreen error={new SaveReadError('future-version')} />);
    expect(screen.getByRole('alert').textContent).toContain('phiên bản mới hơn');
    expect(screen.queryByRole('button', { name: /xóa|reset/i })).toBeNull();
  });
});
