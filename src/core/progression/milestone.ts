import { amount } from '@shared/amount';
export function nextMilestone(total: string, first: string): string {
  let target = first;
  while (amount.compare(total, target) >= 0 && amount.compare(target, '1e100') < 0)
    target = amount.productCapped([target, '10'], '1e100');
  return target;
}
