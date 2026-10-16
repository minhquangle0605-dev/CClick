import { existsSync } from 'node:fs';
import { rawCatalog, validateCatalog } from '../src/content/index';
import vi from '../src/locales/vi.json';
import icons from '../src/assets/item-icon-ids.json';

const catalog = validateCatalog(rawCatalog, vi, icons);
if (!existsSync('src/assets/images/coins/coin-silver-star.svg')) {
  throw new Error('Thiếu ảnh xu bạc');
}
console.log(
  `Catalog hợp lệ: ${catalog.generators.length} máy, ${catalog.upgrades.length} nâng cấp, ${catalog.boosters.length} booster, ${catalog.cards.length} thẻ, ${catalog.cardSynergies.length} tổ hợp, ${catalog.chests.length} rương, ${catalog.itemOffers.length} quầy đổi, ${catalog.dailyRewards.length} quà ngày, ${catalog.achievements.length} thành tích.`,
);
