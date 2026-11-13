import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef } from 'react';

import { recordRecentPlay } from '@/lib/db/recents';
import { usePlayback } from '@/store/playback-provider';

/** Writes the current track into recents whenever playback starts a new id. */
export function RecentPlayRecorder() {
  const db = useSQLiteContext();
  const { currentTrack } = usePlayback();
  const lastRecordedId = useRef<string | null>(null);

  useEffect(() => {
    const trackId = currentTrack?.id;
    if (!trackId || trackId === lastRecordedId.current) {
      return;
    }
    lastRecordedId.current = trackId;
    void recordRecentPlay(db, trackId);
  }, [currentTrack?.id, db]);

  return null;
}
