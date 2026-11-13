import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Spacing } from '@/constants/theme';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';

function statusLabel(isLoading: boolean, isGranted: boolean, canAskAgain: boolean): string {
  if (isLoading) {
    return 'Checking…';
  }
  if (isGranted) {
    return 'Allowed';
  }
  if (!canAskAgain) {
    return 'Blocked';
  }
  return 'Not allowed';
}

export function AudioPermissionControl() {
  const { isLoading, isGranted, canAskAgain, request, openSettings } = useAudioLibraryPermission();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy || isLoading) {
      return;
    }
    setBusy(true);
    try {
      if (isGranted) {
        await openSettings();
        return;
      }
      if (canAskAgain) {
        await request();
        return;
      }
      await openSettings();
    } finally {
      setBusy(false);
    }
  };

  const detail = statusLabel(isLoading, isGranted, canAskAgain);
  const hint = isGranted
    ? 'Tap to manage in system Settings'
    : canAskAgain
      ? 'Tap to allow audio-only access'
      : 'Tap to open system Settings';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Audio permission: ${detail}. ${hint}`}
      onPress={() => {
        void onPress();
      }}
    >
      <NeoCard style={styles.row}>
        <View style={styles.copy}>
          <NeoCard.Title>Audio permission</NeoCard.Title>
          <NeoCard.Subtitle>{hint}</NeoCard.Subtitle>
        </View>
        <AppText variant="label" tone="secondary">
          {busy ? '…' : detail}
        </AppText>
      </NeoCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
});
