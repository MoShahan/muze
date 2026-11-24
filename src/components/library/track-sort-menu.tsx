import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { neoRaisedShadow, Radius, Spacing } from '@/constants/theme';
import {
  defaultDirectionForSortKey,
  TRACK_SORT_OPTIONS,
  trackSortOptionLabel,
  type TrackSortDirection,
  type TrackSortKey,
} from '@/lib/library/sort-tracks';
import { useTheme } from '@/store/theme-provider';

export type SortMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TrackSortMenuProps = {
  visible: boolean;
  value: TrackSortKey;
  direction: TrackSortDirection;
  anchor: SortMenuAnchor | null;
  onChange: (value: TrackSortKey) => void;
  onClose: () => void;
};

const MENU_WIDTH = 220;
const MENU_ESTIMATED_HEIGHT = 188;

/** Small text dropdown anchored to the sort trigger. */
export function TrackSortMenu({
  visible,
  value,
  direction,
  anchor,
  onChange,
  onClose,
}: TrackSortMenuProps) {
  const { colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (!visible || !anchor) {
    return null;
  }

  const openBelow = anchor.y + anchor.height + 6 + MENU_ESTIMATED_HEIGHT < windowHeight - 12;
  const top = openBelow
    ? anchor.y + anchor.height + 6
    : Math.max(12, anchor.y - MENU_ESTIMATED_HEIGHT - 6);
  const left = Math.min(
    Math.max(Spacing.two, anchor.x + anchor.width - MENU_WIDTH),
    windowWidth - MENU_WIDTH - Spacing.two,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sort options"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityRole="menu"
          accessibilityLabel="Sort tracks"
          style={[
            styles.menu,
            neoRaisedShadow(colors),
            {
              top,
              left,
              width: MENU_WIDTH,
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}
        >
          {TRACK_SORT_OPTIONS.map((option, index) => {
            const selected = option.key === value;
            // Active row shows the next toggle (e.g. Z-A while sorted A-Z), not the current state.
            const optionDirection = selected
              ? direction === 'asc'
                ? 'desc'
                : 'asc'
              : defaultDirectionForSortKey(option.key);
            const label = trackSortOptionLabel(option.key, optionDirection);
            const isLast = index === TRACK_SORT_OPTIONS.length - 1;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                onPress={() => {
                  onChange(option.key);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                  pressed && { backgroundColor: colors.surfacePressed },
                  selected && { backgroundColor: colors.surfacePressed },
                ]}
              >
                <AppText
                  variant="label"
                  tone={selected ? 'default' : 'secondary'}
                  style={selected ? styles.selectedLabel : undefined}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    minHeight: 40,
    justifyContent: 'center',
  },
  selectedLabel: {
    fontWeight: '700',
  },
});
