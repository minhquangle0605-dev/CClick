// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CoinStage } from '@features/clicker/CoinStage';
import { Coin3D } from '@ui/coins/Coin3D';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const stage = {
  coin: '100',
  clickPower: '1',
  cps: '10',
  disabled: false,
  reducedMotion: false,
  glow: true,
};

it('keeps the coin playable and gives one Coin per mouse or keyboard click when WebGL is unavailable', () => {
  vi.stubGlobal('WebGL2RenderingContext', undefined);
  const onEarn = vi.fn().mockReturnValue(true);
  const view = render(
    <StrictMode>
      <CoinStage {...stage} onEarn={onEarn} />
    </StrictMode>,
  );
  const button = screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' });
  expect(document.querySelector('.coin-3d-hero')?.getAttribute('data-renderer')).toBe('fallback');
  expect(document.querySelector('.coin-3d-fallback')?.getAttribute('src')).toContain(
    'coin-silver-star',
  );
  for (let i = 0; i < 10; i++) fireEvent.click(button, { detail: 1 });
  fireEvent.click(button, { detail: 0 });
  expect(onEarn).toHaveBeenCalledTimes(11);
  view.rerender(<CoinStage {...stage} disabled onEarn={onEarn} />);
  fireEvent.click(screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' }));
  expect(onEarn).toHaveBeenCalledTimes(11);
});

it('does not double count synthesized clicks after touch, and ignores a cancelled contact', () => {
  class TouchPointer extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'touch';
    }
  }
  vi.stubGlobal('PointerEvent', TouchPointer);
  const onEarn = vi.fn().mockReturnValue(true);
  render(<CoinStage {...stage} onEarn={onEarn} />);
  const button = screen.getByRole('button', { name: 'Chạm đồng xu để kiếm Coin' });
  fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'touch' });
  fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'touch' });
  fireEvent.click(button, { detail: 1 });
  expect(onEarn).toHaveBeenCalledTimes(1);
  fireEvent.pointerDown(button, { pointerId: 2, pointerType: 'touch' });
  fireEvent.pointerCancel(button, { pointerId: 2, pointerType: 'touch' });
  fireEvent.pointerUp(button, { pointerId: 2, pointerType: 'touch' });
  expect(onEarn).toHaveBeenCalledTimes(1);
  fireEvent.click(button, { detail: 0 });
  expect(onEarn).toHaveBeenCalledTimes(2);
});

it('preserves the rendering surface during balance updates and labels each coin only once', () => {
  const onEarn = vi.fn().mockReturnValue(true);
  const view = render(<CoinStage {...stage} onEarn={onEarn} />);
  const surface = document.querySelector('.coin-3d-hero canvas');
  for (let i = 0; i < 20; i++)
    view.rerender(<CoinStage {...stage} coin={String(101 + i)} onEarn={onEarn} />);
  expect(document.querySelector('.coin-3d-hero canvas')).toBe(surface);
  view.unmount();
  render(
    <>
      <Coin3D kind="silver" label="Coin bạc" />
      <Coin3D kind="gold" label="Gold" />
      <Coin3D kind="rainbow" label="Xu cầu vồng" />
    </>,
  );
  expect(screen.getAllByRole('img')).toHaveLength(3);
  expect(screen.getByRole('img', { name: 'Xu cầu vồng' })).toBeTruthy();
});
