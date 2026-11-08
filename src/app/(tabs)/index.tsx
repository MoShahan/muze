import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing, neoRaisedShadow } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + Spacing.three,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Muze</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Recently played, favorites, and jump-back-in will live here.
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open now playing"
          onPress={() => router.push('/player')}
          style={[
            styles.button,
            { backgroundColor: colors.surfaceRaised },
            neoRaisedShadow(colors),
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Open player</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open search"
          onPress={() => router.push('/search')}
          style={[
            styles.button,
            { backgroundColor: colors.surfaceRaised },
            neoRaisedShadow(colors),
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Search</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
