import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RecentPlayRecorder } from '@/components/collections/recent-play-recorder';
import { MuzeNowPlayingWidgetSync } from '@/components/player/muze-now-playing-widget-sync';
import { DatabaseProvider } from '@/store/database-provider';
import { LibraryScanProvider } from '@/store/library-scan-provider';
import { LibraryVisibilityProvider } from '@/store/library-visibility-provider';
import { PlaybackProvider } from '@/store/playback-provider';
import { ThemeProvider, useTheme } from '@/store/theme-provider';

// Registers the Android home-screen widget layout for the next native build.
import '@/widgets/muze-now-playing';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 320,
  fade: true,
});

function ThemedShell({ children }: PropsWithChildren) {
  const { colors, isReady } = useTheme();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    void SplashScreen.hideAsync();
  }, [isReady]);

  return <View style={[styles.flex, { backgroundColor: colors.canvas }]}>{children}</View>;
}

function RootNavigator() {
  const { colors } = useTheme();

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
      <Stack.Screen
        name="queue"
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
    <GestureHandlerRootView style={styles.flex}>
      <DatabaseProvider>
        <ThemeProvider>
          <ThemedShell>
            <LibraryVisibilityProvider>
              <LibraryScanProvider>
                <PlaybackProvider>
                  <RecentPlayRecorder />
                  <MuzeNowPlayingWidgetSync />
                  <RootNavigator />
                </PlaybackProvider>
              </LibraryScanProvider>
            </LibraryVisibilityProvider>
          </ThemedShell>
        </ThemeProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
