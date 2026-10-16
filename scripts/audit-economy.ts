import { writeFileSync, mkdirSync } from 'node:fs';
import { rawCatalog, validateCatalog } from '../src/content/index';
import vi from '../src/locales/vi.json';
import icons from '../src/assets/item-icon-ids.json';
import { auditEconomy } from './simulation/audit';
const report = auditEconomy(validateCatalog(rawCatalog, vi, icons));
mkdirSync('docs/balance', { recursive: true });
writeFileSync('docs/balance/economy-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
