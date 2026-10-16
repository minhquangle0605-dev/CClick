import { describe, expect, it } from 'vitest';
import { rawCatalog, validateCatalog } from '@content/index';
import vi from '@locales/vi.json';
import icons from '@assets/item-icon-ids.json';

function fixture() {
  return {
    ...structuredClone(rawCatalog),
    upgrades: rawCatalog.upgrades.map((item) => ({
      ...structuredClone(item),
      requires: [...item.requires] as string[],
    })),
  };
}

describe('Catalog boundary before the game boots', () => {
  it.each([
    'daily-order',
    'daily-source',
    'achievement-id',
    'achievement-target',
    'achievement-name',
  ] as const)('rejects invalid progression %s', (kind) => {
    const input = validateCatalog(structuredClone(rawCatalog), vi, icons);
    if (kind === 'daily-order') input.dailyRewards[0]!.day = 2;
    if (kind === 'daily-source')
      input.dailyRewards[0]!.rewards = [{ kind: 'item', itemId: 'item.unknown', quantity: 1 }];
    if (kind === 'achievement-id') input.achievements[1]!.id = input.achievements[0]!.id;
    if (kind === 'achievement-target') input.achievements[0]!.target = '-1';
    if (kind === 'achievement-name') input.achievements[0]!.nameKey = 'missing';
    expect(() => validateCatalog(input, vi, icons)).toThrow();
  });
  it.each(['weight', 'reward', 'synergy', 'key', 'cost', 'unreachable', 'missing-source'] as const)(
    'rejects invalid collection %s',
    (kind) => {
      const input = validateCatalog(structuredClone(rawCatalog), vi, icons);
      if (kind === 'weight') input.lootTables[0]!.entries[0]!.weight = 0;
      if (kind === 'reward')
        input.lootTables[0]!.entries[0]!.reward = {
          kind: 'card',
          cardId: 'card.missing',
          quantity: 1,
        };
      if (kind === 'synergy')
        input.cardSynergies[0]!.requires = ['card.silver-touch', 'card.silver-touch'];
      if (kind === 'key') input.chests[0]!.keyId = 'key.missing';
      if (kind === 'cost') input.cardProgression.upgradeCosts[0]!.level = 3;
      if (kind === 'unreachable')
        for (const table of input.lootTables)
          table.entries = table.entries.filter(
            (entry) => entry.reward.kind !== 'card' || entry.reward.cardId !== 'card.prism-heart',
          );
      if (kind === 'missing-source')
        input.itemOffers = input.itemOffers.filter((offer) => offer.itemId !== 'key.star');
      expect(() => validateCatalog(input, vi, icons)).toThrow();
    },
  );
  it.each(['source', 'schedule', 'gold', 'duration'] as const)(
    'rejects invalid expansion %s',
    (kind) => {
      const input = structuredClone(rawCatalog);
      if (kind === 'source') input.itemOffers = input.itemOffers.slice(1);
      if (kind === 'schedule') input.events.rain.count = 100;
      if (kind === 'gold') input.itemOffers[0]!.goldPrice = '1.5';
      if (kind === 'duration') input.boosters[0]!.maxDurationSeconds = 1;
      expect(() => validateCatalog(input, vi, icons)).toThrow();
    },
  );
  it('keeps Vietnamese labels intact instead of lossy encoding replacements', () => {
    expect(Object.values(vi).filter((value) => /\p{L}\?\p{L}|\?\?|\uFFFD/u.test(value))).toEqual(
      [],
    );
    expect(vi['settings.sound']).toBe('Âm thanh chạm');
    expect(vi['generator.mint-workshop.name']).toBe('Xưởng đúc xu');
  });
  it('rejects catalog values beyond the same numeric limit as the engine', () => {
    const input = fixture();
    input.generators[0]!.basePrice = `2${'0'.repeat(100)}`;
    expect(() => validateCatalog(input, vi, icons)).toThrow('Giá trị vượt phạm vi');
  });
  it('accepts the shipped catalog with linked names and icons', () => {
    expect(validateCatalog(rawCatalog, vi, icons).balance.contentVersion).toBe('0.7.0');
  });
  it('rejects negative prices', () => {
    const input = fixture();
    input.generators[0]!.basePrice = '-15';
    expect(() => validateCatalog(input, vi, icons)).toThrow();
  });
  it('rejects numeric amounts to prevent accidental float serialization', () => {
    expect(() =>
      validateCatalog(
        { ...rawCatalog, balance: { ...rawCatalog.balance, initialCoin: 0 } },
        vi,
        icons,
      ),
    ).toThrow();
  });
  it('rejects repeated IDs that would overwrite ownership', () => {
    const input = fixture();
    input.generators.push({ ...input.generators[0]! });
    expect(() => validateCatalog(input, vi, icons)).toThrow('ID trùng');
  });
  it('rejects a missing translation', () => {
    expect(() => validateCatalog(rawCatalog, {}, icons)).toThrow('Thiếu bản dịch');
  });
  it('rejects an unknown icon', () => {
    expect(() => validateCatalog(rawCatalog, vi, [])).toThrow('Thiếu icon');
  });
  it('rejects references to removed content', () => {
    const input = fixture();
    input.upgrades[0]!.requires = ['generator.not-found'];
    expect(() => validateCatalog(input, vi, icons)).toThrow('Tham chiếu không tồn tại');
  });
  it('rejects circular unlock requirements', () => {
    const input = fixture();
    input.upgrades[0]!.requires = ['upgrade.other'];
    input.upgrades.push({
      ...input.upgrades[0]!,
      id: 'upgrade.other',
      requires: ['upgrade.polished-die'],
    });
    expect(() => validateCatalog(input, vi, icons)).toThrow('Vòng điều kiện mở khóa');
  });
  it('rejects unsupported effect operations', () => {
    const input = fixture();
    input.upgrades[0]!.effect.operation = 'execute-script';
    expect(() => validateCatalog(input, vi, icons)).toThrow();
  });
});
