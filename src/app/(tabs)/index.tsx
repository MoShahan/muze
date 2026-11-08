import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="display">Muze</AppText>
        <AppText variant="subtitle" tone="secondary">
          Recently played, favorites, and jump-back-in will live here.
        </AppText>
      </View>

      <NeoCard>
        <NeoCard.Title>Jump back in</NeoCard.Title>
        <NeoCard.Subtitle>
          Open the player preview while the library is still empty.
        </NeoCard.Subtitle>
      </NeoCard>

      <View style={styles.actions}>
        <HomeAction label="Open player" onPress={() => router.push('/player')} />
        <HomeAction label="Search" onPress={() => router.push('/search')} />
      </View>
    </Screen>
  );
}

type HomeActionProps = {
  label: string;
  onPress: () => void;
};

function HomeAction({ label, onPress }: HomeActionProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <NeoSurface variant="raised" radius={Radius.lg} style={styles.action}>
        <AppText variant="bodyStrong">{label}</AppText>
      </NeoSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.three,
  },
  action: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
