import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RecentPlayRecorder } from '@/components/collections/recent-play-recorder';
import { DatabaseProvider } from '@/store/database-provider';
import { LibraryVisibilityProvider } from '@/store/library-visibility-provider';
import { PlaybackProvider } from '@/store/playback-provider';
import { ThemeProvider, useTheme } from '@/store/theme-provider';

// Registers the Android home-screen widget stub for the next native build.
import '@/widgets/muze-now-playing';

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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="player"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen name="folders" />
      <Stack.Screen name="library-folders" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="recent" />
      <Stack.Screen name="album/[id]" />
      <Stack.Screen name="artist/[id]" />
      <Stack.Screen name="folder/[id]" />
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="playlist/[id]/add" />
      <Stack.Screen name="track/[id]/edit" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <ThemeProvider>
          <LibraryVisibilityProvider>
            <PlaybackProvider>
              <RecentPlayRecorder />
              <RootNavigator />
            </PlaybackProvider>
          </LibraryVisibilityProvider>
        </ThemeProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
