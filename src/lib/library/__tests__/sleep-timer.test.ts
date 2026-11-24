import { formatSleepRemaining, SLEEP_TIMER_PRESETS_MS } from '@/lib/library/sleep-timer';

describe('sleep timer helpers', () => {
  it('exposes the four preset durations', () => {
    expect(SLEEP_TIMER_PRESETS_MS.map((preset) => preset.durationMs)).toEqual([
      15 * 60 * 1000,
      30 * 60 * 1000,
      45 * 60 * 1000,
      60 * 60 * 1000,
    ]);
  });

  it('formats remaining time as m:ss with ceil seconds', () => {
    const now = 1_000_000;
    expect(formatSleepRemaining(now + 65_000, now)).toBe('1:05');
    expect(formatSleepRemaining(now + 1_001, now)).toBe('0:02');
    expect(formatSleepRemaining(now, now)).toBe('0:00');
    expect(formatSleepRemaining(now - 5_000, now)).toBe('0:00');
  });
});
