import { StyleSheet, View } from 'react-native';

import { AudioPermissionControl } from '@/components/settings/audio-permission-control';
import { DisplayNameField } from '@/components/settings/display-name-field';
import { FlacVerifyControl } from '@/components/settings/flac-verify-control';
import { ThemePreferenceControl } from '@/components/settings/theme-preference-control';
import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <AppText variant="display">Settings</AppText>

      <View style={styles.section}>
        <AppText variant="section" tone="muted">
          Appearance
        </AppText>
        <ThemePreferenceControl />
      </View>

      <View style={styles.section}>
        <AppText variant="section" tone="muted">
          Profile
        </AppText>
        <DisplayNameField />
      </View>

      <View style={styles.section}>
        <AppText variant="section" tone="muted">
          Library
        </AppText>
        <SettingsRow title="Rescan library" detail="Coming soon" />
        <AudioPermissionControl />
        <FlacVerifyControl />
      </View>

      <View style={styles.section}>
        <AppText variant="section" tone="muted">
          About
        </AppText>
        <SettingsRow title="Muze" detail="1.0.0" />
      </View>
    </Screen>
  );
}

type SettingsRowProps = {
  title: string;
  detail: string;
  hint?: string;
};

function SettingsRow({ title, detail, hint }: SettingsRowProps) {
  return (
    <NeoCard style={styles.row}>
      <View style={styles.rowCopy}>
        <NeoCard.Title>{title}</NeoCard.Title>
        {hint ? <NeoCard.Subtitle>{hint}</NeoCard.Subtitle> : null}
      </View>
      <AppText variant="label" tone="secondary">
        {detail}
      </AppText>
    </NeoCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowCopy: {
    flex: 1,
    gap: Spacing.half,
  },
});
