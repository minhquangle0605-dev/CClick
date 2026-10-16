/** Persisted xorshift32; independent of rendering and Math.random(). */
export function seedFromRun(runId: string): number {
  let seed = 2166136261;
  for (const char of runId) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0 || 1;
}
export function draw(seed: number, min: number, max: number) {
  let next = seed;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  next >>>= 0;
  return { seed: next, value: min + Math.floor((next / 4294967296) * (max - min + 1)) };
}
