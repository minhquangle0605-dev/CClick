import { Coin3D } from '@ui/coins/Coin3D';
import './gold-artwork.css';

export function GoldArtwork({ label = '', size = 28 }: { label?: string; size?: number }) {
  return <Coin3D kind="gold" className="gold-artwork" label={label} size={size} />;
}
