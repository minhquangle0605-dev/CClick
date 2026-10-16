import { describe, expect, it } from 'vitest';
import { amount } from '@shared/amount';

describe('Exact economy amounts', () => {
  it('shows full digits and fractions without losing precision or changing the compact default', () => {
    expect(amount.format('1234567.8901', 'full')).toBe('1.234.567,8901');
    expect(amount.format('9007199254740993', 'full')).toBe('9.007.199.254.740.993');
    expect(amount.format('0.000000000000000001', 'full')).toBe('0,000000000000000001');
    expect(amount.format('1e100', 'full').replaceAll('.', '')).toBe('1' + '0'.repeat(100));
    expect(amount.format('1234567.8901', 'compact')).toBe('1,23 M');
  });
  it('adds small gains beyond Number.MAX_SAFE_INTEGER without losing them', () => {
    expect(amount.add('1e15', '1')).toBe('1000000000000001');
    expect(amount.add('9007199254740992', '1')).toBe('9007199254740993');
    expect(amount.add('1e30', '1')).toBe('1000000000000000000000000000001');
    expect(amount.add('1e99', '0.000000000000000001')).toBe(
      `1${'0'.repeat(99)}.000000000000000001`,
    );
  });
  it('keeps fractional production exact', () => {
    expect(amount.add('0.1', '0.2')).toBe('0.3');
    expect(amount.multiply('0.1', '0.001')).toBe('0.0001');
    expect(amount.subtract('123.45', '123.44')).toBe('0.01');
    expect(amount.compare('1e30', '999999999999999999999999999999')).toBe(1);
  });
  it.each([
    '-1',
    '-0',
    'NaN',
    'Infinity',
    '1e101',
    '1e-19',
    '1e99999999999',
    '',
    '01',
    ' 1',
    '1,5',
  ])('rejects invalid amount %s', (value) => {
    expect(amount.isValid(value)).toBe(false);
    expect(() => amount.normalize(value)).toThrow(RangeError);
  });
  it('rejects unsafe results without producing negative or infinite money', () => {
    expect(() => amount.subtract('0', '1')).toThrow(RangeError);
    expect(() => amount.add('1e100', '1')).toThrow(RangeError);
    expect(() => amount.multiply('1e100', '2')).toThrow(RangeError);
    expect(amount.normalize('1e100')).toBe(`1${'0'.repeat(100)}`);
  });
  it('formats display independently from stored precision', () => {
    expect(amount.format('12345.6789')).toBe('12.345,67');
    expect(amount.format('1000000')).toBe('1,00 M');
    expect(amount.format('1e100')).toBe('1,00e+100');
    expect(amount.normalize('0.00000100')).toBe('0.000001');
    expect(amount.progress('125', '1000')).toBe(12.5);
    expect(amount.progress('1e30', '1000')).toBe(100);
  });
});
