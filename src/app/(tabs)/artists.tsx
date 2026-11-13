import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import { ArtistListItem } from '@/components/library/artist-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useLibraryArtists } from '@/hooks/use-library-artists';

export default function ArtistsScreen() {
  const { isGranted } = useAudioLibraryPermission();
  const [query, setQuery] = useState('');
  const { filteredArtists, isLoading, refresh } = useLibraryArtists({
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

  const onPressArtist = useCallback((id: string) => {
    router.push(`/artist/${encodeURIComponent(id)}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredArtists)[number] }) => (
      <ArtistListItem
        id={item.id}
        name={item.name}
        detailLabel={`${item.albumCount} album${item.albumCount === 1 ? '' : 's'} · ${item.trackCount} track${item.trackCount === 1 ? '' : 's'}`}
        onPressId={onPressArtist}
      />
    ),
    [onPressArtist],
  );

  return (
    <LibraryBrowser
      title="Artists"
      statusMessage={
        isGranted
          ? `${filteredArtists.length} artist${filteredArtists.length === 1 ? '' : 's'}`
          : 'Audio permission required'
      }
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search artists"
      data={filteredArtists}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={
        !isGranted
          ? 'Allow audio access'
          : isLoading
            ? 'Loading artists…'
            : query.trim()
              ? 'No matching artists'
              : 'No artists yet'
      }
      emptySubtitle={
        !isGranted
          ? 'Open the Songs tab to grant audio permission and scan.'
          : isLoading
            ? 'Grouped from track tags in SQLite.'
            : query.trim()
              ? 'Try a different artist name.'
              : 'Scan from the Songs tab to build artist groups.'
      }
      refreshing={isLoading}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
}
