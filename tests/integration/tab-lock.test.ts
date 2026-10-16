import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireTabLock } from '@platform/lifecycle/tab-lock';

afterEach(() => vi.unstubAllGlobals());
describe('Single writer across tabs', () => {
  it('holds the browser lock until release and prevents a second writer', async () => {
    let held = false;
    vi.stubGlobal('navigator', {
      locks: {
        async request(
          _name: string,
          _options: unknown,
          callback: (lock: object | null) => Promise<void>,
        ) {
          if (held) return callback(null);
          held = true;
          try {
            await callback({});
          } finally {
            held = false;
          }
        },
      },
    });
    const release = await acquireTabLock();
    await expect(acquireTabLock()).rejects.toThrow('Game đang mở');
    release();
    await vi.waitFor(() => expect(held).toBe(false));
    const releaseNext = await acquireTabLock();
    releaseNext();
  });
  it('fails explicitly if browser locks are unavailable', async () => {
    vi.stubGlobal('navigator', {});
    await expect(acquireTabLock()).rejects.toThrow();
  });
});
