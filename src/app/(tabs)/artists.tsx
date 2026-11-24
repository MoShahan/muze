import { useFocusEffect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { ArtistListItem } from '@/components/library/artist-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
import { LibraryPermissionScreen } from '@/components/library/library-permission-screen';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useLibraryArtists } from '@/hooks/use-library-artists';
import { formatCountLabel } from '@/lib/library/filter';
import { useLibraryScan } from '@/store/library-scan-provider';

import type { ArtistRow } from '@/lib/db/artists';

export default function ArtistsScreen() {
  const { isGranted } = useAudioLibraryPermission();
  const { libraryRevision, isScanning, rescan } = useLibraryScan();
  const [query, setQuery] = useState('');
  const { filteredArtists, isLoading, refresh } = useLibraryArtists({
    enabled: isGranted,
    revision: libraryRevision,
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
        detailLabel={`${formatCountLabel(item.albumCount, 'album')} · ${formatCountLabel(item.trackCount, 'track')}`}
        onPressId={onPressArtist}
      />
    ),
    [onPressArtist],
  );

  const hasQuery = query.trim().length > 0;
  const getAlphabetLabel = useMemo(() => {
    if (hasQuery) {
      return undefined;
    }
    return (artist: ArtistRow) => artist.name;
  }, [hasQuery]);

  if (!isGranted) {
    return <LibraryPermissionScreen title="Artists" />;
  }

  return (
    <LibraryBrowser
      title="Artists"
      statusMessage={formatCountLabel(filteredArtists.length, 'artist')}
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
            : 'Add music on this device, then pull to refresh or rescan in Settings.'
      }
      refreshing={isScanning}
      onRefresh={() => {
        void rescan();
      }}
      getAlphabetLabel={getAlphabetLabel}
    />
  );
}
