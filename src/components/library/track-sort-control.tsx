import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ElementRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TrackSortMenu, type SortMenuAnchor } from '@/components/library/track-sort-menu';
import { AppText } from '@/components/ui/app-text';
import { NeoIconButton } from '@/components/ui/neo-icon-button';
import { Spacing } from '@/constants/theme';
import {
  defaultDirectionForSortKey,
  trackSortOptionLabel,
  type TrackSortDirection,
  type TrackSortKey,
} from '@/lib/library/sort-tracks';
import { useTheme } from '@/store/theme-provider';

type TrackSortControlProps = {
  value: TrackSortKey;
  direction: TrackSortDirection;
  onChange: (value: TrackSortKey) => void;
  onDirectionChange: (direction: TrackSortDirection) => void;
  /** Text trigger for lists; icon for album hero actions. */
  variant?: 'text' | 'icon';
  disabled?: boolean;
};

/**
 * Right-aligned sort label that opens a small anchored text dropdown.
 * Tapping the active option again flips its direction (A-Z ↔ Z-A, etc.).
 */
export function TrackSortControl({
  value,
  direction,
  onChange,
  onDirectionChange,
  variant = 'text',
  disabled = false,
}: TrackSortControlProps) {
  const { colors } = useTheme();
  const triggerRef = useRef<ElementRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<SortMenuAnchor | null>(null);
  const currentLabel = trackSortOptionLabel(value, direction);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const onSelectKey = (next: TrackSortKey) => {
    if (next === value) {
      onDirectionChange(direction === 'asc' ? 'desc' : 'asc');
      return;
    }
    onChange(next);
    onDirectionChange(defaultDirectionForSortKey(next));
  };

  return (
    <>
      <View ref={triggerRef} collapsable={false} style={styles.wrap}>
        {variant === 'icon' ? (
          <NeoIconButton
            label={currentLabel}
            icon="swap-vertical"
            variant="pressed"
            size="md"
            onPress={openMenu}
            disabled={disabled}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={currentLabel}
            accessibilityHint="Opens sort options. Tap the same option again to reverse."
            disabled={disabled}
            onPress={openMenu}
            hitSlop={8}
            style={[styles.trigger, disabled ? styles.disabled : null]}
          >
            <AppText variant="caption" tone="muted">
              Sort
            </AppText>
            <AppText variant="label">{currentLabel}</AppText>
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      <TrackSortMenu
        visible={open}
        value={value}
        direction={direction}
        anchor={anchor}
        onChange={onSelectKey}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    maxWidth: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
});
