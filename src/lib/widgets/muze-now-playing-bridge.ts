/**
 * Pushes now-playing state into the Android home-screen widget and mirrors
 * widget button taps back into the in-app playback transport.
 */
import { Directory, File } from 'expo-file-system';
import { addUserInteractionListener, widgetsDirectory } from 'expo-widgets';
import { Platform } from 'react-native';

import { artworkDisplayUri } from '@/lib/db/tracks';
import MuzeNowPlayingWidget, {
  INITIAL_MUZE_NOW_PLAYING_PROPS,
  MUZE_NOW_PLAYING_WIDGET_NAME,
  type MuzeNowPlayingProps,
} from '@/widgets/muze-now-playing';

import type { PlaybackTrack } from '@/store/playback-provider';
import type { EventSubscription } from 'expo';

const WIDGET_ART_FILENAME = 'muze-now-playing-art.jpg';

function widgetArtFile(): File | null {
  if (Platform.OS !== 'android' || !widgetsDirectory) {
    return null;
  }
  try {
    const dir = new Directory(widgetsDirectory);
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
    return new File(dir, WIDGET_ART_FILENAME);
  } catch {
    return null;
  }
}

/**
 * Copy current artwork into the shared widgets directory so Glance can read it.
 * Returns a file:// URI, or '' when missing / copy fails.
 */
async function syncWidgetArtwork(artworkUri: string | null | undefined): Promise<string> {
  const displayUri = artworkDisplayUri(artworkUri);
  const dest = widgetArtFile();
  if (!displayUri || !dest) {
    return '';
  }

  try {
    const sourcePath = displayUri.startsWith('file://')
      ? displayUri.replace(/^file:\/\//, '')
      : displayUri;
    const source = new File(sourcePath);
    if (!source.exists) {
      return '';
    }
    if (dest.exists) {
      dest.delete();
    }
    source.copy(dest);
    return dest.uri;
  } catch {
    return '';
  }
}

export async function publishMuzeNowPlayingWidget(input: {
  track: PlaybackTrack | null;
  isPlaying: boolean;
}): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const track = input.track;
  if (!track) {
    MuzeNowPlayingWidget.updateSnapshot(INITIAL_MUZE_NOW_PLAYING_PROPS);
    return;
  }

  const artworkUri = await syncWidgetArtwork(track.artworkUri);
  const props: MuzeNowPlayingProps = {
    title: track.title || 'Unknown title',
    artist: track.artist || 'Unknown artist',
    isPlaying: input.isPlaying,
    artworkUri,
    hasTrack: true,
  };
  MuzeNowPlayingWidget.updateSnapshot(props);
}

export type MuzeNowPlayingTransport = {
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
};

/** Listen for widget Prev / Play-Pause / Next while the app process is alive. */
export function subscribeMuzeNowPlayingWidgetInteractions(
  transport: MuzeNowPlayingTransport,
): EventSubscription | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  return addUserInteractionListener((event) => {
    if (event.source !== MUZE_NOW_PLAYING_WIDGET_NAME) {
      return;
    }
    switch (event.target) {
      case 'togglePlay':
        transport.togglePlayPause();
        break;
      case 'playNext':
        transport.playNext();
        break;
      case 'playPrevious':
        transport.playPrevious();
        break;
      default:
        break;
    }
  });
}
