// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AutoUpgradeControl } from '@features/automation/AutoUpgradeControl';
import { ItemShop } from '@features/shop/ItemShop';
import { createGameSession } from '@app/game-session';
import { createEngine } from '@core/engine/create-engine';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('saves the auto-upgrade toggle, survives reload and keeps the previous setting on write failure', async () => {
  const { state, catalog, clock } = gameFixture();
  const repository = new MemorySaveRepository();
  const session = createGameSession(
    createEngine(state, catalog, clock),
    catalog,
    repository,
    clock,
  );
  const view = render(
    <AutoUpgradeControl
      state={state}
      catalog={catalog}
      disabled={false}
      onCommand={session.commitCommand}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Auto nâng cấp/ }));
  await waitFor(() => expect(repository.stored?.payload.automation.upgradeEnabled).toBe(true));
  expect(session.engine.getSnapshot().automation.upgradeEnabled).toBe(true);
  const reloaded = await decodeSave(repository.stored, catalog);
  expect(reloaded.payload.automation.upgradeEnabled).toBe(true);
  repository.failWrites = true;
  expect(await session.commitCommand({ type: 'SetAutoUpgrade', enabled: false })).toMatchObject({
    ok: false,
    error: 'save-failed',
  });
  expect(session.engine.getSnapshot().automation.upgradeEnabled).toBe(true);
  repository.failWrites = false;
  expect((await session.commitCommand({ type: 'SetAutoUpgrade', enabled: false })).ok).toBe(true);
  expect(repository.stored?.payload.automation.upgradeEnabled).toBe(false);
  view.unmount();
  session.dispose();
});

it('renders every item offer together and buys the last offer without pagination', async () => {
  const { state, catalog } = gameFixture();
  state.wallet.goldCoin = '1000';
  const onCommand = vi.fn().mockResolvedValue({ ok: true, value: { state, events: [] } });
  render(
    <ItemShop
      state={state}
      catalog={catalog}
      disabled={false}
      onCommand={onCommand}
      onOpenInventory={vi.fn()}
    />,
  );
  const offers = screen.getAllByRole('article');
  expect(offers).toHaveLength(catalog.itemOffers.length);
  expect(screen.queryByRole('button', { name: 'Trang sau' })).toBeNull();
  fireEvent.click(within(offers.at(-1)!).getByRole('button'));
  expect(onCommand).toHaveBeenCalledExactlyOnceWith({
    type: 'PurchaseItem',
    offerId: catalog.itemOffers.at(-1)!.id,
  });
  await screen.findByText('Đã đổi Gold và lưu vật phẩm vào kho.');
});

it.each(['remainder', 'count', 'enabled'] as const)(
  'rejects malformed automation %s despite a valid checksum',
  async (kind) => {
    const { state, catalog, clock } = gameFixture();
    if (kind === 'remainder') state.automation.clickRemainderMs = 100;
    if (kind === 'count') state.automation.automaticClicks = 1;
    if (kind === 'enabled') Object.assign(state.automation, { upgradeEnabled: 'yes' });
    await expect(
      decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
    ).rejects.toMatchObject({ code: 'invalid' });
  },
);
