import {
  Colors,
  Radius,
  Spacing,
  Typography,
  neoPressedShadow,
  neoRaisedShadow,
  type ThemeColor,
  type ThemeColors,
} from '@/constants/theme';

const REQUIRED_COLOR_KEYS: ThemeColor[] = [
  'canvas',
  'surface',
  'surfaceRaised',
  'surfacePressed',
  'text',
  'textSecondary',
  'textMuted',
  'accent',
  'accentMuted',
  'border',
  'shadowLight',
  'shadowDark',
  'waveformPlayed',
  'waveformRemaining',
  'overlay',
  'background',
  'backgroundElement',
  'backgroundSelected',
];

function assertPalette(palette: ThemeColors) {
  for (const key of REQUIRED_COLOR_KEYS) {
    expect(typeof palette[key]).toBe('string');
    expect(palette[key].length).toBeGreaterThan(0);
  }
}

describe('theme tokens', () => {
  it('exposes matching light and dark color keys', () => {
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
    assertPalette(Colors.light);
    assertPalette(Colors.dark);
  });

  it('keeps the monochrome canvas values from the design system', () => {
    expect(Colors.light.canvas).toBe('#E6E9EF');
    expect(Colors.dark.canvas).toBe('#1C1E22');
    expect(Colors.light.background).toBe(Colors.light.canvas);
    expect(Colors.dark.background).toBe(Colors.dark.canvas);
  });

  it('avoids pure black on the dark canvas for AMOLED comfort', () => {
    expect(Colors.dark.canvas.toLowerCase()).not.toBe('#000');
    expect(Colors.dark.canvas.toLowerCase()).not.toBe('#000000');
  });

  it('defines spacing and radius scales', () => {
    expect(Spacing).toEqual({
      half: 2,
      one: 4,
      two: 8,
      three: 16,
      four: 24,
      five: 32,
      six: 64,
    });
    expect(Radius.sm).toBeLessThan(Radius.md);
    expect(Radius.md).toBeLessThan(Radius.lg);
    expect(Radius.lg).toBeLessThan(Radius.xl);
    expect(Radius.full).toBeGreaterThan(Radius.xl);
  });

  it('defines typography variants with size and weight', () => {
    const variants = Object.keys(Typography);
    expect(variants).toEqual(
      expect.arrayContaining([
        'display',
        'title',
        'subtitle',
        'body',
        'bodyStrong',
        'caption',
        'label',
        'section',
      ]),
    );

    for (const variant of variants as (keyof typeof Typography)[]) {
      expect(Typography[variant].fontSize).toBeGreaterThan(0);
      expect(Typography[variant].fontWeight).toBeDefined();
      expect(Typography[variant].lineHeight).toBeGreaterThan(0);
    }

    expect(Typography.display.fontSize).toBeGreaterThan(Typography.body.fontSize);
    expect(Typography.section.textTransform).toBe('uppercase');
  });

  it('builds raised and pressed neo shadows from palette tokens', () => {
    const raised = neoRaisedShadow(Colors.light);
    const pressed = neoPressedShadow(Colors.dark);

    expect(raised.boxShadow).toContain(Colors.light.shadowDark);
    expect(raised.boxShadow).toContain(Colors.light.shadowLight);
    expect(raised.boxShadow).not.toContain('inset');

    expect(pressed.boxShadow).toContain('inset');
    expect(pressed.boxShadow).toContain(Colors.dark.shadowDark);
    expect(pressed.boxShadow).toContain(Colors.dark.shadowLight);
  });
});
