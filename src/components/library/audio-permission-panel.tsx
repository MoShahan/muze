import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';

type AudioPermissionPanelProps = {
  canAskAgain: boolean;
  busy?: boolean;
  onAllowAccess: () => void;
  onOpenSettings: () => void;
};

export function AudioPermissionPanel({
  canAskAgain,
  busy = false,
  onAllowAccess,
  onOpenSettings,
}: AudioPermissionPanelProps) {
  return (
    <NeoCard style={styles.card}>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">Audio access needed</AppText>
        <AppText variant="subtitle" tone="secondary">
          Muze only needs permission to read music on this device. Photos and videos are not
          requested.{' '}
          {canAskAgain ? 'Allow access to continue.' : 'Enable audio access in system Settings.'}
        </AppText>
      </View>

      {canAskAgain ? (
        <ActionButton
          label={busy ? 'Waiting…' : 'Allow audio access'}
          onPress={onAllowAccess}
          disabled={busy}
        />
      ) : (
        <ActionButton label="Open Settings" onPress={onOpenSettings} disabled={busy} />
      )}

      {canAskAgain ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
          onPress={onOpenSettings}
          disabled={busy}
          hitSlop={8}
        >
          <AppText variant="caption" tone="muted" style={styles.settingsLink}>
            Or open system Settings
          </AppText>
        </Pressable>
      ) : null}
    </NeoCard>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

function ActionButton({ label, onPress, disabled }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
    >
      <NeoSurface variant="pressed" radius={Radius.md} style={styles.action}>
        <AppText variant="label">{label}</AppText>
      </NeoSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  copy: {
    gap: Spacing.two,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  settingsLink: {
    textAlign: 'center',
  },
});
