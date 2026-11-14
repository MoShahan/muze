/**
 * App-wide playback shell backed by expo-audio.
 *
 * Owns one AudioPlayer, the current track, and an in-memory queue of full
 * PlaybackTrack rows (uri included) so next / previous / shuffle / repeat can
 * advance without SQLite lookups. Also persists last track + position for
 * cold-start resume into the mini-player (paused at the saved timestamp).
 */
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  clearPlaybackResumeState,
  getPlaybackResumeState,
  setPlaybackResumeState,
} from '@/lib/db/settings';
import { getTrackById, type CachedTrackRow } from '@/lib/db/tracks';
import {
  nextQueueIndex,
  previousQueueIndex,
  shuffleTracksKeepingCurrent,
} from '@/lib/library/playback-queue';

export type RepeatMode = 'off' | 'all' | 'one';

/** Combined transport mode shown on the player control (cycles shuffle → all → one). */
export type PlayMode = 'shuffle' | 'all' | 'one';

export type PlaybackTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUri?: string | null;
  durationMs?: number;
  /** Device / content URI required for expo-audio. */
  uri: string;
};

type PlaybackContextValue = {
  currentTrack: PlaybackTrack | null;
  queue: PlaybackTrack[];
  queueIndex: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  repeat: RepeatMode;
  shuffle: boolean;
  playMode: PlayMode;
  playTrack: (track: PlaybackTrack) => void;
  setCurrentTrack: (track: PlaybackTrack | null) => void;
  setQueue: (tracks: PlaybackTrack[], startIndex?: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekToMs: (positionMs: number) => void;
  setPositionMs: (positionMs: number) => void;
  setRepeat: (repeat: RepeatMode) => void;
  setShuffle: (shuffle: boolean) => void;
  setPlayMode: (mode: PlayMode) => void;
  cyclePlayMode: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

const PLAY_MODE_ORDER: PlayMode[] = ['shuffle', 'all', 'one'];
const PREVIOUS_RESTART_THRESHOLD_MS = 3000;
/** How often to flush position while playing (ms). */
const RESUME_PERSIST_INTERVAL_MS = 2000;

function toArtworkUrl(uri: string | null | undefined): string | undefined {
  if (!uri) {
    return undefined;
  }
  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
    return uri;
  }
  return `file://${uri}`;
}

function playModeFromFlags(shuffle: boolean, repeat: RepeatMode): PlayMode {
  if (repeat === 'one') {
    return 'one';
  }
  if (shuffle) {
    return 'shuffle';
  }
  return 'all';
}

function trackRowToPlayback(row: CachedTrackRow): PlaybackTrack {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    artworkUri: row.artworkPath,
    durationMs: row.durationMs,
    uri: row.uri,
  };
}

