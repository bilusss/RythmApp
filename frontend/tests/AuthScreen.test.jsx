import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import AuthScreen from '../src/screens/AuthScreen';

describe('AuthScreen', () => {
  it('renders login screen correctly with logo and default texts', async () => {
    await render(<AuthScreen />);

    expect(screen.getByTestId('app-logo')).toBeTruthy();
    expect(screen.getByText('Witaj w Rytm')).toBeTruthy();
    expect(screen.getByText('Zaloguj się, aby śledzić swój dzień.')).toBeTruthy();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByText('Nie pamiętasz hasła?')).toBeTruthy();
    expect(screen.getByTestId('submit-auth-button')).toBeTruthy();
  });

  it('switches to registration mode and back', async () => {
    const user = userEvent.setup();
    await render(<AuthScreen />);

    // Click registration tab
    await user.press(screen.getByTestId('tab-register'));

    expect(screen.getByText('Załóż konto')).toBeTruthy();
    expect(screen.queryByText('Nie pamiętasz hasła?')).toBeNull();
    expect(screen.getByText('Masz już konto? ')).toBeTruthy();

    // Click switch back to login
    await user.press(screen.getByTestId('switch-to-login'));
    expect(screen.getByText('Zaloguj się')).toBeTruthy();
    expect(screen.getByText('Nie pamiętasz hasła?')).toBeTruthy();
  });

  it('validates email and password inputs before submit', async () => {
    const mockAuthSuccess = jest.fn();
    const user = userEvent.setup();
    await render(<AuthScreen onAuthSuccess={mockAuthSuccess} />);

    await user.press(screen.getByTestId('submit-auth-button'));

    expect(screen.getByText('Podaj adres e-mail')).toBeTruthy();
    expect(screen.getByText('Wprowadź hasło')).toBeTruthy();
    expect(mockAuthSuccess).not.toHaveBeenCalled();

    // Enter invalid email and short password (< 8 chars)
    await user.type(screen.getByTestId('email-input'), 'invalid-email');
    await user.type(screen.getByTestId('password-input'), '12345');
    await user.press(screen.getByTestId('submit-auth-button'));

    expect(screen.getByText('Nieprawidłowy format adresu e-mail')).toBeTruthy();
    expect(screen.getByText('Hasło musi mieć co najmniej 8 znaków')).toBeTruthy();
    expect(mockAuthSuccess).not.toHaveBeenCalled();
  });

  it('calls onAuthSuccess when form is valid', async () => {
    const mockAuthSuccess = jest.fn();
    const user = userEvent.setup();
    await render(<AuthScreen onAuthSuccess={mockAuthSuccess} />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.press(screen.getByTestId('submit-auth-button'));

    expect(mockAuthSuccess).toHaveBeenCalledWith({
      mode: 'login',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('toggles password visibility when clicking eye icon', async () => {
    const user = userEvent.setup();
    await render(<AuthScreen />);

    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    const toggleBtn = screen.getByTestId('password-input-toggle-visibility');
    await user.press(toggleBtn);

    expect(passwordInput.props.secureTextEntry).toBe(false);
  });
});
