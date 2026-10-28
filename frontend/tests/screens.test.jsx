import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { DEFAULT_CATEGORIES } from '../src/models/categories';
import CheckInScreen from '../src/screens/CheckInScreen';
import DashboardScreen from '../src/screens/DashboardScreen';
import HistoryScreen from '../src/screens/HistoryScreen';
import InsightsScreen from '../src/screens/InsightsScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import { EMPTY_SETTINGS } from '../src/state/appReducer';

const now = new Date(2026, 9, 15, 14, 20);
const [nauka, , praca] = DEFAULT_CATEGORIES;
const entry = (id, day, hour, category, energyLevel, mood) => ({
  id,
  status: 'done',
  categoryId: category.id,
  description: '',
  mood,
  energyLevel,
  scheduledAt: new Date(2026, 9, day, hour, 0),
  latitude: null,
  longitude: null,
});

describe('CheckInScreen', () => {
  it('shows the notification time and keeps save disabled until category and mood are set', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    await render(
      <CheckInScreen categories={[praca, nauka]} scheduledAt={now} gpsEnabled onSave={onSave} />
    );

    expect(screen.getByText('Check-in wygenerowany o 14:20')).toBeTruthy();
    expect(screen.getByText('Wpis dotyczy tej godziny · czw., 15 paź')).toBeTruthy();
    expect(screen.getByTestId('energy-value')).toHaveTextContent('0%');
    expect(screen.getByTestId('save-checkin').props.accessibilityState.disabled).toBe(true);

    await user.press(screen.getByTestId('checkin-category-Praca'));
    await user.type(screen.getByTestId('description-input'), ' spacer ');
    await user.press(screen.getByTestId('mood-4'));
    expect(screen.getByTestId('mood-label')).toHaveTextContent('Dobrze');

    const slider = screen.getByTestId('energy-slider');
    await fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 118, height: 28 } } });
    await fireEvent(slider, 'responderGrant', { nativeEvent: { locationX: 59 } }); // 50%
    expect(screen.getByTestId('energy-value')).toHaveTextContent('50%');

    await user.press(screen.getByTestId('save-checkin'));
    expect(onSave).toHaveBeenCalledWith({
      categoryId: 'praca',
      description: 'spacer',
      mood: 4,
      energyLevel: 50,
      scheduledAt: now,
      isManual: false,
    });
  });

  it('lets the user skip', async () => {
    const onSkip = jest.fn();
    const user = userEvent.setup();
    await render(<CheckInScreen categories={[praca]} onSkip={onSkip} />);
    await user.press(screen.getByTestId('skip-checkin'));
    expect(onSkip).toHaveBeenCalled();
  });
});

describe('DashboardScreen', () => {
  const settings = { ...EMPTY_SETTINGS, wakeTime: '07:00', sleepTime: '23:00' };

  it('shows only zeros and empty states without entries', async () => {
    await render(
      <DashboardScreen checkins={[]} categories={[praca, nauka]} settings={settings} now={now} />
    );

    expect(screen.getByText('Czwartek, 15 października')).toBeTruthy();
    expect(screen.getByTestId('checkin-count')).toHaveTextContent('0 check-inów');
    expect(screen.getByText('0 h')).toBeTruthy();
    expect(screen.getByTestId('average-energy')).toHaveTextContent('śr. 0%');
    expect(screen.getByTestId('legend-Praca').props.accessibilityLabel).toBe('Praca: 0%, 0 h');
    expect(screen.getByTestId('energy-empty')).toBeTruthy();
    expect(screen.getByTestId('heatmap-empty')).toBeTruthy();
  });

  it('computes shares from entries and switches range', async () => {
    const user = userEvent.setup();
    const checkins = [
      entry('1', 15, 9, praca, 60, 4),
      entry('2', 15, 10, praca, 80, 5),
      entry('3', 15, 11, nauka, 40, 3),
      entry('4', 12, 11, nauka, 20, 3),
    ];
    await render(
      <DashboardScreen
        checkins={checkins}
        categories={[praca, nauka]}
        settings={settings}
        now={now}
      />
    );

    expect(screen.getByTestId('checkin-count')).toHaveTextContent('3 check-iny');
    expect(screen.getByTestId('legend-Praca').props.accessibilityLabel).toBe('Praca: 67%, 10,7 h');
    expect(screen.getByTestId('average-energy')).toHaveTextContent('śr. 60%');

    await user.press(screen.getByTestId('tab-week'));
    expect(screen.getByTestId('checkin-count')).toHaveTextContent('4 check-iny');
    expect(screen.getByText('112 h')).toBeTruthy();
  });
});

