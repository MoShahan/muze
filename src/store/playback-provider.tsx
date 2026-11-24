/**
 * App-wide playback shell backed by expo-audio's AudioPlaylist.
 *
 * Uses a playlist (not a single AudioPlayer) so Android/iOS media-session
 * next/previous actions from headsets, Bluetooth, and the lock-screen
 * notification can advance the queue. Activates lock-screen / media
 * notification metadata (title, artist, artwork) for background playback.
 * JS still owns shuffle/repeat policy, resume persistence, and sleep timer.
 */
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
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
import { artworkDisplayUri, getTrackById, type CachedTrackRow } from '@/lib/db/tracks';
import {
  clampResumePositionMs,
  playModeFromFlags,
  toPlaylistLoop,
  type PlayMode,
  type RepeatMode,
} from '@/lib/library/playback-math';
import { moveQueueItem, shuffleTracksKeepingCurrent } from '@/lib/library/playback-queue';
import { ensurePlaybackNotificationPermission } from '@/lib/media/playback-notifications';

export type { PlayMode, RepeatMode };
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
  /** Epoch ms when the sleep timer should pause playback; null when off. */
  sleepTimerEndsAt: number | null;
  playTrack: (track: PlaybackTrack) => void;
  setCurrentTrack: (track: PlaybackTrack | null) => void;
  setQueue: (tracks: PlaybackTrack[], startIndex?: number) => void;
  /** Reorder the in-memory + native queue; keeps the current track playing. */
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  /** Remove an upcoming (non-current) track from the queue. */
  removeFromQueue: (index: number) => void;
  /** Jump to a queue index and play it. */
  playQueueIndex: (index: number) => void;
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
  /** Start a sleep timer for `durationMs`, or pass null / 0 to cancel. */
  setSleepTimer: (durationMs: number | null) => void;
  clearSleepTimer: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

const PLAY_MODE_ORDER: PlayMode[] = ['shuffle', 'all', 'one'];
const PREVIOUS_RESTART_THRESHOLD_MS = 3000;
/** How often to flush position while playing (ms). */
const RESUME_PERSIST_INTERVAL_MS = 2000;

const LOCK_SCREEN_OPTIONS = {
  showNextTrack: true,
  showPreviousTrack: true,
  showSeekForward: false,
  showSeekBackward: false,
} as const;

