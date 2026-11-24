import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius } from '@/constants/theme';
import { artworkDisplayUri } from '@/lib/db/tracks';
import { useTheme } from '@/store/theme-provider';

type LibraryArtworkProps = {
  uri: string | null | undefined;
  size: number;
  /** Circular crop (artists / song rows). Default square-ish rounded. */
  round?: boolean;
};

/** Muted default cover when a track/album has no embedded art. */
function ArtworkPlaceholder({ size, round }: { size: number; round: boolean }) {
  const { colors } = useTheme();
  const radius = round ? size / 2 : Radius.md;
  const iconSize = Math.max(14, Math.round(size * 0.42));

  return (
    <NeoSurface
      variant="pressed"
      radius={radius}
      style={[
        styles.placeholder,
        { width: size, height: size, backgroundColor: colors.surfacePressed },
      ]}
    >
      <Ionicons name="musical-notes" size={iconSize} color={colors.textMuted} />
    </NeoSurface>
  );
}

export function LibraryArtwork({ uri, size, round = false }: LibraryArtworkProps) {
  const radius = round ? size / 2 : Radius.md;
  const displayUri = artworkDisplayUri(uri);

  if (!displayUri) {
    return <ArtworkPlaceholder size={size} round={round} />;
  }

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={{ uri: displayUri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={displayUri}
        transition={120}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
