export type EffectTarget = 'production' | 'click' | 'gold' | 'magnet';
export interface ActiveEffect {
  sourceId: string;
  target: EffectTarget;
  operation: 'multiply';
  value: string;
  stackGroup: string;
  startsAt: number;
  expiresAt: number;
  stackPolicy: 'extend';
}
export interface Modifier {
  target: EffectTarget;
  operation: 'add' | 'percent' | 'multiply';
  value: string;
  stackGroup: string;
}
