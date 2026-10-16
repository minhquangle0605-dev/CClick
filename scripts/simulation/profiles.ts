export interface PlayProfile {
  id: 'active' | 'passive' | 'mixed';
  sessionsPerDay: number;
  sessionSeconds: number;
  clicksPerSecond: number;
  collectPercent: number;
}

export const profiles: PlayProfile[] = [
  { id: 'active', sessionsPerDay: 6, sessionSeconds: 600, clicksPerSecond: 2, collectPercent: 70 },
  { id: 'passive', sessionsPerDay: 2, sessionSeconds: 180, clicksPerSecond: 0, collectPercent: 30 },
  { id: 'mixed', sessionsPerDay: 4, sessionSeconds: 300, clicksPerSecond: 1, collectPercent: 70 },
];

export const checkpoints = [3600, 86400, 7 * 86400, 30 * 86400];
export const simulationStart = Date.parse('2026-10-14T17:00:00.000Z');
