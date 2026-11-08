import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Radius,
  Spacing,
  neoPressedShadow,
  neoRaisedShadow,
  type ThemePreference,
} from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemePreferenceControl() {
  const { colors, preference, setPreference } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.surface }, neoRaisedShadow(colors)]}>
      {OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} theme`}
            onPress={() => setPreference(option.value)}
            style={[
              styles.option,
              selected
                ? [{ backgroundColor: colors.surfaceRaised }, neoPressedShadow(colors)]
                : null,
            ]}
          >
            <Text style={[styles.label, { color: selected ? colors.text : colors.textMuted }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.one,
    gap: Spacing.one,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
