import type { DisplaySettings } from '@shared/display-settings';
let context: AudioContext | undefined;
let lastSound = -Infinity;
export function rewardFeedback(settings: DisplaySettings) {
  try {
    if (settings.haptics) navigator.vibrate?.([12, 35, 12]);
  } catch {
    /* Optional hardware. */
  }
  if (!settings.sound || !window.AudioContext) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    for (const [offset, frequency] of [
      [0, 660],
      [0.1, 990],
    ] as const) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + offset;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.035, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.16);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  } catch {
    /* Optional sound never changes a committed reward. */
  }
}
export function clickFeedback(settings: DisplaySettings) {
  try {
    if (settings.haptics) navigator.vibrate?.(8);
  } catch {
    /* Optional hardware. */
  }
  if (!settings.sound || !window.AudioContext || performance.now() - lastSound < 40) return;
  lastSound = performance.now();
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(900, now);
    oscillator.frequency.exponentialRampToValueAtTime(480, now + 0.045);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.06);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  } catch {
    /* Audio is optional; it never changes the accepted game action. */
  }
}
