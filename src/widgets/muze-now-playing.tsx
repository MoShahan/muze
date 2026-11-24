/**
 * Android home-screen media widget (Muze Now Playing).
 *
 * Layout runs in an isolated Hermes runtime: Expo UI Jetpack Compose only,
 * no hooks / app imports / async work. Playback state arrives via props from
 * `updateSnapshot`; button taps use `target` + `onPress` (optimistic UI) and
 * `addUserInteractionListener` in the app process to drive real transport.
 *
 * Keep render-time values inside the `'widget'` function — outer module
 * bindings are not available in the isolated widget bundle.
 */
import { Box, Column, Image, Row, Text, TextButton } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxHeight,
  fillMaxSize,
  fillMaxWidth,
  height,
  paddingAll,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import { type ReactElement, type ReactNode } from 'react';

export const MUZE_NOW_PLAYING_WIDGET_NAME = 'MuzeNowPlaying';

export type MuzeNowPlayingProps = {
  title: string;
  artist: string;
  isPlaying: boolean;
  /** Shared `widgetsDirectory` file URI, or empty when no art. */
  artworkUri: string;
  hasTrack: boolean;
};

export const INITIAL_MUZE_NOW_PLAYING_PROPS: MuzeNowPlayingProps = {
  title: 'Muze',
  artist: 'Nothing playing',
  isPlaying: false,
  artworkUri: '',
  hasTrack: false,
};

/** Compose Button + widget interaction props (`target` / `onPress`). */
type WidgetControlProps = {
  target: string;
  enabled?: boolean;
  colors?: { contentColor?: string };
  onPress: () => MuzeNowPlayingProps;
  children: ReactNode;
};

const MuzeNowPlaying = (props: MuzeNowPlayingProps, environment: WidgetEnvironment) => {
  'widget';

  const isDark = environment.colorScheme === 'dark';
  const canvas = isDark ? '#1C1E22' : '#E6E9EF';
  const surface = isDark ? '#25282D' : '#EEF1F6';
  const textColor = isDark ? '#E8E8EA' : '#2A2D33';
  const muted = isDark ? '#9A9DA3' : '#6B7078';
  const accent = isDark ? '#D4D4D6' : '#3A3D44';

  const title = props.hasTrack ? props.title : 'Muze';
  const artist = props.hasTrack ? props.artist : 'Nothing playing';
  const playLabel = props.isPlaying ? 'Pause' : 'Play';

  const renderControl = (control: WidgetControlProps): ReactElement => (
    <TextButton
      enabled={control.enabled}
      colors={control.colors}
      {...({
        target: control.target,
        onPress: control.onPress,
      } as object)}
    >
      {control.children}
    </TextButton>
  );

  return (
    <Column
      modifiers={[fillMaxSize(), background(canvas), paddingAll(12)]}
      verticalArrangement={{ spacedBy: 10 }}
      horizontalArrangement="center"
    >
      <Row
        modifiers={[fillMaxWidth()]}
        horizontalArrangement={{ spacedBy: 12 }}
        verticalAlignment="center"
      >
        <Box modifiers={[size(64, 64), cornerRadius(10), background(surface)]}>
          {props.artworkUri ? (
            <Image
              source={{ uri: props.artworkUri }}
              contentScale="crop"
              contentDescription="Album art"
              modifiers={[fillMaxSize(), cornerRadius(10)]}
            />
          ) : (
            <Column
              modifiers={[fillMaxSize()]}
              horizontalArrangement="center"
              verticalArrangement="center"
            >
              <Text color={muted} style={{ fontSize: 22 }}>
                ♪
              </Text>
            </Column>
          )}
        </Box>

        <Column
          modifiers={[fillMaxWidth(), fillMaxHeight()]}
          verticalArrangement="center"
          horizontalArrangement={{ spacedBy: 2 }}
        >
          <Text
            color={textColor}
            maxLines={1}
            overflow="ellipsis"
            style={{ fontSize: 15, fontWeight: '600' }}
          >
            {title}
          </Text>
          <Text
            color={muted}
            maxLines={1}
            overflow="ellipsis"
            style={{ fontSize: 12, fontWeight: '400' }}
          >
            {artist}
          </Text>
        </Column>
      </Row>

      <Row
        modifiers={[fillMaxWidth(), height(40)]}
        horizontalArrangement="spaceEvenly"
        verticalAlignment="center"
      >
        {renderControl({
          target: 'playPrevious',
          enabled: props.hasTrack,
          colors: { contentColor: accent },
          onPress: () => props,
          children: (
            <Text color={accent} style={{ fontSize: 13, fontWeight: '600' }}>
              Prev
            </Text>
          ),
        })}
        {renderControl({
          target: 'togglePlay',
          enabled: props.hasTrack,
          colors: { contentColor: accent },
          onPress: () => ({
            ...props,
            isPlaying: !props.isPlaying,
          }),
          children: (
            <Text color={accent} style={{ fontSize: 14, fontWeight: '700' }}>
              {playLabel}
            </Text>
          ),
        })}
        {renderControl({
          target: 'playNext',
          enabled: props.hasTrack,
          colors: { contentColor: accent },
          onPress: () => props,
          children: (
            <Text color={accent} style={{ fontSize: 13, fontWeight: '600' }}>
              Next
            </Text>
          ),
        })}
      </Row>
    </Column>
  );
};

export default createWidget(
  MUZE_NOW_PLAYING_WIDGET_NAME,
  MuzeNowPlaying,
  INITIAL_MUZE_NOW_PLAYING_PROPS,
);
