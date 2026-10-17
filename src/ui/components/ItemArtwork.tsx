import { Coin3D } from '@ui/coins/Coin3D';
import type { CSSProperties } from 'react';
import { catalogArtwork } from '@assets/catalog-artwork';
import { VectorItemArtwork } from './VectorItemArtwork';
import './item-artwork.css';

/** One catalog ID maps to the same picture throughout the game. Empty labels are decorative. */
export function ItemArtwork({
  id,
  label = '',
  size = 64,
  className = '',
  eager = false,
}: {
  id: string;
  label?: string;
  size?: number;
  className?: string;
  eager?: boolean;
}) {
  if (id === 'coin.rainbow')
    return <Coin3D kind="rainbow" size={size} label={label} className={className} />;
  const source = catalogArtwork[id];
  if (!source) return <VectorItemArtwork id={id} label={label} />;
  return (
    <img
      className={`item-artwork ${className}`}
      data-asset-id={id}
      src={source}
      alt={label}
      width={size}
      height={size}
      style={{ '--artwork-size': `${size}px` } as CSSProperties}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}
