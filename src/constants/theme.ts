/**
 * Neomorphic monochrome tokens.
 * Light canvas ~#E6E9EF, dark canvas ~#1C1E22 (not pure black for AMOLED).
 * Accent stays restrained gray / muted white - no bright colors.
 */

export const Colors = {
  light: {
    canvas: '#E6E9EF',
    surface: '#EEF1F6',
    surfaceRaised: '#F5F7FA',
    surfacePressed: '#DDE1E8',
    text: '#2A2D33',
    textSecondary: '#6B7078',
    textMuted: '#8B9098',
    accent: '#3A3D44',
    accentMuted: '#5C6068',
    border: '#D5DAE2',
    shadowLight: 'rgba(255, 255, 255, 0.9)',
    shadowDark: 'rgba(163, 177, 198, 0.55)',
    waveformPlayed: '#3A3D44',
    waveformRemaining: '#B8BEC8',
    overlay: 'rgba(42, 45, 51, 0.4)',
    // Aliases used by navigation / shared chrome
    background: '#E6E9EF',
    backgroundElement: '#EEF1F6',
    backgroundSelected: '#DDE1E8',
  },
  dark: {
    canvas: '#1C1E22',
    surface: '#25282D',
    surfaceRaised: '#2C3036',
    surfacePressed: '#16181C',
    text: '#E8E8EA',
    textSecondary: '#9A9DA3',
    textMuted: '#6F737A',
    accent: '#D4D4D6',
    accentMuted: '#A8ABB2',
    border: '#32363C',
    shadowLight: 'rgba(255, 255, 255, 0.04)',
    shadowDark: 'rgba(0, 0, 0, 0.55)',
    waveformPlayed: '#D4D4D6',
    waveformRemaining: '#3A3E45',
    overlay: 'rgba(0, 0, 0, 0.5)',
    background: '#1C1E22',
    backgroundElement: '#25282D',
    backgroundSelected: '#2C3036',
  },
} as const;

export type ThemeName = keyof typeof Colors;
export type ThemeColors = (typeof Colors)[ThemeName];
export type ThemeColor = keyof ThemeColors;

export type ThemePreference = 'system' | 'light' | 'dark';

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Soft raised neo shadow: light top-left, dark bottom-right. */
export const neoRaisedShadow = (colors: ThemeColors) =>
  ({
    boxShadow: `4px 4px 10px ${colors.shadowDark}, -4px -4px 10px ${colors.shadowLight}`,
  }) as const;

/** Inset / pressed neo look for active controls. */
export const neoPressedShadow = (colors: ThemeColors) =>
  ({
    boxShadow: `inset 3px 3px 8px ${colors.shadowDark}, inset -3px -3px 8px ${colors.shadowLight}`,
  }) as const;
