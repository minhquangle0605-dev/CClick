import { useState } from 'react';
import type { GameState } from '@core/state/game-state';
import type { DurableAction } from '@core/engine/contracts';
import { Icon } from '@ui/components/Icon';
import { text } from '@ui/components/text';
import './automation.css';
import type { GameCatalog } from '@core/catalog/catalog.types';
import { selectAutoInvestment } from '@core/automation/investment';
import { amount } from '@shared/amount';
import { useNumberFormat } from '@ui/components/number-format';

export function AutoUpgradeControl({
  state,
  catalog,
  disabled,
  onCommand,
}: {
  state: Readonly<GameState>;
  catalog: GameCatalog;
  disabled: boolean;
  onCommand: DurableAction;
}) {
  const [error, setError] = useState('');
  const enabled = state.automation.upgradeEnabled;
  const format = useNumberFormat();
  const plan = enabled ? selectAutoInvestment(state, catalog) : null;
  const target = plan?.target;
  const missing =
    target && amount.compare(target.cost, state.wallet.coin) > 0
      ? amount.subtract(target.cost, state.wallet.coin)
      : '0';
  const unlockMissing =
    target && amount.compare(target.unlockAt, state.statistics.totalProducedCoin) > 0
      ? amount.subtract(target.unlockAt, state.statistics.totalProducedCoin)
      : '0';
  return (
    <section className="automation-control" aria-label={text('automation.title')}>
      <button
        className="auto-upgrade-toggle"
        aria-pressed={enabled}
        disabled={disabled}
        onClick={() => {
          void onCommand({ type: 'SetAutoUpgrade', enabled: !enabled }).then((result) =>
            setError(result.ok ? '' : text(`action.error.${result.error}`)),
          );
        }}
      >
        <Icon name="zap" size={16} />
        {text('automation.toggle')}: {text(enabled ? 'automation.on' : 'automation.off')}
        <span className="auto-switch" aria-hidden="true" />
      </button>
      {enabled && (
        <div className="auto-plan">
          {target ? (
            <>
              <p>
                <strong>
                  {text(plan.waitMs === '0' ? 'automation.ready' : 'automation.waiting')}:{' '}
                  {text(target.name)}
                </strong>
              </p>
              <p>
                {text('automation.missing')}: {format(missing)} Coin · {text('automation.estimate')}
                : {format(amount.divideCeil(plan.waitMs, '1000'))} {text('common.seconds')}
              </p>
              {unlockMissing !== '0' && (
                <p>
                  {text('automation.unlockMissing')}: {format(unlockMissing)} Coin
                </p>
              )}
            </>
          ) : (
            <p>{text('automation.noTarget')}</p>
          )}
          <p>
            {text('automation.actionsCount')}: {format(state.automation.actions)}
          </p>
        </div>
      )}
      <details>
        <summary>{text('automation.policyTitle')}</summary>
        <p>{text('automation.policy')}</p>
        <p>{text('automation.offlinePolicy')}</p>
      </details>
      {enabled && state.automation.lastAction && (
        <p className="auto-last-action">
          {text('automation.lastAction')}: {text(state.automation.lastAction)}
        </p>
      )}
      {error && (
        <p className="action-message" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
