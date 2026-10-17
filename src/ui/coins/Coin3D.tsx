import { memo, useContext, useEffect, useRef, type CSSProperties } from 'react';
import { assets } from '@assets/asset-manifest';
import { catalogArtwork } from '@assets/catalog-artwork';
import { CoinMotionContext } from './coin-motion-context';
import type { CoinKind, CoinViewHandle } from './coin-types';
import './coins.css';

/** Canvas is presentation only. The surrounding button owns all game input. */
export const Coin3D = memo(function Coin3D({
  kind,
  size = 48,
  label = '',
  className = '',
  hero = false,
  paused = false,
  reducedMotion = false,
}: {
  kind: CoinKind;
  size?: number;
  label?: string;
  className?: string;
  hero?: boolean;
  paused?: boolean;
  reducedMotion?: boolean;
}) {
  const context = useContext(CoinMotionContext);
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<CoinViewHandle | null>(null);
  const options = {
    kind,
    hero,
    paused: paused || context.paused,
    reducedMotion: reducedMotion || context.reducedMotion,
  };
  const current = useRef(options);
  useEffect(() => {
    current.current = options;
    handle.current?.update(options);
  }, [kind, hero, options.paused, options.reducedMotion]);
  useEffect(() => {
    if (!host.current || !canvas.current || typeof WebGL2RenderingContext === 'undefined') return;
    let cancelled = false;
    void import('./coin-renderer')
      .then(({ attachCoin }) => {
        if (cancelled || !host.current || !canvas.current) return;
        handle.current = attachCoin(host.current, canvas.current, current.current);
      })
      .catch(() => {
        /* Keep the supplied image if the optional renderer cannot load. */
      });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);
  const source =
    kind === 'silver'
      ? assets.silverCoin
      : kind === 'gold'
        ? assets.goldCoin
        : catalogArtwork['coin.rainbow'];
  return (
    <span
      ref={host}
      className={`coin-3d coin-3d-${kind} ${hero ? 'coin-3d-hero' : ''} ${className}`}
      data-coin-kind={kind}
      data-renderer="fallback"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={{ '--coin-size': `${size}px` } as CSSProperties}
    >
      <img
        className="coin-3d-fallback"
        src={source}
        alt=""
        draggable="false"
        width={size}
        height={size}
      />
      <canvas ref={canvas} className="coin-3d-canvas" aria-hidden="true" />
    </span>
  );
});
