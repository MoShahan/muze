import { StyleSheet, View } from 'react-native';

import { NeoIconButton } from '@/components/ui/neo-icon-button';
import { Spacing } from '@/constants/theme';

type DetailActionsProps = {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
};

export function DetailActions({ onPlay, onShuffle, disabled = false }: DetailActionsProps) {
  return (
    <View style={styles.row}>
      <NeoIconButton
        label="Play"
        icon="play"
        variant="raised"
        size="md"
        onPress={onPlay}
        disabled={disabled}
      />
      <NeoIconButton
        label="Shuffle"
        icon="shuffle"
        variant="pressed"
        size="md"
        onPress={onShuffle}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