function lockScreenMetadata(track: PlaybackTrack) {
  return {
    title: track.title,
    artist: track.artist,
    albumTitle: track.album,
    artworkUrl: artworkDisplayUri(track.artworkUri) ?? undefined,
  };
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

function queueSignature(tracks: readonly PlaybackTrack[]): string {
  return tracks.map((track) => track.id).join('\0');
}

export function PlaybackProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  // Empty initial sources - queue is pushed via clear/add so loop changes do not recreate the playlist.
  const playlist = useAudioPlaylist({
    sources: [],
    updateInterval: 250,
    loop: 'all',
  });
  const status = useAudioPlaylistStatus(playlist);
  // Ref so imperative playlist mutations (loop / queue sync) are not flagged as
  // modifying the hook return value during render.
  const playlistRef = useRef(playlist);

  const [currentTrack, setCurrentTrackState] = useState<PlaybackTrack | null>(null);
  const [queue, setQueueState] = useState<PlaybackTrack[]>([]);
  /** Unshuffled order so turning shuffle off restores the user's sequence. */
  const [originalQueue, setOriginalQueue] = useState<PlaybackTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeat, setRepeatState] = useState<RepeatMode>('all');
  const [shuffle, setShuffleState] = useState(false);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);

  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const positionMsRef = useRef(0);
  /** False until cold-start resume finishes so we do not overwrite saved position early. */
  const resumeReadyRef = useRef(false);
  /** Seek applied after the restored source reports `isLoaded` (stay paused). */
  const pendingResumeSeekMsRef = useRef<number | null>(null);
  const lastPersistedAtRef = useRef(0);
  const currentTrackIdRef = useRef<string | null>(null);
  const currentTrackRef = useRef<PlaybackTrack | null>(null);
  const sleepTimerEndsAtRef = useRef<number | null>(null);
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeQueueSignatureRef = useRef('');

  const playMode = playModeFromFlags(shuffle, repeat);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

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
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    void (async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      // Android 13+: needed so the media-session notification appears in the shade.
      await ensurePlaybackNotificationPermission();
    })();
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

  const applyLockScreen = useCallback((track: PlaybackTrack) => {
    try {
      playlistRef.current.setActiveForLockScreen(
        true,
        lockScreenMetadata(track),
        LOCK_SCREEN_OPTIONS,
      );
    } catch {
      // Lock screen / notification controls are best-effort on misconfigured builds.
    }
  }, []);

  const updateLockScreen = useCallback(
    (track: PlaybackTrack) => {
      try {
        playlistRef.current.updateLockScreenMetadata(lockScreenMetadata(track));
      } catch {
        applyLockScreen(track);
      }
    },
    [applyLockScreen],
  );

  const applyPlaylistLoop = useCallback(() => {
    playlistRef.current.loop = toPlaylistLoop(repeatRef.current, shuffleRef.current);
  }, []);

  /** Push the JS queue into the native playlist when the id order changes. */
  const syncNativePlaylist = useCallback(
    (tracks: PlaybackTrack[], startIndex: number) => {
      const active = playlistRef.current;
      const signature = queueSignature(tracks);
      if (signature !== nativeQueueSignatureRef.current) {
        active.clear();
        for (const track of tracks) {
          if (track.uri) {
            active.add({ uri: track.uri });
          }
        }
        nativeQueueSignatureRef.current = signature;
      }
      applyPlaylistLoop();
      const safeIndex = Math.min(Math.max(0, startIndex), Math.max(0, tracks.length - 1));
      if (tracks.length > 0 && active.currentIndex !== safeIndex) {
        active.skipTo(safeIndex);
      }
    },
    [applyPlaylistLoop],
  );

  const selectTrackAtIndex = useCallback(
    (index: number, options?: { persistPositionMs?: number }) => {
      const track = queueRef.current[index];
      if (!track) {
        return;
      }
      setCurrentTrackState(track);
      setQueueIndex(index);
      queueIndexRef.current = index;
      updateLockScreen(track);
      void persistResumeState(track.id, options?.persistPositionMs ?? 0, true);
    },
    [persistResumeState, updateLockScreen],
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
      syncNativePlaylist(queueRef.current, index);
      playlistRef.current.play();
      applyLockScreen(track);
      void persistResumeState(track.id, 0, true);
    },
    [applyLockScreen, persistResumeState, syncNativePlaylist],
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
        nativeQueueSignatureRef.current = '';
        try {
          playlistRef.current.clear();
          playlistRef.current.clearLockScreenControls();
        } catch {
          // Best-effort teardown when the current track is deleted.
        }
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

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      const tracks = queueRef.current;
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= tracks.length ||
        toIndex >= tracks.length
      ) {
        return;
      }
      const next = moveQueueItem(tracks, fromIndex, toIndex);
      const currentId = currentTrackIdRef.current;
      const newIndex =
        currentId != null
          ? Math.max(
              0,
              next.findIndex((track) => track.id === currentId),
            )
          : 0;
      const wasPlaying = playlistRef.current.playing;
      setQueueState(next);
      queueRef.current = next;
      if (!shuffleRef.current) {
        setOriginalQueue(next);
      }
      setQueueIndex(newIndex);
      queueIndexRef.current = newIndex;
      syncNativePlaylist(next, newIndex);
      if (wasPlaying) {
        playlistRef.current.play();
      }
    },
    [syncNativePlaylist],
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      const tracks = queueRef.current;
      if (index < 0 || index >= tracks.length || index === queueIndexRef.current) {
        return;
      }
      const next = tracks.filter((_, itemIndex) => itemIndex !== index);
      const currentId = currentTrackIdRef.current;
      const newIndex =
        currentId != null
          ? Math.max(
              0,
              next.findIndex((track) => track.id === currentId),
            )
          : 0;
      const wasPlaying = playlistRef.current.playing;
      setQueueState(next);
      queueRef.current = next;
      if (!shuffleRef.current) {
        setOriginalQueue(next);
      }
      setQueueIndex(newIndex);
      queueIndexRef.current = newIndex;
      syncNativePlaylist(next, newIndex);
      if (wasPlaying) {
        playlistRef.current.play();
      }
    },
    [syncNativePlaylist],
  );

  const playQueueIndex = useCallback(
    (index: number) => {
      const track = queueRef.current[index];
      if (!track) {
        return;
      }
      loadAndPlay(track, index);
    },
    [loadAndPlay],
  );

  const setIsPlaying = useCallback(
    (playing: boolean) => {
      if (playing) {
        playlistRef.current.play();
      } else {
        playlistRef.current.pause();
        void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
      }
    },
    [persistResumeState],
  );

  const togglePlayPause = useCallback(() => {
    if (status.playing) {
      playlistRef.current.pause();
      void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
    } else {
      playlistRef.current.play();
    }
  }, [persistResumeState, status.playing]);

  const playNext = useCallback(() => {
    applyPlaylistLoop();
    const active = playlistRef.current;
    if (repeatRef.current === 'one') {
      void active.seekTo(0);
      active.play();
      return;
    }
    // Native next also handles headset / Bluetooth / lock-screen skip.
    active.next();
  }, [applyPlaylistLoop]);

  const playPrevious = useCallback(() => {
    const active = playlistRef.current;
    if (positionMsRef.current > PREVIOUS_RESTART_THRESHOLD_MS) {
      void active.seekTo(0);
      active.play();
      return;
    }
    applyPlaylistLoop();
    active.previous();
  }, [applyPlaylistLoop]);

  const seekToMs = useCallback((positionMs: number) => {
    void playlistRef.current.seekTo(Math.max(0, positionMs) / 1000);
  }, []);

  const setPositionMs = useCallback(
    (positionMs: number) => {
      seekToMs(positionMs);
    },
    [seekToMs],
  );

  const setRepeat = useCallback(
    (next: RepeatMode) => {
      setRepeatState(next);
      repeatRef.current = next;
      applyPlaylistLoop();
    },
    [applyPlaylistLoop],
  );

  const setShuffle = useCallback(
    (enabled: boolean) => {
      setShuffleState(enabled);
      shuffleRef.current = enabled;
      const currentId = queueRef.current[queueIndexRef.current]?.id ?? null;
      const active = playlistRef.current;
      const wasPlaying = active.playing;
      if (enabled) {
        const source = originalQueue.length > 0 ? originalQueue : queueRef.current;
        const shuffled = shuffleTracksKeepingCurrent(source, currentId);
        setQueueState(shuffled);
        queueRef.current = shuffled;
        setQueueIndex(0);
        queueIndexRef.current = 0;
        syncNativePlaylist(shuffled, 0);
        if (wasPlaying) {
          active.play();
        }
        applyPlaylistLoop();
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
      syncNativePlaylist(restored, restoredIndex);
      if (wasPlaying) {
        active.play();
      }
      applyPlaylistLoop();
    },
    [applyPlaylistLoop, originalQueue, syncNativePlaylist],
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

  // Sleep timer: store an absolute end time (not a relative countdown) so we can
  // catch up after AppState backgrounding when JS timers may be delayed/suspended.
  const clearSleepTimeoutOnly = useCallback(() => {
    if (sleepTimeoutRef.current != null) {
      clearTimeout(sleepTimeoutRef.current);
      sleepTimeoutRef.current = null;
    }
  }, []);

  const clearSleepTimer = useCallback(() => {
    clearSleepTimeoutOnly();
    sleepTimerEndsAtRef.current = null;
    setSleepTimerEndsAt(null);
  }, [clearSleepTimeoutOnly]);

  const fireSleepTimer = useCallback(() => {
    clearSleepTimeoutOnly();
    sleepTimerEndsAtRef.current = null;
    setSleepTimerEndsAt(null);
    playlistRef.current.pause();
    void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
  }, [clearSleepTimeoutOnly, persistResumeState]);

  const scheduleSleepTimeout = useCallback(() => {
    clearSleepTimeoutOnly();
    const endsAt = sleepTimerEndsAtRef.current;
    if (endsAt == null) {
      return;
    }
    const delay = Math.max(0, endsAt - Date.now());
    sleepTimeoutRef.current = setTimeout(() => {
      fireSleepTimer();
    }, delay);
  }, [clearSleepTimeoutOnly, fireSleepTimer]);

  const setSleepTimer = useCallback(
    (durationMs: number | null) => {
      if (durationMs == null || durationMs <= 0) {
        clearSleepTimer();
        return;
      }
      const endsAt = Date.now() + durationMs;
      sleepTimerEndsAtRef.current = endsAt;
      setSleepTimerEndsAt(endsAt);
      scheduleSleepTimeout();
    },
    [clearSleepTimer, scheduleSleepTimeout],
  );

  useEffect(() => {
    return () => {
      clearSleepTimeoutOnly();
    };
  }, [clearSleepTimeoutOnly]);

  // Keep React queue index / metadata in sync when native next/previous fires
  // (headset, Bluetooth, lock screen, or playlist.next/previous).
  useEffect(() => {
    const subscription = playlistRef.current.addListener(
      'trackChanged',
      ({ currentIndex }: { currentIndex: number; previousIndex: number }) => {
        if (currentIndex === queueIndexRef.current) {
          return;
        }
        selectTrackAtIndex(currentIndex);
      },
    );
    return () => {
      subscription.remove();
    };
  }, [playlist, selectTrackAtIndex]);

  // Fallback sync if status reports a new index without an event (platform gaps).
  useEffect(() => {
    if (!resumeReadyRef.current) {
      return;
    }
    if (status.currentIndex === queueIndexRef.current) {
      return;
    }
    if (status.currentIndex < 0 || status.currentIndex >= queueRef.current.length) {
      return;
    }
    selectTrackAtIndex(status.currentIndex);
  }, [selectTrackAtIndex, status.currentIndex]);

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
      const seekMs = clampResumePositionMs(saved.positionMs, row.durationMs);

      setCurrentTrackState(track);
      setQueueState([track]);
      setOriginalQueue([track]);
      queueRef.current = [track];
      setQueueIndex(0);
      queueIndexRef.current = 0;
      pendingResumeSeekMsRef.current = seekMs;
      positionMsRef.current = seekMs;

      syncNativePlaylist([track], 0);
      playlistRef.current.pause();
      applyLockScreen(track);
      resumeReadyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [applyLockScreen, db, syncNativePlaylist]);

  // Apply deferred seek once the restored source is loaded; stay paused.
  useEffect(() => {
    const seekMs = pendingResumeSeekMsRef.current;
    if (seekMs == null || !status.isLoaded) {
      return;
    }
    pendingResumeSeekMsRef.current = null;
    void playlistRef.current.seekTo(seekMs / 1000);
    playlistRef.current.pause();
  }, [status.isLoaded]);

  const isPlaying = status.playing;
  const positionMs = Math.round((status.currentTime ?? 0) * 1000);
  useEffect(() => {
    positionMsRef.current = positionMs;
  }, [positionMs]);

  // Re-assert media-session metadata when playback starts so the notification
  // shows title / artist / artwork while audio continues in the background.
  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      return;
    }
    applyLockScreen(currentTrack);
  }, [applyLockScreen, currentTrack, isPlaying]);

  // Throttled position flush while playing; always flush when paused with a track.
  useEffect(() => {
    if (!resumeReadyRef.current || !currentTrack) {
      return;
    }
    void persistResumeState(currentTrack.id, positionMs, !isPlaying);
  }, [currentTrack, isPlaying, persistResumeState, positionMs]);

  // Flush resume on background; keep media notification alive; catch up sleep timer
  // when returning to foreground (JS timers can be delayed while suspended).
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        const endsAt = sleepTimerEndsAtRef.current;
        if (endsAt == null) {
          return;
        }
        if (Date.now() >= endsAt) {
          fireSleepTimer();
          return;
        }
        scheduleSleepTimeout();
        return;
      }
      const track = currentTrackRef.current;
      if (track) {
        applyLockScreen(track);
      }
      void persistResumeState(currentTrackIdRef.current, positionMsRef.current, true);
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [applyLockScreen, fireSleepTimer, persistResumeState, scheduleSleepTimeout]);

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
    sleepTimerEndsAt,
    playTrack,
    setCurrentTrack,
    setQueue,
    reorderQueue,
    removeFromQueue,
    playQueueIndex,
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
    setSleepTimer,
    clearSleepTimer,
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
