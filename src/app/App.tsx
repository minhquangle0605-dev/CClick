import { NumberFormatContext } from '@ui/components/number-format';
import { useState } from 'react';
import type { GameSession } from './game-session';
import { useGameState, useSaveStatus, useSessionNotice } from './game-store';
import { useGameLifecycle } from './use-game-lifecycle';
import { activeClickPower, activeProductionPerSecond } from '@core/economy/selectors';
import { BoostersPanel, EffectsBar } from '@features/boosters/BoostersPanel';
import { ItemShop } from '@features/shop/ItemShop';
import { EventField } from '@features/events/EventField';
import { CardsPanel } from '@features/cards/CardsPanel';
import { ChestsPanel } from '@features/chests/ChestsPanel';
import { DailyPanel } from '@features/daily-rewards/DailyPanel';
import { AchievementsPanel } from '@features/achievements/AchievementsPanel';
import { StatisticsPanel } from '@features/statistics/StatisticsPanel';
import { ResetPanel } from '@features/settings/ResetPanel';
import { HelpPanel } from '@features/help/HelpPanel';
import { achievementStatus } from '@core/achievements/selectors';
import type { DurableAction } from '@core/engine/contracts';
import { amount } from '@shared/amount';
import { APP_VERSION } from '@shared/version';
import { nextMilestone } from '@core/progression/milestone';
import { loadSettings, saveSettings } from '@platform/storage/settings-repository';
import { clickFeedback, rewardFeedback } from '@platform/feedback/click-feedback';
import { downloadJson, readSaveFile } from '@platform/storage/save-file';
import { SaveToolsPanel } from '@features/settings/SaveToolsPanel';
import { OfflineNotice } from '@features/offline/OfflineNotice';
import { SaveIndicator } from '@ui/components/SaveIndicator';
import { CoinStage } from '@features/clicker/CoinStage';
import { ShopPanel } from '@features/shop/ShopPanel';
import { AutoUpgradeControl } from '@features/automation/AutoUpgradeControl';
import { addIncome } from '@core/automation/loadout';
import { SettingsPanel } from '@features/settings/SettingsPanel';
import type { DisplaySettings } from '@features/settings/SettingsPanel';
import { JourneyPanel } from '@ui/layout/JourneyPanel';
import { Icon } from '@ui/components/Icon';
import { GoldArtwork } from '@ui/components/GoldArtwork';
import { AnimatedBackground } from '@ui/background/AnimatedBackground';
import { Modal } from '@ui/components/Modal';
import { text } from '@ui/components/text';
import './app.css';

type Panel =
  | 'settings'
  | 'save'
  | 'help'
  | 'progress'
  | 'boosters'
  | 'cards'
  | 'rain'
  | 'chests'
  | 'daily'
  | 'achievements'
  | 'statistics'
  | 'more'
  | 'reset'
  | null;

