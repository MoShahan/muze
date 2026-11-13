import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { verifyFlacTagAndArtParsing, type FlacVerifyReport } from '@/lib/metadata/verify-flac';

export function FlacVerifyControl() {
  const { isGranted, isLoading, canAskAgain, request, openSettings } = useAudioLibraryPermission();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<FlacVerifyReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPress = async () => {
    if (busy || isLoading) {
      return;
    }

    if (!isGranted) {
      if (canAskAgain) {
        await request();
      } else {
        await openSettings();
      }
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setProgress(0);
    setReport(null);
    try {
      const next = await verifyFlacTagAndArtParsing({
        onProgress: setProgress,
      });
      setReport(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'FLAC verification failed';
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  };

  const actionLabel = busy
    ? `Checking… ${progress}`
    : !isGranted
      ? 'Allow audio access first'
      : 'Run FLAC verification';

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Verify FLAC tag and album art parsing"
        onPress={() => {
          void onPress();
        }}
        disabled={busy || isLoading}
        style={styles.row}
      >
        <View style={styles.copy}>
          <AppText variant="bodyStrong">Verify FLAC tags</AppText>
          <AppText variant="caption" tone="muted">
            Checks Vorbis comments and embedded album art on a sample of FLAC files from this
            device.
          </AppText>
        </View>
        <AppText variant="label" tone="secondary">
          {actionLabel}
        </AppText>
      </Pressable>

      {errorMessage ? (
        <AppText variant="caption" tone="muted" style={styles.meta}>
          {errorMessage}
        </AppText>
      ) : null}

      {report ? <ReportSummary report={report} /> : null}
    </View>
  );
}

function ReportSummary({ report }: { report: FlacVerifyReport }) {
  if (report.examined === 0) {
    return (
      <AppText variant="caption" tone="muted" style={styles.meta}>
        No FLAC files found in the media library sample.
      </AppText>
    );
  }

  return (
    <View style={styles.report}>
      <AppText variant="caption" tone="secondary">
        Examined {report.examined} FLAC · Vorbis OK {report.vorbisTagsOk} · Art found{' '}
        {report.embeddedArtFound} · Fallback-only {report.parseFallbackOnly}
      </AppText>
      {report.samples.map((sample) => (
        <AppText key={sample.filename} variant="caption" tone="muted">
          {sample.title} · {sample.artist}
          {sample.hasVorbis ? ' · vorbis' : ''}
          {sample.hasEmbeddedArt
            ? ` · art ${sample.artFormat ?? 'yes'} (${sample.artByteLength ?? 0} B)`
            : ' · no art'}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  meta: {
    paddingBottom: Spacing.two,
  },
  report: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
});
