import { NavigationBar } from 'expo-navigation-bar';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, type ThemeColors, type ThemeName, type ThemePreference } from '@/constants/theme';
import { getThemePreference, setThemePreference } from '@/lib/db/settings';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  /** True once stored preference has been read (splash can hide). */
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await getThemePreference(db);
        if (!cancelled) {
          setPreferenceState(stored);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void setThemePreference(db, next);
  };

  const theme: ThemeName =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  // Status / nav button chrome: light icons on dark canvas, dark icons on light.
  const chromeStyle = isDark ? 'light' : 'dark';

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.canvas);
  }, [colors.canvas]);

  const value: ThemeContextValue = {
    preference,
    setPreference,
    theme,
    colors,
    isDark,
    isReady,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={chromeStyle} />
      {Platform.OS === 'android' ? <NavigationBar style={chromeStyle} /> : null}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
