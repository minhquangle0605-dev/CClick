import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { sourceTotals } from '@core/progression/tracking';
import { productionPerSecond, clickPower } from '@core/economy/selectors';
import { offlineEfficiency } from '@core/cards/selectors';
import { amount } from '@shared/amount';
import { assets } from '@assets/asset-manifest';
import { Icon, type IconName } from '@ui/components/Icon';
import { ItemArtwork } from '@ui/components/ItemArtwork';
import { useNumberFormat } from '@ui/components/number-format';
import { text } from '@ui/components/text';

type Metric = {
  id: string;
  value: string;
  unit: string;
  icon: IconName | 'coin' | 'gold' | 'chest' | 'booster';
  breakdown?: [string, string][];
};
function MetricArtwork({ metric }: { metric: Metric }) {
  const label = text(`stats.${metric.id}`);
  if (metric.icon === 'coin' || metric.icon === 'gold')
    return (
      <img
        className="activity-artwork"
        src={metric.icon === 'gold' ? assets.goldCoin : assets.silverCoin}
        alt={label}
        width="56"
        height="56"
      />
    );
  if (metric.icon === 'chest' || metric.icon === 'booster')
    return (
      <ItemArtwork
        id={metric.icon === 'chest' ? 'chest.silver' : 'booster.turbo-mint'}
        label={label}
      />
    );
  return (
    <span className="activity-artwork activity-symbol" role="img" aria-label={label}>
      <Icon name={metric.icon} size={28} />
    </span>
  );
}
export function ActivityStatistics({
  state,
  catalog,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
}) {
  const format = useNumberFormat();
  const previous = sourceTotals(state);
  const sources = (keys: (keyof GameState['tracking']['coin'])[]): [string, string][] =>
    keys.map((key) => [text(`stats.source.${key}`), state.tracking.coin[key]]);
  const metrics: Metric[] = [
    { id: 'balance', value: state.wallet.coin, unit: 'Coin', icon: 'coin' },
    {
      id: 'produced',
      value: state.statistics.totalProducedCoin,
      unit: 'Coin',
      icon: 'coin',
      breakdown: [
        ...sources(['click', 'production', 'offline', 'timeWarp']),
        [text('stats.legacyProduction'), previous.unclassifiedProduced],
      ],
    },
    { id: 'spent', value: state.statistics.totalSpentCoin, unit: 'Coin', icon: 'coin' },
    {
      id: 'gifts',
      value: state.statistics.totalGiftCoin,
      unit: 'Coin',
      icon: 'coin',
      breakdown: [
        ...sources(['chest', 'daily', 'achievement']),
        [text('stats.legacyGift'), previous.unclassifiedGift],
      ],
    },
    { id: 'goldBalance', value: state.wallet.goldCoin, unit: 'Gold', icon: 'gold' },
    { id: 'eventGold', value: state.tracking.goldFromEvents, unit: 'Gold', icon: 'gold' },
    {
      id: 'clicks',
      value: String(state.statistics.clicks),
      unit: text('activity.times'),
      icon: 'cursor',
      breakdown: [
        [
          text('activity.otherClicks'),
          String(state.statistics.clicks - state.automation.automaticClicks),
        ],
        [text('stats.autoClicks'), String(state.automation.automaticClicks)],
      ],
    },
    {
      id: 'autoClicks',
      value: String(state.automation.automaticClicks),
      unit: text('activity.times'),
      icon: 'zap',
    },
    {
      id: 'autoActions',
      value: String(state.automation.actions),
      unit: text('activity.times'),
      icon: 'settings',
    },
    {
      id: 'cps',
      value: productionPerSecond(state, catalog),
      unit: text('home.perSecond'),
      icon: 'factory',
    },
    {
      id: 'clickPower',
      value: clickPower(state, catalog),
      unit: text('home.perClick'),
      icon: 'cursor',
    },
    {
      id: 'offline',
      value: amount.multiply(offlineEfficiency(state, catalog), '100'),
      unit: '%',
      icon: 'clock',
    },
    {
      id: 'chests',
      value: String(state.chests.opened),
      unit: text('activity.chestUnit'),
      icon: 'chest',
    },
    {
      id: 'cards',
      value: String(Object.keys(state.cards.owned).length),
      unit: text('activity.cardUnit'),
      icon: 'cards',
    },
    {
      id: 'daily',
      value: String(state.daily.claimCount),
      unit: text('activity.times'),
      icon: 'trophy',
    },
    {
      id: 'eventCoins',
      value: String(state.tracking.eventCoins),
      unit: text('activity.coinUnit'),
      icon: 'gold',
    },
    {
      id: 'rainbows',
      value: String(state.tracking.rainbows),
      unit: text('activity.times'),
      icon: 'sparkles',
    },
    {
      id: 'boosters',
      value: String(state.tracking.boostersUsed),
      unit: text('activity.itemUnit'),
      icon: 'booster',
    },
    {
      id: 'activeMinutes',
      value: String(Math.floor(state.tracking.activeMs / 60000)),
      unit: text('activity.minutes'),
      icon: 'clock',
    },
  ];
  const milestone = catalog.balance.longTermMilestone;
  return (
    <section className="activity-statistics" aria-label={text('itemStats.overviewEconomy')}>
      <h3>{text('itemStats.overviewEconomy')}</h3>
      <p className="info-note">{text('activity.intro')}</p>
      <ul className="activity-stat-list">
        {metrics.map((metric) => (
          <li key={metric.id}>
            <details
              className={`activity-stat-row ${format(metric.value).length > 22 ? 'activity-long-value' : ''}`}
              data-metric={metric.id}
            >
              <summary>
                <MetricArtwork metric={metric} />
                <span className="activity-name">
                  <strong>{text(`stats.${metric.id}`)}</strong>
                  <small>{text('itemStats.detail')}</small>
                </span>
                <span
                  className="activity-value"
                  title={`${format(metric.value)} ${metric.unit}`}
                  tabIndex={0}
                  aria-label={`${text(`stats.${metric.id}`)}: ${format(metric.value)} ${metric.unit}`}
                >
                  {format(metric.value)} <small>{metric.unit}</small>
                </span>
                <span className="activity-chevron" aria-hidden="true">
                  ⌄
                </span>
              </summary>
              <div className="activity-detail">
                <p>{text(`activity.description.${metric.id}`)}</p>
                {metric.id === 'autoActions' && state.automation.lastAction && (
                  <p>
                    {text('automation.lastAction')}: {text(state.automation.lastAction)}
                  </p>
                )}
                {metric.breakdown && (
                  <dl className="activity-breakdown">
                    {metric.breakdown.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd title={format(value)} tabIndex={0}>
                          {format(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
      <details className="activity-goal" open>
        <summary>
          <Icon name="trophy" size={20} />
          {text('stats.milestone')}
        </summary>
        <div className="long-milestone">
          <dl className="activity-breakdown">
            <div>
              <dt>{text('stats.produced')}</dt>
              <dd tabIndex={0}>{format(state.statistics.totalProducedCoin)} Coin</dd>
            </div>
            <div>
              <dt>{text('activity.goal')}</dt>
              <dd tabIndex={0}>{format(milestone)} Coin</dd>
            </div>
          </dl>
          <progress
            aria-label={text('stats.milestone')}
            max={100}
            value={amount.progress(state.statistics.totalProducedCoin, milestone)}
          />
          <small>
            {text(
              amount.compare(state.statistics.totalProducedCoin, milestone) >= 0
                ? 'stats.reached'
                : 'stats.milestoneHint',
            )}
          </small>
        </div>
      </details>
      <p className="info-note">{text('stats.historyNote')}</p>
    </section>
  );
}
