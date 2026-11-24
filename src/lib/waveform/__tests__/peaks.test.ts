import {
  createPlaceholderPeaks,
  downsampleToPeaks,
  normalizePeaks,
  PLACEHOLDER_WAVEFORM_PEAKS,
  sanitizePeaks,
  WAVEFORM_BAR_COUNT,
} from '@/lib/waveform/peaks';

describe('peaks', () => {
  it('creates a placeholder of WAVEFORM_BAR_COUNT bars', () => {
    expect(WAVEFORM_BAR_COUNT).toBe(180);
    expect(PLACEHOLDER_WAVEFORM_PEAKS).toHaveLength(WAVEFORM_BAR_COUNT);
    expect(createPlaceholderPeaks(10)).toHaveLength(10);
  });

  it('normalizes peaks to 0-1 using the loudest bar', () => {
    expect(normalizePeaks([0, 2, 1])).toEqual([0, 1, 0.5]);
    expect(normalizePeaks([])).toEqual([]);
    expect(normalizePeaks([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('downsamples by taking the max absolute sample per bucket', () => {
    expect(downsampleToPeaks([0, 1, -2, 0.5], 2)).toEqual([0.5, 1]);
    expect(downsampleToPeaks([], 3)).toEqual([0, 0, 0]);
  });

  it('sanitizes invalid peak payloads', () => {
    expect(sanitizePeaks(null)).toBeNull();
    expect(sanitizePeaks([])).toBeNull();
    expect(sanitizePeaks([0.1, 2, Number.NaN], 3)).toEqual([0.1, 1, 0]);

    const exact = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => (index === 0 ? 0.5 : 0));
    expect(sanitizePeaks(exact)).toEqual(exact);

    const resized = sanitizePeaks([1, 0.5, 0.25], 6);
    expect(resized).toHaveLength(6);
    expect(Math.max(...(resized ?? []))).toBe(1);
  });
});
