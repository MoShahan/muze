import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Folder"
      subtitle={`Folder ${id}. Device-folder track lists will live here.`}
    />
  );
}
