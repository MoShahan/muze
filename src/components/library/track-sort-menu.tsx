import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { TRACK_SORT_OPTIONS, type TrackSortKey } from '@/lib/library/sort-tracks';
import { useTheme } from '@/store/theme-provider';

type TrackSortMenuProps = {
  visible: boolean;
  value: TrackSortKey;
  onChange: (value: TrackSortKey) => void;
  onClose: () => void;
};

/** Sort picker modal used by album detail hero Sort control. */
export function TrackSortMenu({ visible, value, onChange, onClose }: TrackSortMenuProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dialogHit}>
          <NeoCard style={styles.dialog}>
            <AppText variant="title">Sort tracks</AppText>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Sort tracks"
              style={styles.list}
            >
              {TRACK_SORT_OPTIONS.map((option) => {
                const selected = option.key === value;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Sort by ${option.label}`}
                    onPress={() => {
                      onChange(option.key);
                      onClose();
                    }}
                  >
                    <NeoSurface
                      variant={selected ? 'raised' : 'pressed'}
                      radius={Radius.md}
                      style={styles.option}
                    >
                      <AppText variant="label" tone={selected ? 'default' : 'secondary'}>
                        {option.label}
                      </AppText>
                    </NeoSurface>
                  </Pressable>
                );
              })}
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
  list: {
    gap: Spacing.two,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
