import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing, type ThemePreference } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemePreferenceControl() {
  const { preference, setPreference } = useTheme();

  return (
    <NeoSurface variant="flat" radius={Radius.lg} style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} theme`}
            onPress={() => setPreference(option.value)}
            style={styles.optionHit}
          >
            <NeoSurface
              variant={selected ? 'pressed' : 'flat'}
              radius={Radius.md}
              style={styles.option}
            >
              <AppText variant="label" tone={selected ? 'default' : 'muted'}>
                {option.label}
              </AppText>
            </NeoSurface>
          </Pressable>
        );
      })}
    </NeoSurface>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: Spacing.one,
    gap: Spacing.one,
  },
  optionHit: {
    flex: 1,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
});
