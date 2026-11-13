import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';

type DetailActionsProps = {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
};

export function DetailActions({ onPlay, onShuffle, disabled = false }: DetailActionsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play"
        onPress={onPlay}
        disabled={disabled}
        style={styles.flex}
      >
        <NeoSurface variant="raised" radius={Radius.md} style={styles.button}>
          <AppText variant="label">Play</AppText>
        </NeoSurface>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Shuffle"
        onPress={onShuffle}
        disabled={disabled}
        style={styles.flex}
      >
        <NeoSurface variant="pressed" radius={Radius.md} style={styles.button}>
          <AppText variant="label">Shuffle</AppText>
        </NeoSurface>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
});
