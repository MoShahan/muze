import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Album"
      subtitle={`Album detail for ${id}. Art, artist, track list, and play / shuffle will live here.`}
    />
  );
}
