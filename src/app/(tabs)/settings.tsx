import { type Href, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AudioPermissionControl } from '@/components/settings/audio-permission-control';
import { DisplayNameField } from '@/components/settings/display-name-field';
import { FlacVerifyControl } from '@/components/settings/flac-verify-control';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { ThemePreferenceControl } from '@/components/settings/theme-preference-control';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <AppText variant="display">Settings</AppText>

      <SettingsSection title="Appearance">
        <View style={styles.themePad}>
          <ThemePreferenceControl />
        </View>
      </SettingsSection>

      <SettingsSection title="Profile">
        <DisplayNameField />
      </SettingsSection>

      <SettingsSection title="Library">
        <SettingsRow title="Rescan library" detail="Coming soon" />
        <SettingsRow
          title="Library folders"
          detail="Choose"
          hint="Show or hide folders that contain audio in Songs"
          onPress={() => router.push('/library-folders' as Href)}
        />
        <SettingsRow
          title="Folders"
          detail="Browse"
          hint="Device folders as a stack screen (not a tab)"
          onPress={() => router.push('/folders' as Href)}
        />
        <AudioPermissionControl />
        <FlacVerifyControl />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow title="Muze" detail="1.0.0" />
      </SettingsSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  themePad: {
    paddingVertical: Spacing.two,
  },
});
