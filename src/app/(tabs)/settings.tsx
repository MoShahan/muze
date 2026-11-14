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
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useLibraryScan } from '@/store/library-scan-provider';

export default function SettingsScreen() {
  const { isGranted } = useAudioLibraryPermission();
  const { isScanning, libraryCounts, rescan } = useLibraryScan();

  const rescanDetail = !isGranted
    ? 'Needs permission'
    : isScanning
      ? 'Scanning…'
      : libraryCounts.tracks > 0
        ? `${libraryCounts.tracks} songs`
        : 'Tap to scan';

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
        <SettingsRow
          title="Rescan library"
          detail={rescanDetail}
          hint="Walk device audio again and update Songs, Albums, and Artists"
          accessibilityLabel={`Rescan library. ${rescanDetail}`}
          onPress={
            isGranted && !isScanning
              ? () => {
                  void rescan();
                }
              : undefined
          }
        />
        <SettingsRow
          title="Folder visibility"
          detail="Choose"
          hint="Choose which folders appear in Songs, Albums, and Artists"
          onPress={() => router.push('/library-folders' as Href)}
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
