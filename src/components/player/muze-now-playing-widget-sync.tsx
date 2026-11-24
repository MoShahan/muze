import { useEffect } from 'react';

import {
  publishMuzeNowPlayingWidget,
  subscribeMuzeNowPlayingWidgetInteractions,
} from '@/lib/widgets/muze-now-playing-bridge';
import { usePlayback } from '@/store/playback-provider';

/**
 * Keeps the Android home-screen media widget in sync with playback and routes
 * widget transport taps into the in-app player while Muze is running.
 */
export function MuzeNowPlayingWidgetSync() {
  const { currentTrack, isPlaying, togglePlayPause, playNext, playPrevious } = usePlayback();

  useEffect(() => {
    void publishMuzeNowPlayingWidget({
      track: currentTrack,
      isPlaying,
    });
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const subscription = subscribeMuzeNowPlayingWidgetInteractions({
      togglePlayPause,
      playNext,
      playPrevious,
    });
    return () => {
      subscription?.remove();
    };
  }, [playNext, playPrevious, togglePlayPause]);

  return null;
}
