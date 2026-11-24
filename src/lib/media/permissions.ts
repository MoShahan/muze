import * as Linking from 'expo-linking';
import {
  PermissionStatus,
  type GranularPermission,
  type PermissionResponse,
} from 'expo-media-library';

/** Android 13+ granular access: audio only - never photo/video. */
export const AUDIO_GRANULAR_PERMISSIONS: GranularPermission[] = ['audio'];

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

export function isAudioPermissionGranted(response: PermissionResponse | null | undefined): boolean {
  return response?.status === PermissionStatus.GRANTED || response?.granted === true;
}

export function isAudioPermissionUndetermined(
  response: PermissionResponse | null | undefined,
): boolean {
  return response?.status === PermissionStatus.UNDETERMINED;
}

export function canRequestAudioPermissionAgain(
  response: PermissionResponse | null | undefined,
): boolean {
  if (!response) {
    return true;
  }
  if (response.status === PermissionStatus.GRANTED) {
    return false;
  }
  return response.canAskAgain !== false;
}
