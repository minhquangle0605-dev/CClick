import { memo, useEffect, useState, type CSSProperties } from 'react';
import { assets } from '@assets/asset-manifest';
import './animated-background.css';

// Stable layers: never randomize or restart when the game updates its balances.
const coins = [
  { x: '5%', y: '19%', size: '120px', duration: '24s', delay: '-8s', tilt: '-24deg' },
  { x: '20%', y: '69%', size: '68px', duration: '29s', delay: '-19s', tilt: '18deg' },
  { x: '44%', y: '10%', size: '42px', duration: '32s', delay: '-12s', tilt: '32deg' },
  { x: '91%', y: '57%', size: '150px', duration: '27s', delay: '-5s', tilt: '25deg' },
  { x: '78%', y: '13%', size: '76px', duration: '31s', delay: '-21s', tilt: '-30deg' },
  { x: '59%', y: '88%', size: '48px', duration: '22s', delay: '-16s', tilt: '-14deg' },
] as const;

export const AnimatedBackground = memo(function AnimatedBackground({
  reducedMotion,
  paused,
}: {
  reducedMotion: boolean;
  paused: boolean;
}) {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  return (
    <div
      className="ambient-background"
      aria-hidden="true"
      data-paused={paused || hidden || reducedMotion}
    >
      <img className="ambient-scene" src={assets.silverSky} alt="" decoding="async" />
      <div className="ambient-depth" />
      <div className="ambient-rays" />
      <div className="ambient-dust" />
      <div className="ambient-coins">
        {coins.map((coin, index) => (
          <div
            className="ambient-coin"
            key={index}
            style={
              {
                '--x': coin.x,
                '--y': coin.y,
                '--size': coin.size,
                '--duration': coin.duration,
                '--delay': coin.delay,
                '--tilt': coin.tilt,
              } as CSSProperties
            }
          >
            <img src={assets.silverCoin} alt="" width="160" height="160" />
          </div>
        ))}
      </div>
      <div className="ambient-veil" />
    </div>
  );
});
