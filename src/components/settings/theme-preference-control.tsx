import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing, type ThemePreference } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconSelected: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'system',
    label: 'System',
    icon: 'phone-portrait-outline',
    iconSelected: 'phone-portrait',
  },
  {
    value: 'light',
    label: 'Light',
    icon: 'sunny-outline',
    iconSelected: 'sunny',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: 'moon-outline',
    iconSelected: 'moon',
  },
];

export function ThemePreferenceControl() {
  const { colors, preference, setPreference } = useTheme();

  return (
    <NeoSurface variant="flat" radius={Radius.lg} style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} appearance`}
            onPress={() => setPreference(option.value)}
            style={styles.optionHit}
          >
            <View style={styles.option}>
              <NeoSurface
                variant={selected ? 'raised' : 'pressed'}
                radius={Radius.full}
                style={styles.iconWell}
              >
                <Ionicons
                  name={selected ? option.iconSelected : option.icon}
                  size={22}
                  color={selected ? colors.text : colors.textMuted}
                />
              </NeoSurface>
              <AppText
                variant="caption"
                tone={selected ? 'default' : 'muted'}
                style={selected ? styles.labelSelected : undefined}
              >
                {option.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </NeoSurface>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  optionHit: {
    flex: 1,
  },
  option: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSelected: {
    fontWeight: '600',
  },
});
