import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Artist"
      subtitle={`Artist detail for ${id}. Albums and tracks will live here.`}
    />
  );
}
