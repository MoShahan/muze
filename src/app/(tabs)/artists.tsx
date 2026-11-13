import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';
import { useLibraryCounts } from '@/hooks/use-library-counts';

export default function ArtistsScreen() {
  const { counts, isLoading } = useLibraryCounts();
  const subtitle = isLoading
    ? 'Loading artist groups…'
    : counts.artists === 0
      ? 'Artists appear after a library scan on Songs.'
      : `${counts.artists} artist${counts.artists === 1 ? '' : 's'} grouped from tags (${counts.tracks} tracks).`;

  return <ScreenPlaceholder title="Artists" subtitle={subtitle} />;
}
