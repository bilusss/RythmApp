import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useReducer, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api as realApi } from './src/api';
import { getCurrentCoords } from './src/api/location';
import BottomNav from './src/components/BottomNav';
import AuthScreen from './src/screens/AuthScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { appReducer, initialState } from './src/state/appReducer';
import { theme } from './src/styles/theme';
import { generateInsights } from './src/utils/insights';
import { notify } from './src/utils/notify';

export default function App({ api = realApi }) {
  const [{ user, checkins, insight }, dispatch] = useReducer(appReducer, initialState);
  const [tab, setTab] = useState('dashboard');
  const [overlay, setOverlay] = useState(null); // 'checkin' | 'settings' | null
  const [booting, setBooting] = useState(true);

  const loadAccount = async () => {
    const { user: loaded, checkins: loadedCheckins } = await api.load();
    dispatch({ type: 'load', user: loaded, checkins: loadedCheckins });
  };

  // Restore a saved session on start.
  useEffect(() => {
    (async () => {
      try {
        if (await api.hasSession()) await loadAccount();
      } catch {
        // No usable session or server down: fall through to the login screen.
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async ({ mode, email, password }) => {
    if (mode === 'register') await api.signUp(email, password);
    else await api.signIn(email, password);
    await loadAccount();
  };

  const handleForgotPassword = async (email) => {
    if (!email) {
      notify('Reset hasła', 'Wprowadź adres e-mail, aby zresetować hasło.');
      return;
    }
    try {
      await api.resetPassword(email);
      notify('Reset hasła', `Wysłano link do zresetowania hasła na adres: ${email}`);
    } catch (error) {
      notify('Reset hasła', error.message);
    }
  };

  const handleSaveSettings = async (settings) => {
    try {
      const saved = await api.saveSettings(settings);
      dispatch({ type: 'complete-onboarding', settings: saved });
      setOverlay(null);
    } catch (error) {
      notify('Nie udało się zapisać ustawień', error.message);
    }
  };

  const handleSaveCheckin = async (entry) => {
    const coords = user.settings.gpsEnabled ? await getCurrentCoords() : null;
    const serverId = user.settings.categories.find(({ id }) => id === entry.categoryId)?.serverId;
    try {
      const saved = await api.createCheckin(entry, serverId, coords);
      dispatch({ type: 'add-checkin', checkin: { ...saved, categoryId: entry.categoryId } });
      setOverlay(null);
    } catch (error) {
      notify('Nie udało się zapisać check-inu', error.message);
    }
  };

  const signOut = async () => {
    await api.signOut().catch(() => {});
    dispatch({ type: 'sign-out' });
    setTab('dashboard');
    setOverlay(null);
  };

  const renderContent = () => {
    if (booting) {
      return (
        <View style={styles.boot}>
          <ActivityIndicator color={theme.colors.textLink} />
        </View>
      );
    }

    if (!user) {
      return <AuthScreen onAuthSuccess={handleAuth} onForgotPassword={handleForgotPassword} />;
    }

    if (!user.isOnboarded) {
      return <OnboardingScreen onComplete={handleSaveSettings} />;
    }

    if (overlay === 'settings') {
      return (
        <OnboardingScreen
          initialSettings={user.settings}
          onCancel={() => setOverlay(null)}
          onComplete={handleSaveSettings}
        />
      );
    }

    if (overlay === 'checkin') {
      return (
        <CheckInScreen
          categories={user.settings.categories}
          gpsEnabled={user.settings.gpsEnabled}
          onSave={handleSaveCheckin}
          onSkip={() => setOverlay(null)}
        />
      );
    }

    const { categories } = user.settings;
    return (
      <>
        <View style={styles.screen}>
          {tab === 'dashboard' ? (
            <DashboardScreen
              checkins={checkins}
              categories={categories}
              settings={user.settings}
              onOpenSettings={() => setOverlay('settings')}
            />
          ) : null}
          {tab === 'history' ? <HistoryScreen checkins={checkins} categories={categories} /> : null}
          {tab === 'insights' ? (
            <InsightsScreen
              checkins={checkins}
              insight={insight}
              onGenerate={() =>
                dispatch({ type: 'set-insight', insight: generateInsights(checkins, categories) })
              }
            />
          ) : null}
          {tab === 'profile' ? (
            <ProfileScreen
              user={user}
              checkins={checkins}
              onEditSettings={() => setOverlay('settings')}
              onLogout={signOut}
            />
          ) : null}
        </View>
        <BottomNav active={tab} onChange={setTab} onAdd={() => setOverlay('checkin')} />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screen: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
