export type CoinKind = 'silver' | 'gold' | 'rainbow';
export interface CoinViewOptions {
  kind: CoinKind;
  hero: boolean;
  paused: boolean;
  reducedMotion: boolean;
}
export interface CoinViewHandle {
  update(options: CoinViewOptions): void;
  dispose(): void;
}
