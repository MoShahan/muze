import { createContext, use, useState, type PropsWithChildren } from 'react';

export type RepeatMode = 'off' | 'all' | 'one';

export type PlaybackTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUri?: string | null;
  durationMs?: number;
};

type PlaybackContextValue = {
  currentTrack: PlaybackTrack | null;
  queue: string[];
  queueIndex: number;
  isPlaying: boolean;
  positionMs: number;
  repeat: RepeatMode;
  shuffle: boolean;
  setCurrentTrack: (track: PlaybackTrack | null) => void;
  setQueue: (trackIds: string[], startIndex?: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPositionMs: (positionMs: number) => void;
  setRepeat: (repeat: RepeatMode) => void;
  setShuffle: (shuffle: boolean) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: PropsWithChildren) {
  const [currentTrack, setCurrentTrack] = useState<PlaybackTrack | null>(null);
  const [queue, setQueueState] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);

  const setQueue = (trackIds: string[], startIndex = 0) => {
    setQueueState(trackIds);
    setQueueIndex(startIndex);
  };

  const value: PlaybackContextValue = {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    positionMs,
    repeat,
    shuffle,
    setCurrentTrack,
    setQueue,
    setIsPlaying,
    setPositionMs,
    setRepeat,
    setShuffle,
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
