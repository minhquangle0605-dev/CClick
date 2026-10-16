import type { GameCatalog } from './catalog.types';
export const inventoryDefinitions = (catalog: GameCatalog) => [
  ...catalog.boosters,
  ...catalog.chests,
  ...catalog.keys,
];
