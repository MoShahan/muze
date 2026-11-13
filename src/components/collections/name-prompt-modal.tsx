import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type NamePromptModalProps = {
  visible: boolean;
  title: string;
  hint?: string;
  value: string;
  placeholder?: string;
  confirmLabel?: string;
  onChangeText: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Shared create/rename name dialog used by playlists. */
export function NamePromptModal({
  visible,
  title,
  hint,
  value,
  placeholder = 'Name',
  confirmLabel = 'Save',
  onChangeText,
  onCancel,
  onConfirm,
}: NamePromptModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dialogHit}>
          <NeoCard style={styles.dialog}>
            <View style={styles.dialogHeader}>
              <AppText variant="title">{title}</AppText>
              {hint ? (
                <AppText variant="caption" tone="muted">
                  {hint}
                </AppText>
              ) : null}
            </View>

            <TextInput
              accessibilityLabel={title}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="sentences"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onConfirm}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            />

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={onCancel}
                style={styles.actionHit}
              >
                <NeoSurface variant="flat" radius={Radius.md} style={styles.action}>
                  <AppText variant="label" tone="muted">
                    Cancel
                  </AppText>
                </NeoSurface>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                onPress={onConfirm}
                style={styles.actionHit}
              >
                <NeoSurface variant="pressed" radius={Radius.md} style={styles.action}>
                  <AppText variant="label">{confirmLabel}</AppText>
                </NeoSurface>
              </Pressable>
            </View>
          </NeoCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  dialogHit: {
    width: '100%',
    maxWidth: 360,
  },
  dialog: {
    gap: Spacing.three,
  },
  dialogHeader: {
    gap: Spacing.half,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionHit: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
});
