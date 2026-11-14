import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { getTrackById, type CachedTrackRow, type TrackMetadataUpdate } from '@/lib/db/tracks';
import { deleteTrackEverywhere, saveTrackEdits } from '@/lib/library/apply-track-edit';
import { normalizeFilenameInput } from '@/lib/media/track-file-ops';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

type DraftState = {
  filename: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  trackNumber: string;
  year: string;
  genre: string;
};

function draftFromTrack(track: CachedTrackRow): DraftState {
  return {
    filename: track.filename,
    title: track.title,
    artist: track.artist,
    album: track.album,
    albumArtist: track.albumArtist ?? '',
    trackNumber: track.trackNumber != null ? String(track.trackNumber) : '',
    year: track.year != null ? String(track.year) : '',
    genre: track.genre ?? '',
  };
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function metadataFromDraft(draft: DraftState): TrackMetadataUpdate {
  return {
    title: draft.title.trim() || 'Unknown Track',
    artist: draft.artist.trim() || 'Unknown Artist',
    album: draft.album.trim() || 'Unknown Album',
    albumArtist: draft.albumArtist.trim() || null,
    trackNumber: parseOptionalInt(draft.trackNumber),
    year: parseOptionalInt(draft.year),
    genre: draft.genre.trim() || null,
  };
}

function metadataEquals(a: TrackMetadataUpdate, b: TrackMetadataUpdate): boolean {
  return (
    a.title === b.title &&
    a.artist === b.artist &&
    a.album === b.album &&
    (a.albumArtist ?? null) === (b.albumArtist ?? null) &&
    a.trackNumber === b.trackNumber &&
    a.year === b.year &&
    (a.genre ?? null) === (b.genre ?? null)
  );
}

export default function TrackEditScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTrack, setCurrentTrack, setQueue, queue } = usePlayback();

  const [track, setTrack] = useState<CachedTrackRow | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setTrack(null);
      setDraft(null);
      setLoadError('Missing track id.');
      return;
    }
    const next = await getTrackById(db, id);
    if (!next) {
      setTrack(null);
      setDraft(null);
      setLoadError('Track not found in the library.');
      return;
    }
    setTrack(next);
    setDraft(draftFromTrack(next));
    setLoadError(null);
  }, [db, id]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await refresh();
    })();
  }, [refresh]);

  const baseline = useMemo(() => (track ? draftFromTrack(track) : null), [track]);

  const setField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSave = () => {
    if (!track || !draft || busy) {
      return;
    }

    const metadata = metadataFromDraft(draft);
    const nextFilename = normalizeFilenameInput(draft.filename, track.filename);
    const metadataChanged = !metadataEquals(metadata, {
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArtist: track.albumArtist,
      trackNumber: track.trackNumber,
      year: track.year,
      genre: track.genre,
    });
    const filenameChanged = nextFilename !== track.filename;

    if (!metadataChanged && !filenameChanged) {
      Alert.alert('No changes', 'Edit a field before saving.');
      return;
    }

    setBusy(true);
    void (async () => {
      try {
        const report = await saveTrackEdits(db, {
          track,
          metadata,
          filename: nextFilename,
          metadataChanged,
          filenameChanged,
        });

        const lines: string[] = [];
        if (report.metadata.attempted) {
          lines.push(
            report.metadata.ok
              ? 'Metadata tags saved to the file.'
              : `Metadata failed: ${report.metadata.message ?? 'Unknown error'}`,
          );
        }
        if (report.filename.attempted) {
          lines.push(
            report.filename.ok
              ? 'Filename renamed on disk.'
              : `Rename failed: ${report.filename.message ?? 'Unknown error'}`,
          );
        }

        const allOk =
          (!report.metadata.attempted || report.metadata.ok) &&
          (!report.filename.attempted || report.filename.ok);

        if (allOk) {
          // Keep playback row in sync if this track is loaded.
          if (currentTrack?.id === track.id || currentTrack?.id === report.trackId) {
            const updated = await getTrackById(db, report.trackId);
            if (updated) {
              setCurrentTrack({
                id: updated.id,
                title: updated.title,
                artist: updated.artist,
                album: updated.album,
                artworkUri: updated.artworkPath,
                durationMs: updated.durationMs,
                uri: updated.uri,
              });
              setQueue(
                queue.map((item) =>
                  item.id === track.id || item.id === report.trackId
                    ? {
                        id: updated.id,
                        title: updated.title,
                        artist: updated.artist,
                        album: updated.album,
                        artworkUri: updated.artworkPath,
                        durationMs: updated.durationMs,
                        uri: updated.uri,
                      }
                    : item,
                ),
              );
            }
          }

          Alert.alert('Saved', lines.join('\n'), [
            {
              text: 'OK',
              onPress: () => {
                if (report.trackId !== track.id) {
                  router.replace(`/track/${encodeURIComponent(report.trackId)}/edit` as Href);
                } else {
                  void refresh();
                }
              },
            },
          ]);
        } else {
          Alert.alert('Partial save', lines.join('\n'));
          void refresh();
        }
      } finally {
        setBusy(false);
      }
    })();
  };

  const onDelete = () => {
    if (!track || busy) {
      return;
    }
    Alert.alert(
      'Delete this song?',
      `“${track.title}” will be removed from this device after Android approval. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            void (async () => {
              try {
                const result = await deleteTrackEverywhere(db, track);
                if (!result.ok) {
                  Alert.alert('Delete failed', result.message);
                  return;
                }
                if (currentTrack?.id === track.id) {
                  setCurrentTrack(null);
                  setQueue([]);
                }
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
  ];

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top + Spacing.three,
          paddingBottom: Math.max(insets.bottom, Spacing.three),
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <AppText variant="label">Back</AppText>
        </Pressable>
        <AppText variant="title">Edit track</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save track edits"
          onPress={onSave}
          disabled={busy || !draft}
          hitSlop={8}
        >
          <AppText variant="label" tone={busy ? 'muted' : undefined}>
            {busy ? 'Saving…' : 'Save'}
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loadError ? (
          <AppText variant="body" tone="secondary">
            {loadError}
          </AppText>
        ) : null}

        {draft && baseline ? (
          <>
            <View style={styles.section}>
              <AppText variant="section" tone="muted">
                File on disk
              </AppText>
              <AppText variant="caption" tone="muted">
                Renaming changes the filename only. It does not change the song title tag.
              </AppText>
              <Field
                label="Filename"
                value={draft.filename}
                onChangeText={(value) => setField('filename', value)}
                inputStyle={inputStyle}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.section}>
              <AppText variant="section" tone="muted">
                Metadata tags
              </AppText>
              <AppText variant="caption" tone="muted">
                Saving these writes embedded tags only. The filename on disk stays the same.
              </AppText>
              <Field
                label="Title"
                value={draft.title}
                onChangeText={(value) => setField('title', value)}
                inputStyle={inputStyle}
              />
              <Field
                label="Artist"
                value={draft.artist}
                onChangeText={(value) => setField('artist', value)}
                inputStyle={inputStyle}
              />
              <Field
                label="Album"
                value={draft.album}
                onChangeText={(value) => setField('album', value)}
                inputStyle={inputStyle}
              />
              <Field
                label="Album artist"
                value={draft.albumArtist}
                onChangeText={(value) => setField('albumArtist', value)}
                inputStyle={inputStyle}
              />
              <Field
                label="Track number"
                value={draft.trackNumber}
                onChangeText={(value) => setField('trackNumber', value)}
                inputStyle={inputStyle}
                keyboardType="number-pad"
              />
              <Field
                label="Year"
                value={draft.year}
                onChangeText={(value) => setField('year', value)}
                inputStyle={inputStyle}
                keyboardType="number-pad"
              />
              <Field
                label="Genre"
                value={draft.genre}
                onChangeText={(value) => setField('genre', value)}
                inputStyle={inputStyle}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete song from device"
              onPress={onDelete}
              disabled={busy}
            >
              <NeoSurface variant="pressed" radius={Radius.md} style={styles.deleteButton}>
                <AppText variant="label">Delete from device</AppText>
              </NeoSurface>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  inputStyle: object[];
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'number-pad';
};

function Field({
  label,
  value,
  onChangeText,
  inputStyle,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        style={inputStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.half,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
});
