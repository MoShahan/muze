import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import { AlbumListItem } from '@/components/library/album-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
import { LibraryPermissionScreen } from '@/components/library/library-permission-screen';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useLibraryAlbums } from '@/hooks/use-library-albums';

export default function AlbumsScreen() {
  const { isGranted } = useAudioLibraryPermission();
  const [query, setQuery] = useState('');
  const { filteredAlbums, isLoading, refresh } = useLibraryAlbums({
    enabled: isGranted,
    query,
  });

  useFocusEffect(
    useCallback(() => {
      if (isGranted) {
        void refresh();
      }
    }, [isGranted, refresh]),
  );

  const onPressAlbum = useCallback((id: string) => {
    router.push(`/album/${encodeURIComponent(id)}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredAlbums)[number] }) => (
      <AlbumListItem
        id={item.id}
        title={item.title}
        artist={item.artist}
        trackCountLabel={`${item.trackCount} track${item.trackCount === 1 ? '' : 's'}`}
        artworkUri={item.artworkPath}
        onPressId={onPressAlbum}
      />
    ),
    [onPressAlbum],
  );

  if (!isGranted) {
    return <LibraryPermissionScreen title="Albums" />;
  }

  const hasQuery = query.trim().length > 0;

  return (
    <LibraryBrowser
      title="Albums"
      statusMessage={`${filteredAlbums.length} album${filteredAlbums.length === 1 ? '' : 's'}`}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search albums"
      data={filteredAlbums}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={isLoading ? 'Loading albums…' : hasQuery ? 'No matching albums' : 'No albums yet'}
      emptySubtitle={
        isLoading
          ? 'Grouped from track tags in SQLite.'
          : hasQuery
            ? 'Try a different album or artist name.'
            : 'Scan from the Songs tab after adding music on this device.'
      }
      refreshing={isLoading}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
}
