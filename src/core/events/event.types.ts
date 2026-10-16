export interface EventObject {
  id: string;
  kind: 'gold' | 'rainbow';
  x: number;
  lane: number;
  spawnsAt: number;
  expiresAt: number;
}
export interface EventState {
  activeMs: number;
  rng: number;
  sequence: number;
  nextRainAt: number;
  rainEndsAt: number | null;
  nextRainbowAt: number | null;
  rainbowUnlocked: boolean;
  objects: EventObject[];
}
