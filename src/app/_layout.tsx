import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DatabaseProvider>
          <PlaybackProvider>
            <RootNavigator />
          </PlaybackProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
