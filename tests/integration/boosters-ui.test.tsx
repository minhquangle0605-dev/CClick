// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { BoostersPanel } from '@features/boosters/BoostersPanel';
import { EventField } from '@features/events/EventField';
import { gameFixture } from '../helpers/game-fixture';
afterEach(cleanup);
describe('Booster preview and event hit targets', () => {
  it('previews a Time Warp before the explicit consumption button', async () => {
    const { state, catalog } = gameFixture();
    state.inventory['booster.time-warp'] = 1;
    state.generators['generator.auto-press'] = 1;
    const onCommand = vi.fn().mockResolvedValue({ ok: true, value: { state, events: [] } });
    render(
      <BoostersPanel state={state} catalog={catalog} disabled={false} onCommand={onCommand} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Time Warp 1h/ }));
    expect(screen.getByText('+3.600 Coin')).toBeTruthy();
    expect(onCommand).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận dùng 1 vật phẩm' }));
    await waitFor(() =>
      expect(onCommand).toHaveBeenCalledExactlyOnceWith({
        type: 'UseBooster',
        itemId: 'booster.time-warp',
      }),
    );
  });
  it('renders only live objects and disables collection while another action is committing', () => {
    const { state, catalog } = gameFixture();
    state.events.activeMs = 1000;
    state.events.objects = [
      { id: 'live', kind: 'gold', x: 50, lane: 0, spawnsAt: 500, expiresAt: 3000 },
      { id: 'future', kind: 'gold', x: 20, lane: 1, spawnsAt: 2000, expiresAt: 5000 },
    ];
    const onCommand = vi.fn();
    const { rerender } = render(
      <EventField
        state={state}
        catalog={catalog}
        disabled={false}
        reducedMotion={true}
        onCommand={onCommand}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Thu xu vàng live' })).toBeTruthy();
    rerender(
      <EventField
        state={state}
        catalog={catalog}
        disabled={true}
        reducedMotion={true}
        onCommand={onCommand}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Thu xu vàng live' }));
    expect(onCommand).not.toHaveBeenCalled();
  });
});
