/**
 * Stub Android home-screen media widget (Phase 6).
 * Native registration only for now - wire real playback props later.
 */
import { Column, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';

type MuzeNowPlayingProps = {
  title: string;
  artist: string;
  isPlaying: boolean;
};

const MuzeNowPlaying = (props: MuzeNowPlayingProps) => {
  'widget';
  return (
    <Column>
      <Text>{props.title}</Text>
      <Text>{props.artist}</Text>
      <Text>{props.isPlaying ? 'Playing' : 'Paused'}</Text>
    </Column>
  );
};

export default createWidget('MuzeNowPlaying', MuzeNowPlaying, {
  title: 'Muze',
  artist: 'Nothing playing',
  isPlaying: false,
});
