import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AudioPermissionPanel } from '@/components/library/audio-permission-panel';
import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';

type LibraryPermissionScreenProps = {
  title: string;
};

/** Shared permission-denied / checking shell for Albums, Artists, Playlists, etc. */
export function LibraryPermissionScreen({ title }: LibraryPermissionScreenProps) {
  const { isLoading, canAskAgain, request, openSettings } = useAudioLibraryPermission();
  const [busy, setBusy] = useState(false);

  const onAllowAccess = async () => {
    setBusy(true);
    try {
      await request();
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <Screen contentStyle={styles.content}>
        <AppText variant="display">{title}</AppText>
        <NeoCard>
          <AppText variant="subtitle" tone="secondary">
            Checking audio permission…
          </AppText>
        </NeoCard>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">{title}</AppText>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
