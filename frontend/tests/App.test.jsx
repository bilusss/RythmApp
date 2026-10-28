import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import App from '../App';

describe('App flow', () => {
  it('goes from sign-up through onboarding to an empty dashboard, then saves a check-in', async () => {
    const user = userEvent.setup();
    await render(<App />);

    await user.type(screen.getByTestId('email-input'), 'ty@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.press(screen.getByTestId('submit-auth-button'));

    await user.press(screen.getByTestId('category-Praca'));
    const slider = screen.getByTestId('notifications-slider');
    await fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 300, height: 28 } } });
    await fireEvent(slider, 'responderGrant', { nativeEvent: { locationX: 300 } });
    await user.press(screen.getByTestId('wake-time'));
    await user.press(screen.getByTestId('hour-7'));
    await user.press(screen.getByTestId('time-confirm'));
    await user.press(screen.getByTestId('sleep-time'));
    await user.press(screen.getByTestId('hour-23'));
    await user.press(screen.getByTestId('time-confirm'));
    await user.press(screen.getByTestId('finish-onboarding'));

    expect(screen.getByText('Twój dzień')).toBeTruthy();
    expect(screen.getByTestId('checkin-count')).toHaveTextContent('0 check-inów');

    await user.press(screen.getByTestId('nav-add'));
    await user.press(screen.getByTestId('checkin-category-Praca'));
    await user.press(screen.getByTestId('mood-5'));
    await user.press(screen.getByTestId('save-checkin'));

    expect(await screen.findByTestId('checkin-count')).toHaveTextContent('1 check-in');

    await user.press(screen.getByTestId('nav-history'));
    expect(screen.getByTestId('entry-1')).toBeTruthy();

    await user.press(screen.getByTestId('nav-profile'));
    expect(screen.getByTestId('stat-checkins')).toHaveTextContent('1');
    await user.press(screen.getByTestId('logout'));
    expect(screen.getByText('Witaj w Rytm')).toBeTruthy();
  });
});
