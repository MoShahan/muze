import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type LibraryArtworkProps = {
  uri: string | null | undefined;
  size: number;
  /** Circular crop (artists / song rows). Default square-ish rounded. */
  round?: boolean;
};

export function LibraryArtwork({ uri, size, round = false }: LibraryArtworkProps) {
  const { colors } = useTheme();
  const radius = round ? size / 2 : Radius.md;

  if (!uri) {
    return (
      <NeoSurface
        variant="pressed"
        radius={radius}
        style={{ width: size, height: size, backgroundColor: colors.surfacePressed }}
      />
    );
  }

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        recyclingKey={uri}
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
});
