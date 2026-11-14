/**
 * App-wide library scan + MediaStore change subscription.
 *
 * Keeps scan progress / revision shared so Songs pull-to-refresh, Settings
 * “Rescan library”, and Albums/Artists can all drive one MediaStore walk.
 * Android change events have no incremental payload — debounce then full rescan.
 */
import { addListener } from 'expo-media-library';
import { createContext, use, useEffect, useRef, type PropsWithChildren } from 'react';

import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useAudioLibraryScan } from '@/hooks/use-audio-library-scan';

/** Coalesce bursts of MediaStore notifications before starting another walk. */
const MEDIA_CHANGE_RESCAN_DEBOUNCE_MS = 2000;

type LibraryScanContextValue = ReturnType<typeof useAudioLibraryScan>;

const LibraryScanContext = createContext<LibraryScanContextValue | null>(null);

export function LibraryScanProvider({ children }: PropsWithChildren) {
  const { isGranted } = useAudioLibraryPermission();
  const scan = useAudioLibraryScan({ enabled: isGranted });
  const isScanningRef = useRef(scan.isScanning);
  const pendingRescanRef = useRef(false);
  const rescanRef = useRef(scan.rescan);

  useEffect(() => {
    isScanningRef.current = scan.isScanning;
  }, [scan.isScanning]);

  useEffect(() => {
    rescanRef.current = scan.rescan;
  }, [scan.rescan]);

  // After a scan finishes, run one more if MediaStore changed while scanning.
  useEffect(() => {
    if (scan.isScanning || !pendingRescanRef.current || !isGranted) {
      return;
    }
    pendingRescanRef.current = false;
    void rescanRef.current();
  }, [scan.isScanning, isGranted]);

  useEffect(() => {
    if (!isGranted) {
      pendingRescanRef.current = false;
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const subscription = addListener(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (isScanningRef.current) {
          pendingRescanRef.current = true;
          return;
        }
        void rescanRef.current();
      }, MEDIA_CHANGE_RESCAN_DEBOUNCE_MS);
    });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      subscription.remove();
    };
  }, [isGranted]);

  return <LibraryScanContext.Provider value={scan}>{children}</LibraryScanContext.Provider>;
}

export function useLibraryScan(): LibraryScanContextValue {
  const value = use(LibraryScanContext);
  if (!value) {
    throw new Error('useLibraryScan must be used within LibraryScanProvider');
  }
  return value;
}
