import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaybackControls } from '@/components/player/playback-controls';
import { PlayerHeader } from '@/components/player/player-header';
import { SongInformation } from '@/components/player/song-information';
import { VinylRecord } from '@/components/player/vinyl-record';
import { WaveformSeekbar } from '@/components/player/waveform-seekbar';
import { Spacing } from '@/constants/theme';
import { useTrackWaveform } from '@/hooks/use-track-waveform';
import { isFavorite, toggleFavorite } from '@/lib/db/favorites';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

export default function PlayerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const {
    currentTrack,
    isPlaying,
    positionMs,
    durationMs,
    playMode,
    togglePlayPause,
    playNext,
    playPrevious,
    seekToMs,
    cyclePlayMode,
  } = usePlayback();

  const [favorited, setFavorited] = useState(false);
  const { peaks, isPlaceholder } = useTrackWaveform({
    trackId: currentTrack?.id,
    uri: currentTrack?.uri,
  });

  useEffect(() => {
    let cancelled = false;
    const trackId = currentTrack?.id;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (!trackId) {
        setFavorited(false);
        return;
      }
      const next = await isFavorite(db, trackId);
      if (!cancelled) {
        setFavorited(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, db]);

  const onToggleFavorite = () => {
    const trackId = currentTrack?.id;
    if (!trackId) {
      return;
    }
    setFavorited((value) => !value);
    void (async () => {
      const next = await toggleFavorite(db, trackId);
      setFavorited(next);
    })();
  };

  const title = currentTrack?.title ?? 'No track';
  const artist = currentTrack?.artist ?? 'Select a song to play';
  const trackDurationMs = durationMs > 0 ? durationMs : (currentTrack?.durationMs ?? 0);
  const progress = useMemo(() => {
    if (trackDurationMs <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, positionMs / trackDurationMs));
  }, [positionMs, trackDurationMs]);

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
          onToggleFavorite={onToggleFavorite}
        />

        <WaveformSeekbar
          peaks={peaks}
          progress={progress}
          durationMs={trackDurationMs}
          isPlaceholder={isPlaceholder}
          onSeek={(nextProgress) => {
            seekToMs(nextProgress * trackDurationMs);
          }}
        />

        <PlaybackControls
          isPlaying={isPlaying}
          playMode={playMode}
          onTogglePlay={togglePlayPause}
          onPrevious={playPrevious}
          onNext={playNext}
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
