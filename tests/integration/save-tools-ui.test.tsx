// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { SaveToolsPanel } from '@features/settings/SaveToolsPanel';
import type { SaveEnvelope } from '@core/state/game-state';
import { gameFixture } from '../helpers/game-fixture';
afterEach(cleanup);
describe('Restore review UI', () => {
  it('previews imported state and invokes replacement only after the confirmation button', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '123';
    const candidate: SaveEnvelope = {
      schemaVersion: 7,
      contentVersion: catalog.balance.contentVersion,
      appVersion: '0.4.0',
      savedAtUtc: clock.nowUtc(),
      checksum: '0'.repeat(64),
      payload: state,
    };
    const restore = vi.fn().mockResolvedValue(undefined);
    render(
      <SaveToolsPanel
        busy={false}
        onExport={vi.fn()}
        onReadFile={vi.fn().mockResolvedValue(candidate)}
        onRestore={restore}
        onListBackups={vi.fn().mockResolvedValue([])}
        onDiagnostic={vi.fn().mockResolvedValue(false)}
      />,
    );
    fireEvent.change(screen.getByLabelText('Chọn file để khôi phục'), {
      target: { files: [new File(['{}'], 'saved.json', { type: 'application/json' })] },
    });
    await waitFor(() => expect(screen.getByText('Tiến trình sắp khôi phục')).toBeTruthy());
    expect(screen.getByText(/123 Coin/)).toBeTruthy();
    expect(restore).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Khôi phục tiến trình này' }));
    await waitFor(() => expect(screen.getByText('Đã khôi phục và lưu thành công.')).toBeTruthy());
    expect(restore).toHaveBeenCalledExactlyOnceWith(candidate);
  });
  it('reports an invalid file without exposing the replacement action', async () => {
    const restore = vi.fn();
    render(
      <SaveToolsPanel
        busy={false}
        onExport={vi.fn()}
        onReadFile={vi.fn().mockRejectedValue(new Error('invalid'))}
        onRestore={restore}
        onListBackups={vi.fn().mockResolvedValue([])}
        onDiagnostic={vi.fn().mockResolvedValue(false)}
      />,
    );
    fireEvent.change(screen.getByLabelText('Chọn file để khôi phục'), {
      target: { files: [new File(['bad'], 'bad.json')] },
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Tiến trình hiện tại được giữ nguyên',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Khôi phục tiến trình này' })).toBeNull();
    expect(restore).not.toHaveBeenCalled();
  });
});
