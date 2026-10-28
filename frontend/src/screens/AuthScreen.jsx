import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/Icons';
import Input from '../components/Input';
import Logo from '../components/Logo';
import SegmentedControl from '../components/SegmentedControl';
import { theme } from '../styles/theme';

export default function AuthScreen({ onAuthSuccess, onForgotPassword }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const tabs = [
    { label: 'Logowanie', value: 'login' },
    { label: 'Rejestracja', value: 'register' },
  ];

  const validate = () => {
    const newErrors = {};
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      newErrors.email = 'Podaj adres e-mail';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Nieprawidłowy format adresu e-mail';
    }

    if (!password) {
      newErrors.password = 'Wprowadź hasło';
    } else if (password.length < 8) {
      newErrors.password = 'Hasło musi mieć co najmniej 8 znaków';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (onAuthSuccess) {
        await onAuthSuccess({ mode, email: email.trim(), password });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword(email.trim());
    }
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Logo size={68} testID="app-logo" />
            </View>
            <Text style={styles.title}>Witaj w Rytm</Text>
            <Text style={styles.subtitle}>Zaloguj się, aby śledzić swój dzień.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Segmented Switch */}
            <SegmentedControl
              tabs={tabs}
              activeTab={mode}
              onTabChange={toggleMode}
              testID="auth-mode-switch"
            />

            {/* Email Input */}
            <Input
              testID="email-input"
              label="E-mail"
              placeholder="ty@przyklad.pl"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<MailIcon color={theme.colors.iconColor} size={18} />}
            />

            {/* Password Input with inline right header 'Nie pamiętasz hasła?' */}
            <Input
              testID="password-input"
              label="Hasło"
              placeholder="Min. 8 znaków"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={<LockIcon color={theme.colors.iconColor} size={18} />}
              rightIcon={
                showPassword ? (
                  <EyeOffIcon color={theme.colors.iconColor} size={20} />
                ) : (
                  <EyeIcon color={theme.colors.iconColor} size={20} />
                )
              }
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              rightHeaderAction={
                mode === 'login' ? (
                  <TouchableOpacity testID="forgot-password-link" onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Nie pamiętasz hasła?</Text>
                  </TouchableOpacity>
                ) : null
              }
            />

            {/* Action Button */}
            <View style={styles.buttonContainer}>
              <Button
                testID="submit-auth-button"
                title={mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </View>

          {/* Bottom Mode Switch Link */}
          <View style={styles.footerLinkContainer}>
            {mode === 'login' ? (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Nie masz konta? </Text>
                <TouchableOpacity
                  testID="switch-to-register"
                  onPress={() => toggleMode('register')}
                >
                  <Text style={styles.footerLinkBold}>Załóż konto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Masz już konto? </Text>
                <TouchableOpacity testID="switch-to-login" onPress={() => toggleMode('login')}>
                  <Text style={styles.footerLinkBold}>Zaloguj się</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.subtitle,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  forgotPasswordText: {
    ...theme.typography.link,
  },
  buttonContainer: {
    marginTop: theme.spacing.sm,
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  footerLinkBold: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textLink,
  },
});
