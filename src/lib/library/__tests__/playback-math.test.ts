import {
  clampProgress,
  clampResumePositionMs,
  playModeFromFlags,
  progressFromX,
  toPlaylistLoop,
} from '@/lib/library/playback-math';

describe('playModeFromFlags / toPlaylistLoop', () => {
  it('maps shuffle and repeat into play modes', () => {
    expect(playModeFromFlags(true, 'all')).toBe('shuffle');
    expect(playModeFromFlags(false, 'all')).toBe('all');
    expect(playModeFromFlags(true, 'one')).toBe('one');
    expect(playModeFromFlags(false, 'off')).toBe('all');
  });

  it('maps repeat/shuffle into playlist loop modes', () => {
    expect(toPlaylistLoop('one', false)).toBe('single');
    expect(toPlaylistLoop('one', true)).toBe('single');
    expect(toPlaylistLoop('off', false)).toBe('none');
    expect(toPlaylistLoop('off', true)).toBe('all');
    expect(toPlaylistLoop('all', false)).toBe('all');
  });
});

describe('seek progress', () => {
  it('clamps progress to 0-1', () => {
    expect(clampProgress(-0.5)).toBe(0);
    expect(clampProgress(0.25)).toBe(0.25);
    expect(clampProgress(2)).toBe(1);
  });

  it('converts x / width into clamped progress', () => {
    expect(progressFromX(50, 100)).toBe(0.5);
    expect(progressFromX(-10, 100)).toBe(0);
    expect(progressFromX(150, 100)).toBe(1);
    expect(progressFromX(10, 0)).toBe(0);
  });
});

describe('clampResumePositionMs', () => {
  it('clamps within duration with a 250ms end cushion', () => {
    expect(clampResumePositionMs(1_000, 10_000)).toBe(1_000);
    expect(clampResumePositionMs(9_900, 10_000)).toBe(9_750);
    expect(clampResumePositionMs(-5, 10_000)).toBe(0);
  });

  it('returns the safe position when duration is unknown', () => {
    expect(clampResumePositionMs(1_234, 0)).toBe(1_234);
    expect(clampResumePositionMs(-10, 0)).toBe(0);
  });
});
