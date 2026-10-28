import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import OnboardingScreen from '../src/screens/OnboardingScreen';

async function dragSlider(testID, x, width = 300) {
  const slider = screen.getByTestId(testID);
  await fireEvent(slider, 'layout', { nativeEvent: { layout: { width, height: 28 } } });
  await fireEvent(slider, 'responderGrant', { nativeEvent: { locationX: x } });
}

describe('OnboardingScreen', () => {
  it('renders an empty configuration', async () => {
    await render(<OnboardingScreen />);

    expect(screen.getByText('Ustaw swój rytm dnia')).toBeTruthy();
    expect(screen.getByText('0 aktywnych')).toBeTruthy();
    expect(screen.getByTestId('notifications-value')).toHaveTextContent('0');
    expect(screen.getAllByText('--:--')).toHaveLength(2);
    expect(screen.getByTestId('push-permission').props.accessibilityState.checked).toBe(false);
    expect(screen.getByTestId('finish-onboarding').props.accessibilityState.disabled).toBe(true);
  });

  it('drags the slider, picks times and returns the completed setup', async () => {
    const onComplete = jest.fn();
    const user = userEvent.setup();
    await render(<OnboardingScreen onComplete={onComplete} />);

    await user.press(screen.getByTestId('category-Jazda autem'));
    await dragSlider('notifications-slider', 300); // far right = 10
    expect(screen.getByTestId('notifications-value')).toHaveTextContent('10');

    await user.press(screen.getByTestId('wake-time'));
    await user.press(screen.getByTestId('hour-7'));
    await user.press(screen.getByTestId('minute-0'));
    await user.press(screen.getByTestId('time-confirm'));
    await user.press(screen.getByTestId('sleep-time'));
    await user.press(screen.getByTestId('hour-23'));
    await user.press(screen.getByTestId('time-confirm'));

    expect(screen.getByText('07:00 AM')).toBeTruthy();
    expect(screen.getByText('11:00 PM')).toBeTruthy();
    expect(screen.getByText('Co ok. 1,5 godziny')).toBeTruthy();

    await user.press(screen.getByTestId('gps-permission'));
    await user.press(screen.getByTestId('finish-onboarding'));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationsCount: 10,
        wakeTime: '07:00',
        sleepTime: '23:00',
        gpsEnabled: true,
        notificationsEnabled: false,
      })
    );
    expect(onComplete.mock.calls[0][0].categories).toEqual([
      expect.objectContaining({ name: 'Jazda autem' }),
    ]);
  });

  it('adds a custom category and selects it', async () => {
    const user = userEvent.setup();
    await render(<OnboardingScreen />);

    await user.press(screen.getByTestId('add-category'));
    await user.press(screen.getByTestId('custom-category-submit'));
    expect(screen.getByText('Podaj nazwę kategorii')).toBeTruthy();

    await user.type(screen.getByTestId('custom-category-input'), 'Siłownia');
    await user.press(screen.getByTestId('custom-color-#0EA5A4'));
    await user.press(screen.getByTestId('custom-category-submit'));

    expect(screen.getByTestId('category-Siłownia')).toBeTruthy();
    expect(screen.getByText('1 aktywnych')).toBeTruthy();
  });
});
