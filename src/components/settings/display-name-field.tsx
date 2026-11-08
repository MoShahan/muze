import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { DEFAULT_DISPLAY_NAME, getDisplayName, setDisplayName } from '@/lib/db/settings';
import { useTheme } from '@/store/theme-provider';

export function DisplayNameField() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [savedName, setSavedName] = useState(DEFAULT_DISPLAY_NAME);
  const [draft, setDraft] = useState(DEFAULT_DISPLAY_NAME);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getDisplayName(db);
      if (!cancelled) {
        setSavedName(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const openEditor = () => {
    setDraft(savedName);
    setOpen(true);
  };

  const discardAndClose = () => {
    setDraft(savedName);
    setOpen(false);
  };

  const save = () => {
    const trimmed = draft.trim();
    const next = trimmed.length > 0 ? trimmed : DEFAULT_DISPLAY_NAME;
    setSavedName(next);
    setDraft(next);
    setOpen(false);
    void setDisplayName(db, trimmed.length > 0 ? trimmed : '');
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit display name"
        onPress={openEditor}
      >
        <NeoCard style={styles.row}>
          <View style={styles.rowCopy}>
            <NeoCard.Title>Display name</NeoCard.Title>
            <NeoCard.Subtitle>Used in greetings (e.g. Songs header)</NeoCard.Subtitle>
          </View>
          <AppText variant="label" tone="secondary">
            {savedName}
          </AppText>
        </NeoCard>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={discardAndClose}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss display name editor"
            onPress={discardAndClose}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.dialogHit}>
            <NeoCard style={styles.dialog}>
              <View style={styles.dialogHeader}>
                <AppText variant="title">Display name</AppText>
                <AppText variant="caption" tone="muted">
                  Used in greetings (e.g. Songs header)
                </AppText>
              </View>

              <TextInput
                accessibilityLabel="Display name"
                value={draft}
                onChangeText={setDraft}
                placeholder={DEFAULT_DISPLAY_NAME}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={save}
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
                  onPress={discardAndClose}
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
                  accessibilityLabel="Save display name"
                  onPress={save}
                  style={styles.actionHit}
                >
                  <NeoSurface variant="pressed" radius={Radius.md} style={styles.action}>
                    <AppText variant="label">Save</AppText>
                  </NeoSurface>
                </Pressable>
              </View>
            </NeoCard>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
