import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import { AlbumListItem } from '@/components/library/album-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
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

  return (
    <LibraryBrowser
      title="Albums"
      statusMessage={
        isGranted
          ? `${filteredAlbums.length} album${filteredAlbums.length === 1 ? '' : 's'}`
          : 'Audio permission required'
      }
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search albums"
      data={filteredAlbums}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={
        !isGranted
          ? 'Allow audio access'
          : isLoading
            ? 'Loading albums…'
            : query.trim()
              ? 'No matching albums'
              : 'No albums yet'
      }
      emptySubtitle={
        !isGranted
          ? 'Open the Songs tab to grant audio permission and scan.'
          : isLoading
            ? 'Grouped from track tags in SQLite.'
            : query.trim()
              ? 'Try a different album or artist name.'
              : 'Scan from the Songs tab to build album groups.'
      }
      refreshing={isLoading}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
}
