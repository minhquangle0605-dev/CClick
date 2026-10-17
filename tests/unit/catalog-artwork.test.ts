import { expect, it } from 'vitest';
import { catalogArtwork, catalogArtworkManifest } from '@assets/catalog-artwork';
import { gameFixture } from '../helpers/game-fixture';

it('provides a unique imported picture for every catalog entry and all seven daily layouts', () => {
  const { catalog } = gameFixture();
  const expected = [
    'coin.rainbow',
    ...catalog.generators.map((item) => item.id),
    ...catalog.upgrades.map((item) => item.id),
    ...catalog.cards.map((item) => item.id),
    ...catalog.boosters.map((item) => item.id),
    ...catalog.chests.map((item) => item.id),
    ...catalog.keys.map((item) => item.id),
    ...catalog.cardSynergies.map((item) => item.id),
    ...catalog.achievements.map((item) => item.id),
    ...catalog.dailyRewards.map((item) => `daily.day-${item.day}`),
  ];
  expect(Object.keys(catalogArtwork).sort()).toEqual(expected.sort());
  expect(catalogArtworkManifest).toHaveLength(102);
  expect(new Set(catalogArtworkManifest.map((item) => item.id)).size).toBe(102);
  expect(new Set(Object.values(catalogArtwork)).size).toBe(102);
  for (const item of catalogArtworkManifest) {
    expect(item.file).toBe(`images/${item.category}/${item.id}.png`);
    expect(catalogArtwork[item.id]).toBeTruthy();
  }
});