describe('HistoryScreen', () => {
  it('shows an empty state', async () => {
    await render(<HistoryScreen checkins={[]} categories={[praca]} now={now} />);
    expect(screen.getByTestId('history-empty')).toBeTruthy();
  });

  it('groups entries by day, newest first, and filters by category', async () => {
    const user = userEvent.setup();
    const checkins = [
      entry('a', 15, 8, nauka, 45, 3),
      entry('b', 15, 14, praca, 65, 4),
      entry('c', 14, 12, praca, 70, 4),
      { ...entry('d', 14, 13, praca, 10, 1), status: 'deleted' },
    ];
    await render(<HistoryScreen checkins={checkins} categories={[praca, nauka]} now={now} />);

    expect(screen.getByText('Dzisiaj · czw., 15 paź')).toBeTruthy();
    expect(screen.getByText('Wczoraj · śr., 14 paź')).toBeTruthy();
    expect(screen.getByText('2 wpisy')).toBeTruthy();
    expect(screen.getByText('1 wpis')).toBeTruthy();
    expect(screen.queryByTestId('entry-d')).toBeNull();
    expect(screen.getByText('65 %')).toBeTruthy();

    await user.press(screen.getByTestId('toggle-filter'));
    await user.press(screen.getByTestId('filter-Nauka'));
    expect(screen.queryByTestId('entry-b')).toBeNull();
    expect(screen.getByTestId('entry-a')).toBeTruthy();
  });
});

describe('InsightsScreen', () => {
  it('explains that more data is needed', async () => {
    await render(<InsightsScreen checkins={[]} insight={null} onGenerate={jest.fn()} now={now} />);
    expect(screen.getByText('na podstawie 0 wpisów')).toBeTruthy();
    expect(screen.getByTestId('insights-empty')).toBeTruthy();
  });

  it('renders a generated insight and triggers generation', async () => {
    const onGenerate = jest.fn();
    const user = userEvent.setup();
    const insight = {
      status: 'ready',
      total: 4,
      days: 14,
      title: 'Najszczęśliwszy jesteś między 17:00 a 19:00, zwykle w kategorii Relaks.',
      bullets: [{ tone: 'green', text: 'Punkt pierwszy.' }],
      chips: [{ tone: 'orange', text: '−1,2 pkt w „korek”' }],
    };
    await render(
      <InsightsScreen checkins={[]} insight={insight} onGenerate={onGenerate} now={now} />
    );

    expect(screen.getByText(insight.title)).toBeTruthy();
    expect(screen.getByText('na podstawie 4 wpisów')).toBeTruthy();
    await user.press(screen.getByTestId('generate-insights'));
    expect(onGenerate).toHaveBeenCalled();
  });
});

describe('ProfileScreen', () => {
  it('shows zeroed stats for a new account', async () => {
    await render(
      <ProfileScreen
        user={{ email: 'a@b.pl', settings: EMPTY_SETTINGS }}
        checkins={[]}
        onEditSettings={jest.fn()}
        onLogout={jest.fn()}
      />
    );
    expect(screen.getByTestId('profile-email')).toHaveTextContent('a@b.pl');
    expect(screen.getByTestId('stat-checkins')).toHaveTextContent('0');
    expect(screen.getByTestId('stat-energy')).toHaveTextContent('0%');
    expect(screen.getByTestId('stat-hours')).toHaveTextContent('0 h');
  });
});
