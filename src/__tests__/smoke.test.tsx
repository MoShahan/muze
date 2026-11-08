import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('app smoke test', () => {
  it('renders a muze label', async () => {
    await render(<Text>Muze</Text>);

    expect(screen.getByText('Muze')).toBeOnTheScreen();
  });
});
