import { afterEach, expect, it, vi } from 'vitest';
import { settleOfflineAsync } from '@platform/time/settle-offline-async';
import { settleOffline } from '@core/offline/settle-offline';
import { gameFixture } from '../helpers/game-fixture';

afterEach(() => vi.unstubAllGlobals());
it.each([true, false])(
  'terminates the worker and returns a candidate only on success=%s',
  async (success) => {
    const { state, catalog, clock } = gameFixture();
    state.automation.upgradeEnabled = true;
    clock.advance(60000);
    const expected = settleOffline(state, catalog, clock.nowUtc());
    const terminate = vi.fn();
    let posted: unknown;
    vi.stubGlobal(
      'Worker',
      class {
        onmessage?: (event: { data: unknown }) => void;
        onerror?: () => void;
        terminate = terminate;
        postMessage(data: unknown) {
          posted = data;
          queueMicrotask(() =>
            success ? this.onmessage?.({ data: { ok: true, result: expected } }) : this.onerror?.(),
          );
        }
      },
    );
    const pending = settleOfflineAsync(state, catalog, clock.nowUtc());
    if (success) expect(await pending).toEqual(expected);
    else await expect(pending).rejects.toThrow('Tiến trình đã lưu vẫn được giữ');
    expect(terminate).toHaveBeenCalledOnce();
    expect(posted).toEqual({ state, catalog, now: clock.nowUtc() });
    expect(state.wallet.coin).toBe('0');
  },
);
