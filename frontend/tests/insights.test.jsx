import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import App from '../App';
import { toCheckin, toInsight, toUser } from '../src/api/mappers';

jest.mock('../src/api/supabase', () => ({ getSupabase: jest.fn() }));

const row = {
  id: 7,
  description: 'Najlepiej czujesz się wieczorem po ruchu.',
  structured_data: {
    happiest_time: 'wieczorem, podczas relaksu',
    energy_boosters: ['bieganie w parku'],
    energy_drainers: ['korek do pracy'],
  },
  from_date: '2026-10-29',
  to_date: '2026-11-12',
};

describe('toInsight', () => {
  it('maps the backend (Bielik) answer to the insight card', () => {
    expect(toInsight(row, 5)).toEqual({
      status: 'ready',
      total: 5,
      days: 14,
      title: row.description,
      bullets: [{ tone: 'purple', text: 'Najszczęśliwszy jesteś: wieczorem, podczas relaksu' }],
      chips: [
        { tone: 'green', text: '↑ bieganie w parku' },
        { tone: 'orange', text: '↓ korek do pracy' },
      ],
    });
  });
});

describe('Insights flow', () => {
  const me = {
    email: 'ty@example.com',
    is_onboarded: true,
    notifications_count: 5,
    wake_time: '07:00:00',
    sleep_time: '23:00:00',
    notifications_enabled: false,
    gps_enabled: false,
    categories: [{ id: 1, name: 'Praca', color: '#4F46E5' }],
  };
  const checkins = [1, 2, 3].map((id) =>
    toCheckin({
      id,
      category: { name: 'Praca' },
      mood: 4,
      energy_level: 60,
      status: 'done',
      scheduled_at: new Date(Date.now() - id * 3600e3).toISOString(),
    })
  );

  const fakeApi = (generateInsight) => ({
    hasSession: async () => true,
    load: async () => ({ user: toUser(me), checkins, insight: null }),
    generateInsight,
    signOut: async () => {},
  });

  it('asks the backend for an AI insight and shows it', async () => {
    const generateInsight = jest.fn(async (days, total) => toInsight(row, total));
    const user = userEvent.setup();
    await render(<App api={fakeApi(generateInsight)} />);

    await user.press(await screen.findByTestId('nav-insights'));
    await user.press(screen.getByTestId('generate-insights'));

    expect(await screen.findByText(row.description)).toBeTruthy();
    expect(generateInsight).toHaveBeenCalledWith(14, 3);
    expect(screen.getByText('↑ bieganie w parku')).toBeTruthy();
  });
});
