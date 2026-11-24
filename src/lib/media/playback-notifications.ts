/**
 * Android media-notification access for expo-audio lock-screen controls.
 *
 * Background playback uses expo-audio's foreground MediaSession service. On
 * Android 13+ the shade notification is hidden unless POST_NOTIFICATIONS is
 * granted — request it once when playback is configured.
 */
import { requestNotificationPermissionsAsync } from 'expo-audio';
import { Platform } from 'react-native';

let requestedThisSession = false;

/**
 * Ask for notification permission on Android so the now-playing media
 * notification can appear. No-ops on iOS/web; never throws to callers.
 */
export async function ensurePlaybackNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  if (requestedThisSession) {
    return true;
  }
  requestedThisSession = true;
  try {
    const result = await requestNotificationPermissionsAsync();
    return result.granted === true || result.status === 'granted';
  } catch {
    // Permission APIs can throw on misconfigured builds; playback still works.
    return false;
  }
}
