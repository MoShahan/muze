import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef } from 'react';

import { recordRecentPlay } from '@/lib/db/recents';
import { usePlayback } from '@/store/playback-provider';

/**
 * Writes the current track into recents when playback actually starts.
 * Skips cold-start resume (track restored paused) until the user presses play.
 */
export function RecentPlayRecorder() {
  const db = useSQLiteContext();
  const { currentTrack, isPlaying } = usePlayback();
  const lastRecordedId = useRef<string | null>(null);

  useEffect(() => {
    const trackId = currentTrack?.id;
    if (!isPlaying || !trackId || trackId === lastRecordedId.current) {
      return;
    }
    lastRecordedId.current = trackId;
    void recordRecentPlay(db, trackId);
  }, [currentTrack?.id, db, isPlaying]);

  return null;
}
