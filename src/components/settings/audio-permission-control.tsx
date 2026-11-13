import { useState } from 'react';

import { SettingsRow } from '@/components/settings/settings-row';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';

function statusLabel(isLoading: boolean, isGranted: boolean, canAskAgain: boolean): string {
  if (isLoading) {
    return 'Checking…';
  }
  if (isGranted) {
    return 'Allowed';
  }
  if (!canAskAgain) {
    return 'Blocked';
  }
  return 'Not allowed';
}

export function AudioPermissionControl() {
  const { isLoading, isGranted, canAskAgain, request, openSettings } = useAudioLibraryPermission();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy || isLoading) {
      return;
    }
    setBusy(true);
    try {
      if (isGranted) {
        await openSettings();
        return;
      }
      if (canAskAgain) {
        await request();
        return;
      }
      await openSettings();
    } finally {
      setBusy(false);
    }
  };

  const detail = statusLabel(isLoading, isGranted, canAskAgain);
  const hint = isGranted
    ? 'Tap to manage in system Settings'
    : canAskAgain
      ? 'Tap to allow audio-only access'
      : 'Tap to open system Settings';

  return (
    <SettingsRow
      title="Audio permission"
      detail={busy ? '…' : detail}
      hint={hint}
      accessibilityLabel={`Audio permission: ${detail}. ${hint}`}
      onPress={() => {
        void onPress();
      }}
    />
  );
}
