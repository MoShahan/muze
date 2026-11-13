import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { AlbumListItem } from '@/components/library/album-list-item';
import { DetailActions } from '@/components/library/detail-actions';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { AppText } from '@/components/ui/app-text';
import { listAlbumsForArtist, type AlbumRow } from '@/lib/db/albums';
import { getArtistById, type ArtistRow } from '@/lib/db/artists';
import { listTracksForArtist, type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';
import { albumsFromTracks, filterTracksExcludingFolders } from '@/lib/library/hidden-folders';
import { playTrackList } from '@/lib/library/play-tracks';
import { useLibraryVisibility } from '@/store/library-visibility-provider';
import { usePlayback } from '@/store/playback-provider';

type ArtistListRow =
  | { type: 'section'; id: string; title: string }
  | { type: 'album'; id: string; album: AlbumRow }
  | { type: 'track'; id: string; track: CachedTrackRow };

export default function ArtistDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const db = useSQLiteContext();
  const { hiddenFolderPaths, revision: visibilityRevision } = useLibraryVisibility();
  const { playTrack, setQueue } = usePlayback();
  const [artist, setArtist] = useState<ArtistRow | null>(null);
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled || !id) {
        return;
      }
      setIsLoading(true);
      try {
        const nextArtist = await getArtistById(db, id);
        if (!nextArtist) {
          if (!cancelled) {
            setArtist(null);
            setAlbums([]);
            setTracks([]);
          }
          return;
        }
        const nextTracks = filterTracksExcludingFolders(
          await listTracksForArtist(db, nextArtist.name),
          hiddenFolderPaths,
        );
        const nextAlbums =
          hiddenFolderPaths.size === 0
            ? await listAlbumsForArtist(db, nextArtist.name)
            : albumsFromTracks(nextTracks);
        if (!cancelled) {
          setArtist(nextArtist);
          setAlbums(nextAlbums);
          setTracks(nextTracks);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, id, hiddenFolderPaths, visibilityRevision]);

  const listData = useMemo(() => {
    const filteredAlbums = albums.filter(
      (album) =>
        matchesLibraryQuery(album.title, query) || matchesLibraryQuery(album.artist, query),
    );
    const filteredTracks = tracks.filter(
      (track) =>
        matchesLibraryQuery(track.title, query) ||
        matchesLibraryQuery(track.album, query) ||
        matchesLibraryQuery(track.artist, query),
    );

    const rows: ArtistListRow[] = [];
    if (filteredAlbums.length > 0) {
      rows.push({ type: 'section', id: 'section-albums', title: 'Albums' });
      for (const album of filteredAlbums) {
        rows.push({ type: 'album', id: `album-${album.id}`, album });
      }
    }
    if (filteredTracks.length > 0) {
      rows.push({ type: 'section', id: 'section-tracks', title: 'Tracks' });
      for (const track of filteredTracks) {
        rows.push({ type: 'track', id: `track-${track.id}`, track });
      }
    }
    return rows;
  }, [albums, tracks, query]);

  const playFrom = useCallback(
    (startId: string | null, shuffle = false) => {
      const filtered = tracks.filter(
        (track) =>
          matchesLibraryQuery(track.title, query) ||
          matchesLibraryQuery(track.album, query) ||
          matchesLibraryQuery(track.artist, query),
      );
      const source = filtered.length > 0 ? filtered : tracks;
      const ok = playTrackList(source, startId, { playTrack, setQueue }, { shuffle });
      if (ok) {
        router.push('/player');
      }
    },
    [tracks, query, playTrack, setQueue],
  );

  const onPressTrack = useCallback(
    (trackId: string) => {
      playFrom(trackId, false);
    },
    [playFrom],
  );

  const onPressAlbum = useCallback((albumId: string) => {
    router.push(`/album/${encodeURIComponent(albumId)}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ArtistListRow }) => {
      if (item.type === 'section') {
        return (
          <View style={{ paddingTop: 12, paddingBottom: 4 }}>
            <AppText variant="section" tone="muted">
              {item.title}
            </AppText>
          </View>
        );
      }
      if (item.type === 'album') {
        return (
          <AlbumListItem
            id={item.album.id}
            title={item.album.title}
            artist={item.album.artist}
            trackCountLabel={`${item.album.trackCount} track${item.album.trackCount === 1 ? '' : 's'}`}
            artworkUri={item.album.artworkPath}
            onPressId={onPressAlbum}
          />
        );
      }
      return (
        <TrackListItem
          id={item.track.id}
          title={item.track.title}
          artist={item.track.album}
          durationLabel={formatDurationMs(item.track.durationMs)}
          artworkUri={item.track.artworkPath}
          onPressId={onPressTrack}
        />
      );
    },
    [onPressAlbum, onPressTrack],
  );

  return (
    <LibraryBrowser
      title={artist?.name ?? (isLoading ? 'Artist' : 'Artist not found')}
      statusMessage={artist ? `${artist.albumCount} albums · ${artist.trackCount} tracks` : null}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search this artist"
      data={listData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={isLoading ? 'Loading…' : artist ? 'No matching results' : 'Artist missing'}
      emptySubtitle={
        isLoading
          ? 'Reading artist from SQLite.'
          : artist
            ? 'Try a different search.'
            : 'This artist is no longer in the library. Rescan from Songs.'
      }
      onBack={() => router.back()}
      headerExtra={
        artist ? (
          <DetailActions
            disabled={tracks.length === 0}
            onPlay={() => playFrom(tracks[0]?.id ?? null, false)}
            onShuffle={() => playFrom(null, true)}
          />
        ) : null
      }
    />
  );
}
