import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { OverviewStatistics } from './OverviewStatistics';
import { ItemStatisticsList } from './ItemStatisticsList';
import { text } from '@ui/components/text';
import './statistics.css';

export function StatisticsPanel({
  state,
  catalog,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
}) {
  const [view, setView] = useState<'items' | 'cards' | 'overview'>('items');
  return (
    <section className="statistics-panel">
      <div className="statistics-tabs" role="group" aria-label={text('itemStats.sections')}>
        {(['items', 'cards', 'overview'] as const).map((tab) => (
          <button key={tab} aria-pressed={view === tab} onClick={() => setView(tab)}>
            {text(`itemStats.tab.${tab}`)}
          </button>
        ))}
      </div>
      {view === 'overview' ? (
        <OverviewStatistics state={state} catalog={catalog} />
      ) : (
        <ItemStatisticsList key={view} state={state} catalog={catalog} kind={view} />
      )}
    </section>
  );
}
