import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { text } from '@ui/components/text';
import { ItemStatisticsList } from './ItemStatisticsList';
import { ActivityStatistics } from './ActivityStatistics';
import './statistics.css';
import './activity-statistics.css';

export function OverviewStatistics({
  state,
  catalog,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
}) {
  return (
    <section className="statistics-panel">
      <ActivityStatistics state={state} catalog={catalog} />
      <h3>{text('itemStats.overviewItems')}</h3>
      <ItemStatisticsList state={state} catalog={catalog} kind="items" />
      <details className="overview-card-details">
        <summary>{text('itemStats.overviewCards')}</summary>
        <ItemStatisticsList state={state} catalog={catalog} kind="cards" />
      </details>
    </section>
  );
}
