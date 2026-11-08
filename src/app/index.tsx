import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaybackControls } from '@/components/player/playback-controls';
import { PlayerHeader } from '@/components/player/player-header';
import { SongInformation } from '@/components/player/song-information';
import { VinylRecord } from '@/components/player/vinyl-record';
import { WaveformSeekbar } from '@/components/player/waveform-seekbar';
import { MOCK_TRACK, MOCK_WAVEFORM_PEAKS } from '@/constants/mock-player';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type RepeatMode = 'off' | 'all' | 'one';

export default function NowPlayingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isPlaying, setIsPlaying] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [progress, setProgress] = useState(0.28);

  const cycleRepeat = () => {
    setRepeat((current) => {
      if (current === 'off') return 'all';
      if (current === 'all') return 'one';
      return 'off';
    });
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, Spacing.three),
        },
      ]}
    >
      <PlayerHeader />

      <View style={styles.vinylBlock}>
        <VinylRecord isPlaying={isPlaying} />
      </View>

      <SongInformation
        title={MOCK_TRACK.title}
        artist={MOCK_TRACK.artist}
        favorited={favorited}
        onToggleFavorite={() => setFavorited((value) => !value)}
      />

      <WaveformSeekbar
        peaks={MOCK_WAVEFORM_PEAKS}
        progress={progress}
        durationMs={MOCK_TRACK.durationMs}
        onSeek={setProgress}
      />

      <PlaybackControls
        isPlaying={isPlaying}
        shuffle={shuffle}
        repeat={repeat}
        onTogglePlay={() => setIsPlaying((value) => !value)}
        onPrevious={() => setProgress(0)}
        onNext={() => setProgress(0)}
        onToggleShuffle={() => setShuffle((value) => !value)}
        onCycleRepeat={cycleRepeat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  vinylBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingVertical: Spacing.two,
  },
});
