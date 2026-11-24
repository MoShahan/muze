import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
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
import { artworkDisplayUri } from '@/lib/db/tracks';
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
  const artUri = artworkDisplayUri(currentTrack?.artworkUri);

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
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {artUri ? (
        <>
          <Image
            source={{ uri: artUri }}
            style={styles.backdropArt}
            contentFit="cover"
            blurRadius={48}
            recyclingKey={`player-bg-${artUri}`}
            transition={200}
          />
          <View pointerEvents="none" style={styles.glassTint} />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.12)', 'transparent']}
            locations={[0, 0.4, 1]}
            style={styles.topScrim}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.72)']}
            locations={[0, 0.4, 1]}
            style={styles.bottomScrim}
            pointerEvents="none"
          />
        </>
      ) : null}

      <View
        style={[
          styles.foreground,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, Spacing.two) + Spacing.five * 3,
          },
        ]}
      >
        <PlayerHeader trackId={currentTrack?.id} />

        <View style={styles.vinylBlock}>
          <VinylRecord isPlaying={isPlaying} artworkUri={currentTrack?.artworkUri} />
        </View>

        <View style={styles.lower}>
          <SongInformation
            title={title}
            artist={artist}
            favorited={favorited}
            onToggleFavorite={onToggleFavorite}
            onGlass={Boolean(artUri)}
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
            onOpenQueue={() => router.push('/queue' as Href)}
            onGlass={Boolean(artUri)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backdropArt: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 1.12 }],
  },
  glassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '32%',
  },
  foreground: {
    flex: 1,
    gap: Spacing.two,
  },
  vinylBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lower: {
    gap: Spacing.five,
  },
});
