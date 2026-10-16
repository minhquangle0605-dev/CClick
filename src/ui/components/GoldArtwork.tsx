import { assets } from '@assets/asset-manifest';
import './gold-artwork.css';

export function GoldArtwork({ label = '', size = 28 }: { label?: string; size?: number }) {
  return (
    <img className="gold-artwork" src={assets.goldCoin} alt={label} width={size} height={size} />
  );
}
