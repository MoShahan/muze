/**
 * Pure playback helpers extracted for unit tests.
 * PlaybackProvider and WaveformSeekbar own side effects; these stay side-effect free.
 */

export type RepeatMode = 'off' | 'all' | 'one';
export type PlayMode = 'shuffle' | 'all' | 'one';
export type PlaylistLoopMode = 'none' | 'single' | 'all';

export function playModeFromFlags(shuffle: boolean, repeat: RepeatMode): PlayMode {
  if (repeat === 'one') {
    return 'one';
  }
  if (shuffle) {
    return 'shuffle';
  }
  return 'all';
}

/** Map Muze repeat/shuffle into expo-audio playlist loop mode. */
export function toPlaylistLoop(repeat: RepeatMode, shuffle: boolean): PlaylistLoopMode {
  if (repeat === 'one') {
    return 'single';
  }
  if (repeat === 'off' && !shuffle) {
    return 'none';
  }
  return 'all';
}

/** Clamp a 0-1 seek progress value. */
export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Convert a horizontal touch position into clamped seek progress. */
export function progressFromX(x: number, width: number): number {
  if (width <= 0) {
    return 0;
  }
  return clampProgress(x / width);
}

/**
 * Clamp a saved resume position into a safe seek range.
 * Leaves a 250ms cushion before the end so "resume at end" does not auto-advance.
 */
export function clampResumePositionMs(positionMs: number, durationMs: number): number {
  const safePosition = Math.max(0, positionMs);
  if (durationMs <= 0) {
    return safePosition;
  }
  const maxPosition = Math.max(0, durationMs - 250);
  return Math.min(safePosition, maxPosition);
}
