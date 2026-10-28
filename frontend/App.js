import { StatusBar } from 'expo-status-bar';
import React, { useReducer, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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

let nextId = 1;

export default function App() {
  const [{ user, checkins, insight }, dispatch] = useReducer(appReducer, initialState);
  const [tab, setTab] = useState('dashboard');
  const [overlay, setOverlay] = useState(null); // 'checkin' | 'settings' | null

  const handleForgotPassword = (email) => {
    Alert.alert(
      'Reset hasła',
      email
        ? `Wysłano link do zresetowania hasła na adres: ${email}`
        : 'Wprowadź adres e-mail, aby zresetować hasło.'
    );
  };

  const handleSaveCheckin = async (entry) => {
    const coords = user.settings.gpsEnabled ? await getCurrentCoords() : null;
    dispatch({
      type: 'add-checkin',
      checkin: {
        ...entry,
        id: String(nextId++),
        status: 'done',
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        completedAt: new Date(),
      },
    });
    setOverlay(null);
  };

  const signOut = () => {
    dispatch({ type: 'sign-out' });
    setTab('dashboard');
    setOverlay(null);
  };

  const renderContent = () => {
    if (!user) {
      return (
        <AuthScreen
          onAuthSuccess={({ email }) => dispatch({ type: 'sign-in', email })}
          onForgotPassword={handleForgotPassword}
        />
      );
    }

    if (!user.isOnboarded) {
      return (
        <OnboardingScreen
          onComplete={(settings) => dispatch({ type: 'complete-onboarding', settings })}
        />
      );
    }

    if (overlay === 'settings') {
      return (
        <OnboardingScreen
          initialSettings={user.settings}
          onCancel={() => setOverlay(null)}
          onComplete={(settings) => {
            dispatch({ type: 'complete-onboarding', settings });
            setOverlay(null);
          }}
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
});
