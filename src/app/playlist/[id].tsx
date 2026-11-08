import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Playlist"
      subtitle={`Playlist ${id}. Tracks, add/remove, and play / shuffle will live here.`}
    />
  );
}
