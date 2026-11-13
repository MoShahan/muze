import { StyleSheet, View } from 'react-native';

import { DetailActions } from '@/components/library/detail-actions';
import { LibraryArtwork } from '@/components/library/library-artwork';
import { Spacing } from '@/constants/theme';

type DetailHeroProps = {
  artworkUri?: string | null;
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
  roundArt?: boolean;
};

export function DetailHero({
  artworkUri,
  onPlay,
  onShuffle,
  disabled = false,
  roundArt = false,
}: DetailHeroProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.artWrap}>
        <LibraryArtwork uri={artworkUri} size={120} round={roundArt} />
      </View>
      <DetailActions onPlay={onPlay} onShuffle={onShuffle} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
  artWrap: {
    alignItems: 'center',
  },
});
