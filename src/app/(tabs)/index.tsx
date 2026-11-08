import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';

/** Default tab (Expo `index` route). Product name: Songs. */
export default function SongsScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">Songs</AppText>
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
