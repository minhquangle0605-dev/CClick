import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { rawCatalog, validateCatalog } from '../src/content/index';
import vi from '../src/locales/vi.json';
import icons from '../src/assets/item-icon-ids.json';
import { simulate } from './simulation/simulate';
import { profiles } from './simulation/profiles';

const args = process.argv.slice(2);
const option = (key: string) => args[args.indexOf(key) + 1];
const input = args.includes('--catalog')
  ? JSON.parse(readFileSync(resolve(option('--catalog')!), 'utf8'))
  : rawCatalog;
const catalog = validateCatalog(input, vi, icons);
const seeds = args.includes('--seed') ? [Number(option('--seed'))] : [17, 73, 211];
const horizon = args.includes('--days') ? Number(option('--days')) * 86400 : 30 * 86400;
if (
  !Number.isFinite(horizon) ||
  horizon <= 0 ||
  horizon > 30 * 86400 ||
  seeds.some((n) => !Number.isSafeInteger(n))
)
  throw new Error('Invalid simulation arguments');
const selected = args.includes('--profile')
  ? profiles.filter((p) => p.id === option('--profile'))
  : profiles;
if (!selected.length) throw new Error('Unknown profile');
const runs = [];
const started = performance.now();
for (const profile of selected)
  for (const seed of seeds) {
    const run = await simulate(catalog, profile, seed, horizon);
    runs.push(run);
    console.log(
      JSON.stringify({
        profile: profile.id,
        seed,
        final: run.samples.at(-1),
        milestones: run.milestones,
      }),
    );
  }
const report = {
  contentVersion: catalog.balance.contentVersion,
  profiles: selected,
  seeds,
  horizon,
  engine:
    'Real engine; 1-second active steps; purchases every 15 seconds; offline uses production snapshot and 8-hour cap.',
  runtimeSeconds: (performance.now() - started) / 1000,
  runs,
};
const output = resolve(
  args.includes('--out') ? option('--out')! : 'docs/balance/simulation-current.json',
);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`Report: ${output}; runtime ${report.runtimeSeconds.toFixed(1)}s`);
