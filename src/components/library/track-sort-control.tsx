import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { TRACK_SORT_OPTIONS, type TrackSortKey } from '@/lib/library/sort-tracks';

type TrackSortControlProps = {
  value: TrackSortKey;
  onChange: (value: TrackSortKey) => void;
};

export function TrackSortControl({ value, onChange }: TrackSortControlProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Sort tracks" style={styles.row}>
      {TRACK_SORT_OPTIONS.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Sort by ${option.label}`}
            onPress={() => onChange(option.key)}
            style={styles.item}
          >
            <NeoSurface
              variant={selected ? 'raised' : 'pressed'}
              radius={Radius.sm}
              style={styles.chip}
            >
              <AppText variant="caption" tone={selected ? 'default' : 'secondary'}>
                {option.label}
              </AppText>
            </NeoSurface>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  item: {
    flexGrow: 1,
    flexBasis: '40%',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
});
