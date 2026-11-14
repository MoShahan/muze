import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import { ArtistListItem } from '@/components/library/artist-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
import { LibraryPermissionScreen } from '@/components/library/library-permission-screen';
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

  if (!isGranted) {
    return <LibraryPermissionScreen title="Artists" />;
  }

  const hasQuery = query.trim().length > 0;

  return (
    <LibraryBrowser
      title="Artists"
      statusMessage={`${filteredArtists.length} artist${filteredArtists.length === 1 ? '' : 's'}`}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search artists"
      data={filteredArtists}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={
        isLoading ? 'Loading artists…' : hasQuery ? 'No matching artists' : 'No artists yet'
      }
      emptySubtitle={
        isLoading
          ? 'Grouped from track tags in SQLite.'
          : hasQuery
            ? 'Try a different artist name.'
            : 'Scan from the Songs tab after adding music on this device.'
      }
      refreshing={isLoading}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
}