export function App({ session }: { session: GameSession }) {
  const state = useGameState(session);
  const save = useSaveStatus(session);
  const notice = useSessionNotice(session);
  const blocked = notice.busy || notice.error !== null;
  const { clickCoin, command, numericLimit } = useGameLifecycle(session);
  const { catalog } = session;
  const [panel, setPanel] = useState<Panel>(
    state.chests.lastResult && !state.chests.acknowledged ? 'chests' : null,
  );
  const [loadedSettings] = useState(loadSettings);
  const [settings, setSettings] = useState<DisplaySettings>(loadedSettings.settings);
  const format = (value: string | number) => amount.format(String(value), settings.numberFormat);
  const [settingsError, setSettingsError] = useState(loadedSettings.failed);
  const [workspace, setWorkspace] = useState<'play' | 'shop'>('play');
  const goal = nextMilestone(state.statistics.totalProducedCoin, catalog.balance.milestoneCoin);
  function changeSettings(next: DisplaySettings) {
    setSettings(next);
    setSettingsError(!saveSettings(next));
  }
  function earn() {
    const accepted = clickCoin();
    if (accepted) clickFeedback(settings);
    return accepted;
  }
  const close = () => setPanel(null);
  const claimable = catalog.achievements.filter(
    (item) => achievementStatus(state, item).ready,
  ).length;
  const commitWithFeedback: DurableAction = async (command) => {
    const result = await session.commitCommand(command);
    if (result.ok && ['ClaimDaily', 'ClaimAchievement', 'OpenChest'].includes(command.type))
      rewardFeedback(settings);
    return result;
  };
  const frenzy = state.effects.some(
    (effect) => effect.sourceId === 'event.frenzy' && effect.expiresAt > state.effectsAtMs,
  );
  return (
    <NumberFormatContext value={settings.numberFormat}>
      <div
        data-number-format={settings.numberFormat}
        className={`app-shell ${settings.reducedMotion ? 'motion-off' : ''} ${frenzy ? 'has-frenzy' : ''}`}
      >
        <AnimatedBackground reducedMotion={settings.reducedMotion} paused={panel !== null} />
        <a className="skip-link" href="#main">
          {text('nav.skip')}
        </a>
        <header className="site-header">
          <a className="brand" href="#main" aria-label="Coin Clicker">
            <span className="brand-symbol">✦</span>
            <span>
              {text('app.name')}
              <small>{text('app.tagline')}</small>
            </span>
          </a>
          <div className="header-tools">
            <SaveIndicator
              phase={save.phase}
              savedAt={save.savedAt}
              onSave={() => {
                void session.requestSave();
              }}
            />
            <button className="more-button" onClick={() => setPanel('more')}>
              {text('more.title')}
            </button>
            <button
              className="icon-button"
              onClick={() => setPanel('settings')}
              aria-label={text('nav.settings')}
            >
              <Icon name="settings" size={19} />
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          <h1 className="sr-only">{text('app.name')}</h1>
          <div className="session-alerts">
            {notice.busy && (
              <p className="game-alert" role="status">
                {text('action.saving')}
              </p>
            )}
            {notice.error && (
              <div className="game-alert" role="alert">
                {text(notice.error)}{' '}
                <button
                  onClick={() => {
                    void session.resume();
                  }}
                >
                  {text('save.retry')}
                </button>
                <button onClick={() => setPanel('save')}>{text('saveTools.export')}</button>
              </div>
            )}
            {numericLimit && (
              <p className="game-alert" role="alert">
                {text('home.numericLimit')}
              </p>
            )}
          </div>
          <div className="game-actions">
            <div className="wallet-summary">
              <span className="gold-balance" title={state.wallet.goldCoin}>
                <GoldArtwork /> {format(state.wallet.goldCoin)} Gold
              </span>
              {(notice.offline || notice.recovered) && (
                <details className="session-notice">
                  <summary aria-label={text('offline.title')} title={text('offline.title')}>
                    <Icon name="clock" size={16} />
                    <span>
                      {notice.offline && !notice.offline.clockRollback
                        ? `+${format(notice.offline.coin)} Coin`
                        : text('offline.title')}
                    </span>
                  </summary>
                  <OfflineNotice
                    summary={notice.offline}
                    recovered={notice.recovered}
                    onClose={session.dismissNotice}
                  />
                </details>
              )}
            </div>
            <button className="primary-button" onClick={() => setPanel('daily')}>
              {text('daily.title')}
            </button>
            <button className="primary-button" onClick={() => setPanel('achievements')}>
              {text('achievements.title')}
              {claimable > 0 ? ` (${claimable})` : ''}
            </button>
            <button className="primary-button" onClick={() => setPanel('boosters')}>
              {text('boosters.open')}
            </button>
            <button className="primary-button" onClick={() => setPanel('cards')}>
              {text('cards.title')}
            </button>
            <button
              className="primary-button"
              onClick={() => setPanel('chests')}
              title={!state.chests.acknowledged ? text('chests.pending') : undefined}
            >
              {text('chests.title')}
              {!state.chests.acknowledged && <span aria-hidden="true"> ●</span>}
            </button>
          </div>
          <div className="workspace-switch" role="group" aria-label={text('layout.switch')}>
            <button aria-pressed={workspace === 'play'} onClick={() => setWorkspace('play')}>
              <Icon name="coins" size={16} /> {text('layout.play')}
            </button>
            <button aria-pressed={workspace === 'shop'} onClick={() => setWorkspace('shop')}>
              <Icon name="factory" size={16} /> {text('shop.title')}
              <span>{format(state.wallet.coin)} Coin</span>
            </button>
          </div>
          <div className={`game-board workspace-${workspace}`}>
            <div className="play-panel">
              <div className="always-auto-status">{text('automation.alwaysOn')}</div>
              <details className="effects-summary">
                <summary>
                  {text('boosters.active')}
                  {state.effects.some((effect) => effect.expiresAt > state.effectsAtMs) && (
                    <span className="active-effect-dot" aria-label={text('layout.effectActive')}>
                      {' '}
                      ●
                    </span>
                  )}
                </summary>
                <EffectsBar state={state} catalog={catalog} />
              </details>
              <EventField
                state={state}
                catalog={catalog}
                disabled={blocked || panel !== null}
                reducedMotion={settings.reducedMotion}
                onCommand={session.commitCommand}
              />
              <CoinStage
                coin={state.wallet.coin}
                clickPower={activeClickPower(state, catalog)}
                cps={addIncome(
                  activeProductionPerSecond(state, catalog),
                  amount.productCapped([activeClickPower(state, catalog), '10'], '1e100'),
                )}
                onEarn={earn}
                disabled={blocked || panel !== null}
                reducedMotion={settings.reducedMotion}
                glow={settings.glow}
              />
            </div>
            <ShopPanel
              catalog={catalog}
              state={state}
              disabled={blocked}
              onCommand={command}
              automationControl={
                <AutoUpgradeControl
                  state={state}
                  catalog={catalog}
                  disabled={blocked}
                  onCommand={session.commitCommand}
                />
              }
              itemShop={
                <ItemShop
                  state={state}
                  catalog={catalog}
                  disabled={blocked}
                  onCommand={session.commitCommand}
                  onOpenInventory={() => setPanel('boosters')}
                  onOpenChests={() => setPanel('chests')}
                />
              }
            />
          </div>
          <JourneyPanel
            total={format(state.statistics.totalProducedCoin)}
            machines={format(
              Object.values(state.generators).reduce((sum, count) => sum + count, 0),
            )}
            clicks={format(state.statistics.clicks)}
            goal={format(goal)}
            progress={amount.progress(state.statistics.totalProducedCoin, goal)}
            onOpenStatistics={() => setPanel('statistics')}
          />
        </main>
        {panel === 'settings' && (
          <Modal
            title={text('settings.title')}
            subtitle={text('settings.description')}
            onClose={close}
          >
            <SettingsPanel settings={settings} onChange={changeSettings} />
            <button className="danger-button reset-entry" onClick={() => setPanel('reset')}>
              {text('reset.title')}
            </button>
            {settingsError && (
              <p className="game-alert" role="alert">
                {text('settings.saveError')}
              </p>
            )}
            <div className="more-links">
              <button onClick={() => setPanel('save')}>{text('saveTools.title')}</button>
              <button onClick={() => setPanel('help')}>{text('nav.help')}</button>
              <button onClick={() => setPanel('progress')}>{text('nav.progress')}</button>
            </div>
          </Modal>
        )}
        {panel === 'save' && (
          <Modal title={text('saveTools.title')} onClose={close}>
            <SaveToolsPanel
              busy={notice.busy}
              onExport={async () => {
                downloadJson(await session.exportSave());
              }}
              onReadFile={(file) => readSaveFile(file, catalog)}
              onRestore={async (candidate) => {
                await session.restore(candidate);
                if (!session.engine.getSnapshot().chests.acknowledged) setPanel('chests');
              }}
              onListBackups={session.listBackups}
              onDiagnostic={async () => {
                const raw = await session.readDamaged();
                if (!raw) return false;
                downloadJson(raw, 'coin-clicker-diagnostic');
                return true;
              }}
            />
          </Modal>
        )}
        {panel === 'help' && (
          <Modal title={text('help.title')} subtitle={text('help.description')} onClose={close}>
            <HelpPanel />
          </Modal>
        )}
        {panel === 'progress' && (
          <Modal
            title={text('progress.title')}
            subtitle={text('progress.description')}
            onClose={close}
          >
            <ol className="phase-list">
              {Array.from({ length: 7 }, (_, index) => (
                <li key={index} className={index === 6 ? 'current' : ''}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {text(`progress.${index + 1}`)}
                  {index === 6 && <small>{text('progress.current')}</small>}
                </li>
              ))}
            </ol>
          </Modal>
        )}
        {panel === 'boosters' && (
          <Modal title={text('boosters.open')} subtitle={text('boosters.subtitle')} onClose={close}>
            <BoostersPanel
              state={state}
              catalog={catalog}
              disabled={blocked}
              onCommand={session.commitCommand}
            />
          </Modal>
        )}
        {panel === 'rain' && (
          <Modal title={text('events.title')} onClose={close}>
            <p className="info-note">{text('help.events')}</p>
            <p className="info-note">{text('events.rules')}</p>
            <p className="info-note">{text('boosters.offlineRule')}</p>
          </Modal>
        )}
        {panel === 'cards' && (
          <Modal title={text('cards.title')} onClose={close} wide>
            <CardsPanel
              state={state}
              catalog={catalog}
              disabled={blocked}
              onCommand={session.commitCommand}
            />
          </Modal>
        )}
        {panel === 'chests' && (
          <Modal title={text('chests.title')} onClose={close} wide>
            <ChestsPanel
              state={state}
              catalog={catalog}
              disabled={blocked}
              onCommand={commitWithFeedback}
            />
          </Modal>
        )}
        {panel === 'daily' && (
          <Modal title={text('daily.title')} onClose={close} wide>
            <DailyPanel
              state={state}
              catalog={catalog}
              disabled={blocked}
              onCommand={commitWithFeedback}
              nowUtc={session.nowUtc}
            />
          </Modal>
        )}
        {panel === 'achievements' && (
          <Modal title={text('achievements.title')} onClose={close} wide>
            <AchievementsPanel
              state={state}
              catalog={catalog}
              disabled={blocked}
              onCommand={commitWithFeedback}
            />
          </Modal>
        )}
        {panel === 'statistics' && (
          <Modal title={text('stats.title')} onClose={close} wide>
            <StatisticsPanel state={state} catalog={catalog} />
          </Modal>
        )}
        {panel === 'more' && (
          <Modal title={text('more.title')} onClose={close}>
            <p className="info-note">
              {text('app.version')} {APP_VERSION} · {text('app.personal')}
            </p>
            <div className="more-grid">
              {(
                [
                  ['daily', 'daily.title'],
                  ['achievements', 'achievements.title'],
                  ['statistics', 'stats.title'],
                  ['rain', 'events.title'],
                  ['save', 'saveTools.title'],
                  ['help', 'nav.help'],
                  ['settings', 'nav.settings'],
                  ['progress', 'nav.progress'],
                ] as const
              ).map(([panel, key]) => (
                <button key={panel} onClick={() => setPanel(panel)}>
                  {text(key)}
                </button>
              ))}
            </div>
          </Modal>
        )}
        {panel === 'reset' && (
          <Modal title={text('reset.title')} onClose={close}>
            <ResetPanel
              state={state}
              disabled={blocked}
              onReset={session.reset}
              onDone={close}
              onExport={async () => downloadJson(await session.exportSave())}
            />
          </Modal>
        )}
      </div>
    </NumberFormatContext>
  );
}
