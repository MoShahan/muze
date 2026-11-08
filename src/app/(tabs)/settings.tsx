import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemePreferenceControl } from '@/components/settings/theme-preference-control';
import { Radius, Spacing, neoRaisedShadow } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + Spacing.five,
        },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Appearance</Text>
        <ThemePreferenceControl />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Profile</Text>
        <SettingsRow title="Display name" detail="Melophile" hint="Used in the Home greeting" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Library</Text>
        <SettingsRow title="Rescan library" detail="Coming soon" />
        <SettingsRow title="Permissions" detail="Coming soon" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>About</Text>
        <SettingsRow title="Muze" detail="1.0.0" />
      </View>
    </ScrollView>
  );
}

type SettingsRowProps = {
  title: string;
  detail: string;
  hint?: string;
};

function SettingsRow({ title, detail, hint }: SettingsRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceRaised }, neoRaisedShadow(colors)]}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        {hint ? <Text style={[styles.rowHint, { color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
      <Text style={[styles.rowDetail, { color: colors.textSecondary }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  rowCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowHint: {
    fontSize: 13,
  },
  rowDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
});
