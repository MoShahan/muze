import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaybackControls, type PlayMode } from '@/components/player/playback-controls';
import { PlayerHeader } from '@/components/player/player-header';
import { SongInformation } from '@/components/player/song-information';
import { VinylRecord } from '@/components/player/vinyl-record';
import { WaveformSeekbar } from '@/components/player/waveform-seekbar';
import { MOCK_TRACK, MOCK_WAVEFORM_PEAKS } from '@/constants/mock-player';
import { Spacing } from '@/constants/theme';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

const PLAY_MODE_ORDER: PlayMode[] = ['shuffle', 'all', 'one'];

export default function PlayerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, setIsPlaying } = usePlayback();

  const [favorited, setFavorited] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('all');
  const [progress, setProgress] = useState(0.28);

  const title = currentTrack?.title ?? MOCK_TRACK.title;
  const artist = currentTrack?.artist ?? MOCK_TRACK.artist;
  const durationMs = currentTrack?.durationMs ?? MOCK_TRACK.durationMs;

  const cyclePlayMode = () => {
    setPlayMode((current) => {
      const index = PLAY_MODE_ORDER.indexOf(current);
      return PLAY_MODE_ORDER[(index + 1) % PLAY_MODE_ORDER.length];
    });
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}
    >
      <PlayerHeader />

      <View style={styles.vinylBlock}>
        <VinylRecord isPlaying={isPlaying} />
      </View>

      <View style={styles.lower}>
        <SongInformation
          title={title}
          artist={artist}
          favorited={favorited}
          onToggleFavorite={() => setFavorited((value) => !value)}
        />

        <WaveformSeekbar
          peaks={MOCK_WAVEFORM_PEAKS}
          progress={progress}
          durationMs={durationMs}
          onSeek={setProgress}
        />

        <PlaybackControls
          isPlaying={isPlaying}
          playMode={playMode}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onPrevious={() => setProgress(0)}
          onNext={() => setProgress(0)}
          onCyclePlayMode={cyclePlayMode}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: Spacing.two,
  },
  vinylBlock: {
    alignItems: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
    height: 500,
    paddingTop: Spacing.six,
  },
  lower: {
    gap: Spacing.three,
    paddingBottom: Spacing.one,
  },
});
