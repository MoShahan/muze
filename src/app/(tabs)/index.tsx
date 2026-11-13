import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AudioPermissionPanel } from '@/components/library/audio-permission-panel';
import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';

/** Default tab (Expo `index` route). Product name: Songs. */
export default function SongsScreen() {
  const { isLoading, isGranted, isUndetermined, canAskAgain, request, openSettings } =
    useAudioLibraryPermission();
  const [busy, setBusy] = useState(false);
  const didAutoRequest = useRef(false);

  useEffect(() => {
    if (didAutoRequest.current || isLoading || !isUndetermined) {
      return;
    }
    didAutoRequest.current = true;
    void request();
  }, [isLoading, isUndetermined, request]);

  const onAllowAccess = async () => {
    setBusy(true);
    try {
      await request();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">Songs</AppText>

      {isLoading ? (
        <NeoCard>
          <AppText variant="subtitle" tone="secondary">
            Checking audio permission…
          </AppText>
        </NeoCard>
      ) : null}

      {!isLoading && !isGranted ? (
        <AudioPermissionPanel
          canAskAgain={canAskAgain}
          busy={busy}
          onAllowAccess={() => {
            void onAllowAccess();
          }}
          onOpenSettings={() => {
            void openSettings();
          }}
        />
      ) : null}

      {!isLoading && isGranted ? (
        <>
          <NeoCard>
            <AppText variant="subtitle" tone="secondary">
              Your tracks will list here after the library scan.
            </AppText>
          </NeoCard>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open player"
            onPress={() => router.push('/player')}
          >
            <NeoSurface variant="raised" radius={Radius.lg} style={styles.action}>
              <AppText variant="bodyStrong">Open player</AppText>
            </NeoSurface>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  action: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
