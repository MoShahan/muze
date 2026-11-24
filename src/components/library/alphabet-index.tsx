import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { ALPHABET_INDEX_LETTERS, resolveAlphabetScrollIndex } from '@/lib/library/alphabet-index';
import { useTheme } from '@/store/theme-provider';

const RAIL_WIDTH = 22;
const BUBBLE_SIZE = 56;

type AlphabetIndexProps = {
  indexMap: ReadonlyMap<string, number>;
  onSelectLetter: (index: number) => void;
  /** Distance from the top of the parent to the start of the list area. */
  topOffset: number;
};

export function AlphabetIndex({ indexMap, onSelectLetter, topOffset }: AlphabetIndexProps) {
  const { colors } = useTheme();
  const [railHeight, setRailHeight] = useState(0);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const letterCount = ALPHABET_INDEX_LETTERS.length;

  const selectFromY = useCallback(
    (y: number, height: number) => {
      if (height <= 0) {
        return;
      }
      const clamped = Math.max(0, Math.min(height - 1, y));
      const letterIndex = Math.min(
        letterCount - 1,
        Math.max(0, Math.floor((clamped / height) * letterCount)),
      );
      const letter = ALPHABET_INDEX_LETTERS[letterIndex]!;
      setActiveLetter(letter);
      const scrollIndex = resolveAlphabetScrollIndex(letter, indexMap);
      if (scrollIndex != null) {
        onSelectLetter(scrollIndex);
      }
    },
    [indexMap, letterCount, onSelectLetter],
  );

  const clearActive = useCallback(() => {
    setActiveLetter(null);
  }, []);

  const handleGestureY = useCallback(
    (y: number) => {
      selectFromY(y, railHeight);
    },
    [railHeight, selectFromY],
  );

  const pan = usePanGesture({
    onBegin: (event) => {
      scheduleOnRN(handleGestureY, event.y);
    },
    onUpdate: (event) => {
      scheduleOnRN(handleGestureY, event.y);
    },
    onFinalize: () => {
      scheduleOnRN(clearActive);
    },
  });

  const tap = useTapGesture({
    onBegin: (event) => {
      scheduleOnRN(handleGestureY, event.y);
    },
    onFinalize: () => {
      scheduleOnRN(clearActive);
    },
  });

  const gesture = useSimultaneousGestures(pan, tap);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setRailHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <>
      {activeLetter ? (
        <View style={[styles.bubbleWrap, { top: topOffset }]} pointerEvents="none">
          <NeoSurface variant="raised" radius={Radius.lg} style={styles.bubble}>
            <AppText variant="display">{activeLetter}</AppText>
          </NeoSurface>
        </View>
      ) : null}

      <View
        style={[styles.railHost, { top: topOffset, backgroundColor: colors.canvas }]}
        pointerEvents="box-none"
        collapsable={false}
      >
        <GestureDetector gesture={gesture}>
          <View
            style={styles.rail}
            onLayout={onLayout}
            accessibilityRole="adjustable"
            accessibilityLabel="Alphabet index"
            accessibilityHint="Drag to jump to a letter"
          >
            {ALPHABET_INDEX_LETTERS.map((letter) => {
              const hasItems = indexMap.has(letter);
              const isActive = activeLetter === letter;
              return (
                <AppText
                  key={letter}
                  variant="caption"
                  tone={isActive ? 'accent' : hasItems ? 'secondary' : 'muted'}
                  style={styles.letter}
                  importantForAccessibility="no"
                >
                  {letter}
                </AppText>
              );
            })}
          </View>
        </GestureDetector>
      </View>
    </>
  );
}

export const ALPHABET_INDEX_RAIL_WIDTH = RAIL_WIDTH;

const styles = StyleSheet.create({
  railHost: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    zIndex: 2,
  },
  rail: {
    flex: 1,
    width: RAIL_WIDTH,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  letter: {
    fontSize: 10,
    lineHeight: 11,
    textAlign: 'center',
  },
  bubbleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