export function PlaybackProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const player = useAudioPlayer(null, {
    updateInterval: 250,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);

  const [currentTrack, setCurrentTrackState] = useState<PlaybackTrack | null>(null);
  const [queue, setQueueState] = useState<PlaybackTrack[]>([]);
  const [originalQueue, setOriginalQueue] = useState<PlaybackTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeat, setRepeatState] = useState<RepeatMode>('all');
  const [shuffle, setShuffleState] = useState(false);

  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const positionMsRef = useRef(0);
  const handlingFinishRef = useRef(false);
  const resumeReadyRef = useRef(false);
  const pendingResumeSeekMsRef = useRef<number | null>(null);
  const lastPersistedAtRef = useRef(0);
  const currentTrackIdRef = useRef<string | null>(null);

  const playMode = playModeFromFlags(shuffle, repeat);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    currentTrackIdRef.current = currentTrack?.id ?? null;
  }, [currentTrack?.id]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  const persistResumeState = useCallback(
    async (trackId: string | null, positionMs: number, force = false) => {
      if (!resumeReadyRef.current || pendingResumeSeekMsRef.current != null) {
        return;
      }
      if (!trackId) {
        await clearPlaybackResumeState(db);
        lastPersistedAtRef.current = Date.now();
        return;
      }
      const now = Date.now();
      if (!force && now - lastPersistedAtRef.current < RESUME_PERSIST_INTERVAL_MS) {
        return;
      }
      lastPersistedAtRef.current = now;
      await setPlaybackResumeState(db, {
        trackId,
        positionMs: Math.max(0, Math.round(positionMs)),
      });
    },
    [db],
  );

  const applyLockScreen = useCallback(
    (track: PlaybackTrack) => {
      try {
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.artist,
          albumTitle: track.album,
          artworkUrl: toArtworkUrl(track.artworkUri),
        });
      } catch {
        // Lock screen metadata is best-effort on this milestone.
      }
    },
    [player],
  );

  const loadAndPlay = useCallback(
    (track: PlaybackTrack, index: number) => {
      pendingResumeSeekMsRef.current = null;
      setCurrentTrackState(track);
      setQueueIndex(index);
      queueIndexRef.current = index;
      if (!track.uri) {
        return;
      }
      player.replace({ uri: track.uri });
      player.play();
      applyLockScreen(track);
      void persistResumeState(track.id, 0, true);
    },
    [applyLockScreen, persistResumeState, player],
  );

  const playTrack = useCallback(
    (track: PlaybackTrack) => {
      const existingIndex = queueRef.current.findIndex((item) => item.id === track.id);
      if (existingIndex >= 0) {
        loadAndPlay(track, existingIndex);
        return;
      }
      // Single-track fallback when no queue was prepared.
      setQueueState([track]);
      setOriginalQueue([track]);
      queueRef.current = [track];
      loadAndPlay(track, 0);
    },
    [loadAndPlay],
  );

  const setCurrentTrack = useCallback(
    (track: PlaybackTrack | null) => {
      setCurrentTrackState(track);
      if (!track) {
        pendingResumeSeekMsRef.current = null;
        void persistResumeState(null, 0, true);
      }
    },
    [persistResumeState],
  );

  const setQueue = useCallback((tracks: PlaybackTrack[], startIndex = 0) => {
    const safeIndex = Math.min(Math.max(0, startIndex), Math.max(0, tracks.length - 1));
    setOriginalQueue(tracks);
    setQueueState(tracks);
    setQueueIndex(safeIndex);
    queueRef.current = tracks;
    queueIndexRef.current = safeIndex;
  }, []);

  const setIsPlaying = useCallback(
    (playing: boolean) => {
      if (playing) {
        player.play();
      } else {
        player.pause();
        void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
      }
    },
    [persistResumeState, player],
  );

  const togglePlayPause = useCallback(() => {
    if (status.playing) {
      player.pause();
      void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
    } else {
      player.play();
    }
  }, [persistResumeState, player, status.playing]);

  const playNext = useCallback(() => {
    const tracks = queueRef.current;
    const index = queueIndexRef.current;
    const wrap = repeatRef.current === 'all' || shuffleRef.current;
    const nextIndex = nextQueueIndex(tracks.length, index, { wrap });
    if (nextIndex == null) {
      player.pause();
      void player.seekTo(0);
      return;
    }
    loadAndPlay(tracks[nextIndex], nextIndex);
  }, [loadAndPlay, player]);

  const playPrevious = useCallback(() => {
    if (positionMsRef.current > PREVIOUS_RESTART_THRESHOLD_MS) {
      void player.seekTo(0);
      player.play();
      return;
    }
    const tracks = queueRef.current;
    const index = queueIndexRef.current;
    const wrap = repeatRef.current === 'all' || shuffleRef.current;
    const prevIndex = previousQueueIndex(tracks.length, index, { wrap });
    if (prevIndex == null) {
      void player.seekTo(0);
      player.play();
      return;
    }
    loadAndPlay(tracks[prevIndex], prevIndex);
  }, [loadAndPlay, player]);

  const seekToMs = useCallback(
    (positionMs: number) => {
      void player.seekTo(Math.max(0, positionMs) / 1000);
    },
    [player],
  );

  const setPositionMs = useCallback(
    (positionMs: number) => {
      seekToMs(positionMs);
    },
    [seekToMs],
  );

  const setRepeat = useCallback((next: RepeatMode) => {
    setRepeatState(next);
    repeatRef.current = next;
  }, []);

  const setShuffle = useCallback(
    (enabled: boolean) => {
      setShuffleState(enabled);
      shuffleRef.current = enabled;
      const currentId = queueRef.current[queueIndexRef.current]?.id ?? null;
      if (enabled) {
        const source = originalQueue.length > 0 ? originalQueue : queueRef.current;
        const shuffled = shuffleTracksKeepingCurrent(source, currentId);
        setQueueState(shuffled);
        queueRef.current = shuffled;
        setQueueIndex(0);
        queueIndexRef.current = 0;
        return;
      }
      const restored = originalQueue.length > 0 ? originalQueue : queueRef.current;
      const restoredIndex = currentId
        ? Math.max(
            0,
            restored.findIndex((track) => track.id === currentId),
          )
        : 0;
      setQueueState(restored);
      queueRef.current = restored;
      setQueueIndex(restoredIndex);
      queueIndexRef.current = restoredIndex;
    },
    [originalQueue],
  );

  const setPlayMode = useCallback(
    (mode: PlayMode) => {
      if (mode === 'one') {
        setShuffle(false);
        setRepeat('one');
        return;
      }
      if (mode === 'shuffle') {
        setRepeat('all');
        setShuffle(true);
        return;
      }
      setShuffle(false);
      setRepeat('all');
    },
    [setRepeat, setShuffle],
  );

  const cyclePlayMode = useCallback(() => {
    const index = PLAY_MODE_ORDER.indexOf(playMode);
    const next = PLAY_MODE_ORDER[(index + 1) % PLAY_MODE_ORDER.length];
    setPlayMode(next);
  }, [playMode, setPlayMode]);

  // Advance or replay when a track finishes.
  useEffect(() => {
    if (!status.didJustFinish) {
      handlingFinishRef.current = false;
      return;
    }
    if (handlingFinishRef.current) {
      return;
    }
    handlingFinishRef.current = true;
    if (repeatRef.current === 'one') {
      void player.seekTo(0);
      player.play();
      return;
    }
    playNext();
  }, [status.didJustFinish, playNext, player]);

  // Cold start: restore last track into mini-player, paused at saved position.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }

      const saved = await getPlaybackResumeState(db);
      if (cancelled) {
        return;
      }

      if (!saved) {
        resumeReadyRef.current = true;
        return;
      }

      const row = await getTrackById(db, saved.trackId);
      if (cancelled) {
        return;
      }

      if (!row?.uri) {
        await clearPlaybackResumeState(db);
        resumeReadyRef.current = true;
        return;
      }

      const track = trackRowToPlayback(row);
      const maxPosition = Math.max(0, row.durationMs > 0 ? row.durationMs - 250 : saved.positionMs);
      const seekMs = Math.min(Math.max(0, saved.positionMs), maxPosition);

      setCurrentTrackState(track);
      setQueueState([track]);
      setOriginalQueue([track]);
      queueRef.current = [track];
      setQueueIndex(0);
      queueIndexRef.current = 0;
      pendingResumeSeekMsRef.current = seekMs;
      positionMsRef.current = seekMs;

      player.replace({ uri: track.uri });
      player.pause();
      applyLockScreen(track);
      resumeReadyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [applyLockScreen, db, player]);

  // Apply deferred seek once the restored source is loaded; stay paused.
  useEffect(() => {
    const seekMs = pendingResumeSeekMsRef.current;
    if (seekMs == null || !status.isLoaded) {
      return;
    }
    pendingResumeSeekMsRef.current = null;
    void player.seekTo(seekMs / 1000);
    player.pause();
  }, [player, status.isLoaded]);

  const isPlaying = status.playing;
  const positionMs = Math.round((status.currentTime ?? 0) * 1000);
  useEffect(() => {
    positionMsRef.current = positionMs;
  }, [positionMs]);

  // Throttled position flush while playing; always flush when paused with a track.
  useEffect(() => {
    if (!resumeReadyRef.current || !currentTrack) {
      return;
    }
    void persistResumeState(currentTrack.id, positionMs, !isPlaying);
  }, [currentTrack, isPlaying, persistResumeState, positionMs]);

  // Flush on background / inactive so a kill still restores the right spot.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        return;
      }
      void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [persistResumeState]);

  const durationMs = Math.round(
    status.duration && status.duration > 0
      ? status.duration * 1000
      : (currentTrack?.durationMs ?? 0),
  );

  const value: PlaybackContextValue = {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    positionMs,
    durationMs,
    repeat,
    shuffle,
    playMode,
    playTrack,
    setCurrentTrack,
    setQueue,
    setIsPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    seekToMs,
    setPositionMs,
    setRepeat,
    setShuffle,
    setPlayMode,
    cyclePlayMode,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlayback(): PlaybackContextValue {
  const value = use(PlaybackContext);
  if (!value) {
    throw new Error('usePlayback must be used within PlaybackProvider');
  }
  return value;
}
