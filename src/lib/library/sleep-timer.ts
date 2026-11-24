/**
 * Sleep-timer UI helpers.
 *
 * The timer itself lives in `PlaybackProvider`: it stores an absolute `endsAt`
 * epoch and pauses playback when that time is reached (with AppState catch-up
 * because JS `setTimeout` is unreliable while the app is backgrounded).
 */

/** Preset durations offered in the now-playing sleep timer picker. */
export const SLEEP_TIMER_PRESETS_MS = [
  { label: '15 minutes', durationMs: 15 * 60 * 1000 },
  { label: '30 minutes', durationMs: 30 * 60 * 1000 },
  { label: '45 minutes', durationMs: 45 * 60 * 1000 },
  { label: '1 hour', durationMs: 60 * 60 * 1000 },
] as const;

/** Format remaining sleep time as m:ss (ceil to whole seconds). */
export function formatSleepRemaining(endsAt: number, now = Date.now()): string {
  const totalSec = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
