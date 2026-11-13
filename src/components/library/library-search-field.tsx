import { StyleSheet, TextInput, View } from 'react-native';

import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type LibrarySearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export function LibrarySearchField({ value, onChangeText, placeholder }: LibrarySearchFieldProps) {
  const { colors } = useTheme();

  return (
    <NeoSurface variant="pressed" radius={Radius.md} style={styles.shell}>
      <View style={styles.inner}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={placeholder}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          style={[Typography.body, styles.input, { color: colors.text }]}
        />
      </View>
    </NeoSurface>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  inner: {
    minHeight: 28,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    margin: 0,
  },
});
