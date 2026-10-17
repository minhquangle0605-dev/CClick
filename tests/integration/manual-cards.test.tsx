// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { CardsPanel } from '@features/cards/CardsPanel';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { createItemHistory } from '@core/statistics/item-history';
import { snapshotRates } from '@core/automation/upgrade-planner';
import { settleOffline } from '@core/offline/settle-offline';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { changeCard } from '@core/cards/commands';
import { amount } from '@shared/amount';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';
import legacySave from '../fixtures/saves/v7.json';

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fixture() {
  const { state, catalog, clock } = gameFixture();
  for (const id of ['card.silver-touch', 'card.mint-gear', 'card.steady-hand'])
    state.cards.owned[id] = { level: 1, duplicates: 2, convertedGold: '0' };
  state.cards.equipped = ['card.silver-touch', 'card.mint-gear'];
  state.itemHistory = createItemHistory(clock.nowUtc(), state);
  state.automation.upgradeEnabled = true;
  const repository = new MemorySaveRepository();
  const session = createGameSession(
    createEngine(snapshotRates(state, catalog), catalog, clock),
    catalog,
    repository,
    clock,
  );
  function Panel() {
    const current = useSyncExternalStore(session.engine.subscribe, session.engine.getSnapshot);
    return (
      <CardsPanel
        state={current}
        catalog={catalog}
        disabled={false}
        onCommand={session.commitCommand}
      />
    );
  }
  return { state, catalog, clock, repository, session, Panel };
}

it('removes a card from its equipped slot and adds an owned card directly from its tile without spending resources', async () => {
  const { session, repository, Panel, state, catalog } = fixture();
  const view = render(<Panel />);
  const steady = document.querySelector('[data-card-id="card.steady-hand"]') as HTMLElement;
  expect(
    (within(steady).getByRole('button', { name: 'Trang bị thẻ Bàn tay vững' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    screen.getByText('Đã đầy ô trang bị. Tháo một thẻ ở phía trên để thêm thẻ khác.'),
  ).toBeTruthy();
  const slots = document.querySelector('.equipped-slots') as HTMLElement;
  fireEvent.click(within(slots).getByRole('button', { name: 'Tháo thẻ Chạm bạc' }));
  await waitFor(() =>
    expect(repository.stored?.payload.cards.equipped).toEqual(['card.mint-gear']),
  );
  expect(session.engine.getSnapshot().automation).toMatchObject({
    upgradeEnabled: true,
    autoEquipEnabled: false,
  });
  fireEvent.click(within(steady).getByRole('button', { name: 'Trang bị thẻ Bàn tay vững' }));
  await waitFor(() =>
    expect(repository.stored?.payload.cards.equipped).toEqual([
      'card.mint-gear',
      'card.steady-hand',
    ]),
  );
  const saved = (await decodeSave(repository.stored, catalog)).payload;
  expect(saved.cards.owned).toEqual(state.cards.owned);
  expect(saved.wallet).toEqual(state.wallet);
  expect(saved.itemHistory).toEqual(state.itemHistory);
  expect(saved.automation.autoEquipEnabled).toBe(false);
  view.unmount();
  session.dispose();
});

it('retains an empty manual loadout through ticks, reload and offline while Coin purchases continue; permits opting back into auto selection', async () => {
  const { session, repository, clock, catalog, state } = fixture();
  for (const cardId of state.cards.equipped)
    expect((await session.commitCommand({ type: 'UnequipCard', cardId })).ok).toBe(true);
  clock.advance(10000);
  session.tick();
  expect(session.engine.getSnapshot().cards.equipped).toEqual([]);
  expect(
    amount.compare(session.engine.getSnapshot().statistics.totalSpentCoin, '0'),
  ).toBeGreaterThan(0);
  await session.requestSave();
  const saved = await decodeSave(repository.stored, catalog);
  clock.advance(600000);
  const offline = settleOffline(saved.payload, catalog, clock.nowUtc());
  expect(offline.state.cards.equipped).toEqual([]);
  expect(offline.summary.upgrades).toBeGreaterThan(0);
  expect(offline.state.cards.owned).toEqual(state.cards.owned);
  const reload = createEngine(offline.state, catalog, clock);
  expect(reload.dispatch({ type: 'SetAutoEquip', enabled: true }).ok).toBe(true);
  clock.advance(100);
  reload.tick();
  expect(reload.getSnapshot().cards.equipped.length).toBeGreaterThan(0);
  expect(reload.getSnapshot().automation.upgradeEnabled).toBe(true);
  session.dispose();
});

it('keeps both equipped cards and automatic selection unchanged on failed save; disabling auto selection is durable', async () => {
  const { session, repository, Panel, state, catalog } = fixture();
  repository.failWrites = true;
  const view = render(<Panel />);
  fireEvent.click(
    within(document.querySelector('.equipped-slots') as HTMLElement).getByRole('button', {
      name: 'Tháo thẻ Chạm bạc',
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('Chưa ghi được dữ liệu'),
  );
  expect(session.engine.getSnapshot().cards).toEqual(state.cards);
  expect(session.engine.getSnapshot().automation.autoEquipEnabled).toBe(true);
  repository.failWrites = false;
  fireEvent.click(screen.getByRole('button', { name: 'Auto chọn thẻ: Bật' }));
  await waitFor(() => expect(repository.stored?.payload.automation.autoEquipEnabled).toBe(false));
  expect((await decodeSave(repository.stored, catalog)).payload.automation.autoEquipEnabled).toBe(
    false,
  );
  expect(session.engine.getSnapshot().cards).toEqual(state.cards);
  expect(session.engine.getSnapshot().automation.upgradeEnabled).toBe(true);
  view.unmount();
  session.dispose();
});

it('does not change policy or holdings for a full slot or an unowned card', () => {
  const { state, catalog, session } = fixture();
  const before = structuredClone(state);
  expect(changeCard(state, catalog, { type: 'EquipCard', cardId: 'card.steady-hand' })).toEqual({
    ok: false,
    error: 'slots-full',
  });
  const unowned = catalog.cards.find((card) => !state.cards.owned[card.id])!;
  expect(changeCard(state, catalog, { type: 'EquipCard', cardId: unowned.id })).toEqual({
    ok: false,
    error: 'card-not-owned',
  });
  expect(state).toEqual(before);
  session.dispose();
});

it('migrates the frozen schema 7 save without changing holdings or existing automation preferences', async () => {
  const { catalog } = gameFixture();
  const saved = await decodeSave(legacySave, catalog);
  expect(saved.schemaVersion).toBe(8);
  expect(saved.payload).toEqual({
    ...legacySave.payload,
    automation: { ...legacySave.payload.automation, autoEquipEnabled: true },
  });
  expect(await decodeSave(saved, catalog)).toEqual(saved);
});

it('rejects a malformed auto-equip preference even with a valid checksum', async () => {
  const { state, catalog, clock } = gameFixture();
  Object.assign(state.automation, { autoEquipEnabled: 'yes' });
  await expect(
    decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
  ).rejects.toMatchObject({ code: 'invalid' });
});
