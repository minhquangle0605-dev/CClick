import { useEffect, useState } from 'react';
import type { GameSession } from './game-session';
import type { CommandResult, GameCommand } from '@core/engine/contracts';

export function useGameLifecycle(session: GameSession) {
  const [limitedRun, setLimitedRun] = useState<string | null>(null);
  useEffect(() => {
    function check(result: CommandResult | null) {
      if (!result) return;
      if (!result.ok && result.error === 'numeric-limit')
        setLimitedRun(session.engine.getSnapshot().runId);
    }
    function pause() {
      session.pause();
    }
    function resume() {
      if (!document.hidden) void session.resume();
    }
    function visibility() {
      if (document.hidden) pause();
      else resume();
    }
    visibility();
    const tick = window.setInterval(() => check(session.tick()), 100);
    const autosave = window.setInterval(() => {
      void session.requestSave();
    }, session.catalog.balance.autosaveSeconds * 1000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', resume);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(autosave);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('pageshow', resume);
    };
  }, [session]);
  function command(command: GameCommand) {
    const result = session.dispatch(command);
    if (!result.ok && result.error === 'numeric-limit')
      setLimitedRun(session.engine.getSnapshot().runId);
    if (result.ok) void session.requestSave();
    return result;
  }
  return {
    clickCoin: () => command({ type: 'ClickCoin' }).ok,
    command,
    numericLimit: limitedRun === session.engine.getSnapshot().runId,
  };
}
