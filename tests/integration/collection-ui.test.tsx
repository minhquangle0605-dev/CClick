// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '@app/App';
import { createGameSession } from '@app/game-session';
import { createEngine } from '@core/engine/create-engine';
import { ChestsPanel } from '@features/chests/ChestsPanel';
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

describe('Collection screens with the real session', () => {
  it('claims and opens a chest, restores its unread result, then equips and upgrades a card', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1000';
    state.cards.owned['card.silver-touch'] = { level: 1, duplicates: 1, convertedGold: '0' };
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const view = render(<App session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rương & chìa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nhận rương bạc miễn phí' }));
    await waitFor(() => expect(repository.stored?.payload.inventory['chest.silver']).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: 'Mở 1 Rương bạc' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Đã xem kết quả' })).toBeTruthy(),
    );
    const receipt = repository.stored!.payload.chests.lastResult;
    expect(repository.stored!.payload.statistics.totalGiftCoin).toBe('500');
    view.unmount();
    session.dispose();
    const resumed = createGameSession(
      createEngine(repository.stored!.payload, catalog, clock),
      catalog,
      repository,
      clock,
    );
    const reload = render(<App session={resumed} />);
    expect(screen.getByRole('dialog', { name: 'Rương & chìa' })).toBeTruthy();
    expect(resumed.engine.getSnapshot().chests.lastResult).toEqual(receipt);
    fireEvent.click(screen.getByRole('button', { name: 'Đã xem kết quả' }));
    await waitFor(() => expect(repository.stored!.payload.chests.acknowledged).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thẻ công nghệ' }));
    expect(
      screen.getByText(
        'Chỉ thẻ đang trang bị tạo bonus. Nâng cấp dùng bản trùng và Coin; tổ hợp tự bật khi cùng trang bị, không tiêu hủy thẻ.',
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Trang bị thẻ' }));
    await waitFor(() =>
      expect(repository.stored!.payload.cards.equipped).toEqual(['card.silver-touch']),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nâng 1 cấp' }));
    await waitFor(() =>
      expect(repository.stored!.payload.cards.owned['card.silver-touch']!.level).toBe(2),
    );
    expect(repository.stored!.payload.wallet.coin).toBe('1400');
    expect(repository.stored!.payload.chests.opened).toBe(1);
    reload.unmount();
    resumed.dispose();
  });
  it('shows every outcome and its actual weight before consuming a chest', () => {
    const { state, catalog } = gameFixture();
    state.inventory['chest.silver'] = 1;
    const onCommand = vi.fn();
    render(<ChestsPanel state={state} catalog={catalog} disabled={false} onCommand={onCommand} />);
    expect(screen.getByText('500 Coin')).toBeTruthy();
    fireEvent.click(screen.getAllByText(/Xem từng phần thưởng và tỷ lệ/)[0]!);
    expect(screen.getAllByRole('cell', { name: '12%' })).toHaveLength(6);
    expect(screen.getAllByRole('cell', { name: '6%' })).toHaveLength(4);
    expect(screen.getAllByRole('cell', { name: '2%' })).toHaveLength(2);
    expect(onCommand).not.toHaveBeenCalled();
  });
});
