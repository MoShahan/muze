import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { DatabaseProvider } from '@/store/database-provider';
import { PlaybackProvider } from '@/store/playback-provider';
import { ThemeProvider, useTheme } from '@/store/theme-provider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Muze' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <PlaybackProvider>
          <RootNavigator />
        </PlaybackProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
