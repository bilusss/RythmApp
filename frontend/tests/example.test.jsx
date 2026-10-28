import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('Example test suite', () => {
  it('renders text correctly', async () => {
    const { getByText } = await render(<Text>Hello RythmApp</Text>);
    expect(getByText('Hello RythmApp')).toBeTruthy();
  });
});
