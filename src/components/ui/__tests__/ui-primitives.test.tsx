import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoIconButton } from '@/components/ui/neo-icon-button';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Colors } from '@/constants/theme';

jest.mock('@/store/theme-provider', () => {
  const { Colors: mockColors } = require('@/constants/theme');
  return {
    useTheme: () => ({
      preference: 'light' as const,
      setPreference: jest.fn(),
      theme: 'light' as const,
      colors: mockColors.light,
      isDark: false,
    }),
  };
});

describe('AppText', () => {
  it('renders body copy by default', async () => {
    await render(<AppText>Hello Muze</AppText>);
    expect(screen.getByText('Hello Muze')).toBeOnTheScreen();
  });

  it('applies muted tone color from theme tokens', async () => {
    await render(
      <AppText tone="muted" variant="caption">
        Quiet
      </AppText>,
    );
    expect(screen.getByText('Quiet')).toHaveStyle({ color: Colors.light.textMuted });
  });

  it('applies display typography metrics', async () => {
    await render(<AppText variant="display">Title</AppText>);
    expect(screen.getByText('Title')).toHaveStyle({
      fontSize: 28,
      fontWeight: '700',
      color: Colors.light.text,
    });
  });
});

describe('NeoSurface', () => {
  it('renders children', async () => {
    await render(
      <NeoSurface>
        <Text>Surface child</Text>
      </NeoSurface>,
    );
    expect(screen.getByText('Surface child')).toBeOnTheScreen();
  });

  it.each([
    ['raised', Colors.light.surfaceRaised],
    ['pressed', Colors.light.surfacePressed],
    ['flat', Colors.light.surface],
    ['ghost', 'transparent'],
  ] as const)('uses %s background from theme', async (variant, backgroundColor) => {
    const view = await render(
      <NeoSurface variant={variant}>
        <Text>{variant}</Text>
      </NeoSurface>,
    );

    const tree = view.toJSON();
    expect(tree).toMatchObject({
      props: {
        style: expect.arrayContaining([expect.objectContaining({ backgroundColor })]),
      },
    });
  });
});

describe('NeoCard', () => {
  it('renders title and subtitle helpers', async () => {
    await render(
      <NeoCard>
        <NeoCard.Title>Albums</NeoCard.Title>
        <NeoCard.Subtitle>From your library</NeoCard.Subtitle>
      </NeoCard>,
    );

    expect(screen.getByText('Albums')).toBeOnTheScreen();
    expect(screen.getByText('From your library')).toBeOnTheScreen();
    expect(screen.getByText('From your library')).toHaveStyle({
      color: Colors.light.textMuted,
    });
  });
});

describe('NeoIconButton', () => {
  it('exposes an accessibility label and invokes onPress', async () => {
    const onPress = jest.fn();
    await render(<NeoIconButton label="Play" icon="play" onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('Play'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
