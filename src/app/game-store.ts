import { useSyncExternalStore } from 'react';
import type { GameSession } from './game-session';

export const useGameState = (session: GameSession) =>
  useSyncExternalStore(session.engine.subscribe, session.engine.getSnapshot);
export const useSaveStatus = (session: GameSession) =>
  useSyncExternalStore(session.subscribeSave, session.getSaveStatus);
export const useSessionNotice = (session: GameSession) =>
  useSyncExternalStore(session.subscribeNotice, session.getNotice);
