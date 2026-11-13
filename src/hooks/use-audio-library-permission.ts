import { usePermissions } from 'expo-media-library';
import { useCallback, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  AUDIO_GRANULAR_PERMISSIONS,
  canRequestAudioPermissionAgain,
  isAudioPermissionGranted,
  isAudioPermissionUndetermined,
  openAppSettings,
} from '@/lib/media/permissions';

export function useAudioLibraryPermission() {
  const [permission, requestPermission, getPermission] = usePermissions({
    writeOnly: false,
    granularPermissions: AUDIO_GRANULAR_PERMISSIONS,
  });

  const refresh = useCallback(async () => {
    return getPermission();
  }, [getPermission]);

  const request = useCallback(async () => {
    return requestPermission();
  }, [requestPermission]);

  const openSettings = useCallback(async () => {
    await openAppSettings();
  }, []);

  // Re-check when returning from system Settings.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void refresh();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refresh]);

  return {
    permission,
    isLoading: permission === null,
    isGranted: isAudioPermissionGranted(permission),
    isUndetermined: isAudioPermissionUndetermined(permission),
    canAskAgain: canRequestAudioPermissionAgain(permission),
    request,
    refresh,
    openSettings,
  };
}
