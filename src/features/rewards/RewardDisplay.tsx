import type { Reward, AppliedReward } from '@core/rewards/reward.types';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { GameState } from '@core/state/game-state';
import { Coin3D } from '@ui/coins/Coin3D';
import { ItemArtwork } from '@ui/components/ItemArtwork';
import { useNumberFormat } from '@ui/components/number-format';
import { rewardLabel } from './reward-label';
import './rewards.css';

export function RewardDisplay({
  reward,
  catalog,
  state,
}: {
  reward: Reward | AppliedReward;
  catalog: GameCatalog;
  state?: Readonly<GameState>;
}) {
  const format = useNumberFormat();
  return (
    <span className="reward-display">
      {reward.kind === 'currency' ? (
        <Coin3D kind={reward.currency === 'coin' ? 'silver' : 'gold'} size={28} />
      ) : (
        <ItemArtwork id={reward.kind === 'item' ? reward.itemId : reward.cardId} size={28} />
      )}
      <span>{rewardLabel(reward, catalog, state, format)}</span>
    </span>
  );
}
