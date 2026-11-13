import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';
import { useLibraryCounts } from '@/hooks/use-library-counts';

export default function AlbumsScreen() {
  const { counts, isLoading } = useLibraryCounts();
  const subtitle = isLoading
    ? 'Loading album groups…'
    : counts.albums === 0
      ? 'Albums appear after a library scan on Songs.'
      : `${counts.albums} album${counts.albums === 1 ? '' : 's'} grouped from tags (${counts.tracks} tracks).`;

  return <ScreenPlaceholder title="Albums" subtitle={subtitle} />;
}
