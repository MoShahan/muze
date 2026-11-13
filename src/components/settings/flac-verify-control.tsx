import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
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

  return (
    <NeoCard style={styles.card}>
      <View style={styles.copy}>
        <NeoCard.Title>Verify FLAC tags</NeoCard.Title>
        <NeoCard.Subtitle>
          Checks Vorbis comments and embedded album art on a sample of FLAC files from this device.
        </NeoCard.Subtitle>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Verify FLAC tag and album art parsing"
        onPress={() => {
          void onPress();
        }}
        disabled={busy || isLoading}
      >
        <NeoSurface variant="pressed" radius={Radius.md} style={styles.action}>
          <AppText variant="label">
            {busy
              ? `Checking… ${progress}`
              : !isGranted
                ? 'Allow audio access first'
                : 'Run FLAC verification'}
          </AppText>
        </NeoSurface>
      </Pressable>

      {errorMessage ? (
        <AppText variant="caption" tone="muted">
          {errorMessage}
        </AppText>
      ) : null}

      {report ? <ReportSummary report={report} /> : null}
    </NeoCard>
  );
}

function ReportSummary({ report }: { report: FlacVerifyReport }) {
  if (report.examined === 0) {
    return (
      <AppText variant="caption" tone="muted">
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
  card: {
    gap: Spacing.three,
  },
  copy: {
    gap: Spacing.half,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  report: {
    gap: Spacing.one,
  },
});
