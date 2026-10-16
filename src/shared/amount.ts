import Decimal from 'decimal.js';

/** Serialized decimal. Never use Number/parseFloat for economy calculations. */
export type AmountString = string;

export interface AmountOperations {
  add(left: AmountString, right: AmountString): AmountString;
  subtract(left: AmountString, right: AmountString): AmountString;
  multiply(left: AmountString, right: AmountString): AmountString;
  compare(left: AmountString, right: AmountString): -1 | 0 | 1;
}

const BigDecimal = Decimal.clone({ precision: 120, rounding: Decimal.ROUND_HALF_UP });
const maximum = new BigDecimal('1e100');
const syntax = /^(0|[1-9]\d*)(\.\d+)?(e[+-]?\d+)?$/i;

function read(value: AmountString): Decimal {
  if (typeof value !== 'string' || value.length > 160 || !syntax.test(value)) {
    throw new RangeError('Invalid amount');
  }
  const result = new BigDecimal(value);
  if (
    !result.isFinite() ||
    result.isNegative() ||
    result.gt(maximum) ||
    result.decimalPlaces() > 18
  ) {
    throw new RangeError('Amount outside supported range');
  }
  return result;
}

function serialize(value: Decimal): AmountString {
  return read(value.toFixed()).toFixed();
}

export const amount: AmountOperations & {
  normalize(value: string): AmountString;
  isValid(value: unknown): value is AmountString;
  format(value: AmountString, mode?: 'compact' | 'full'): string;
  progress(value: AmountString, goal: AmountString): number;
  divideCeil(left: AmountString, right: AmountString): AmountString;
  scaledDivideCeil(left: AmountString, right: AmountString, scale: AmountString): AmountString;
  min(left: AmountString, right: AmountString): AmountString;
  productCapped(values: readonly AmountString[], cap: AmountString): AmountString;
  sumsEqual(left: readonly AmountString[], right: readonly AmountString[]): boolean;
} = {
  sumsEqual: (left, right) =>
    left
      .reduce((sum, value) => sum.plus(read(value)), new BigDecimal(0))
      .eq(right.reduce((sum, value) => sum.plus(read(value)), new BigDecimal(0))),
  normalize: (value) => read(value).toFixed(),
  isValid(value): value is AmountString {
    try {
      read(value as string);
      return true;
    } catch {
      return false;
    }
  },
  add: (left, right) => serialize(read(left).plus(read(right))),
  subtract: (left, right) => serialize(read(left).minus(read(right))),
  multiply: (left, right) => serialize(read(left).times(read(right))),
  compare: (left, right) => read(left).comparedTo(read(right)) as -1 | 0 | 1,
  divideCeil: (left, right) => serialize(read(left).div(read(right)).ceil()),
  scaledDivideCeil: (left, right, scale) =>
    serialize(BigDecimal.min(read(left).times(read(scale)).div(read(right)).ceil(), maximum)),
  min: (left, right) => serialize(BigDecimal.min(read(left), read(right))),
  productCapped: (values, cap) =>
    serialize(
      BigDecimal.min(
        values.reduce((total, value) => total.times(read(value)), new BigDecimal(1)),
        read(cap),
      ),
    ),
  format(value, mode = 'compact') {
    const parsed = read(value);
    if (mode === 'full') {
      const [integer, fraction] = parsed.toFixed().split('.');
      return integer!.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (fraction ? `,${fraction}` : '');
    }
    // Only display rounding; the state and saved value remain exact.
    if (parsed.gte('1000000000000000')) return parsed.toExponential(2).replace('.', ',');
    const units = [
      ['1000000000000', 'T'],
      ['1000000000', 'B'],
      ['1000000', 'M'],
    ] as const;
    for (const [threshold, suffix] of units) {
      if (parsed.gte(threshold))
        return `${parsed.div(threshold).toFixed(2).replace('.', ',')} ${suffix}`;
    }
    const [integer, fraction] = parsed.toFixed(2, Decimal.ROUND_DOWN).split('.');
    const grouped = integer!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const trimmed = fraction!.replace(/0+$/, '');
    return trimmed ? `${grouped},${trimmed}` : grouped;
  },
  progress(value, goal) {
    const target = read(goal);
    if (target.isZero()) return 100;
    // Conversion only for the bounded UI percentage, never the wallet.
    return BigDecimal.min(read(value).div(target).times(100), 100).toNumber();
  },
};
