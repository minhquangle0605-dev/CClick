// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ShopPanel } from '@features/shop/ShopPanel';
import { gameFixture } from '../helpers/game-fixture';

afterEach(cleanup);
it('keeps the initial shop compact while all twelve tiers remain discoverable', () => {
  const { state, catalog } = gameFixture();
  render(<ShopPanel state={state} catalog={catalog} disabled={false} onCommand={vi.fn()} />);
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(screen.queryByText('Lò đúc vô tận')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.getByText('Lò đúc vô tận')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Trang sau' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Đang sở hữu' }));
  expect(screen.getByText('Chưa có mục nào trong nhóm này.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Gần mục tiêu' }));
  expect(screen.getByRole('button', { name: 'Mua Máy ép xu thủ công 1' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
  fireEvent.click(screen.getByRole('button', { name: /^Nâng cấp/ }));
  expect(screen.getAllByRole('article')).toHaveLength(30);
  expect(screen.getByText('Chạm khởi nguyên')).toBeTruthy();
});
