import { amount } from '@shared/amount';
import type { GeneratorDefinition } from '@core/catalog/catalog.types';

// A technical bound; the shipped growth reaches the Amount ceiling much earlier.
export const MAX_GENERATOR_COUNT = 5000;
const ceiling = 10n ** 100n;
const curves = new Map<string, readonly bigint[]>();

function ratio(value: string): [bigint, bigint] {
  const [integer, fraction = ''] = amount.normalize(value).split('.');
  return [BigInt(integer! + fraction), 10n ** BigInt(fraction.length)];
}

/** Exact rational arithmetic: round UP each unit, then sum. Never round a bulk estimate. */
function curve(item: GeneratorDefinition): readonly bigint[] {
  const key = `${item.basePrice}:${item.priceGrowth}`;
  const cached = curves.get(key);
  if (cached) return cached;
  const [growthN, growthD] = ratio(item.priceGrowth);
  if (growthN <= growthD) throw new RangeError('Invalid price growth');
  let [numerator, denominator] = ratio(item.basePrice);
  const sums = [0n];
  for (let count = 0; count < MAX_GENERATOR_COUNT; count++) {
    const price = (numerator + denominator - 1n) / denominator;
    if (price > ceiling) break;
    sums.push(sums[sums.length - 1]! + price);
    numerator *= growthN;
    denominator *= growthD;
  }
  // Catalog edits use a different key. Keep the cache bounded for long development sessions.
  if (curves.size >= 32) curves.clear();
  curves.set(key, sums);
  return sums;
}

export function bulkPrice(
  item: GeneratorDefinition,
  owned: number,
  quantity: number,
): string | null {
  if (!Number.isSafeInteger(owned) || owned < 0 || !Number.isSafeInteger(quantity) || quantity < 1)
    return null;
  const sums = curve(item);
  const end = sums[owned + quantity];
  const start = sums[owned];
  if (start === undefined || end === undefined || end - start > ceiling) return null;
  return (end - start).toString();
}

export function maxAffordable(item: GeneratorDefinition, owned: number, balance: string): number {
  const sums = curve(item);
  if (!Number.isSafeInteger(owned) || owned < 0 || sums[owned] === undefined) return 0;
  const wallet = BigInt(amount.normalize(balance).split('.')[0]!);
  let low = 0;
  let high = sums.length - 1 - owned;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (sums[owned + middle]! - sums[owned]! <= wallet) low = middle;
    else high = middle - 1;
  }
  return low;
}
