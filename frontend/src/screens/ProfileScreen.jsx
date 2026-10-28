import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import { theme } from '../styles/theme';
import { activeHoursPerDay, formatDecimal, formatTime12 } from '../utils/date';
import { averageEnergy, doneCheckins } from '../utils/stats';

export default function ProfileScreen({ user, checkins, onEditSettings, onLogout }) {
  const entries = doneCheckins(checkins);
  const settings = user.settings;
  const stats = [
    { label: 'Check-iny', value: String(entries.length), testID: 'stat-checkins' },
    { label: 'Śr. energia', value: `${averageEnergy(entries)}%`, testID: 'stat-energy' },
    {
      label: 'Godziny aktywności',
      value: `${formatDecimal(activeHoursPerDay(settings.wakeTime, settings.sleepTime))} h`,
      testID: 'stat-hours',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Twoje konto" title="Profil" />

        <Card>
          <Text style={styles.label}>E-mail</Text>
          <Text testID="profile-email" style={styles.email}>
            {user.email}
          </Text>
          <View style={styles.stats}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text testID={stat.testID} style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Ustawienia</Text>
          <SettingRow label="Powiadomienia dziennie" value={String(settings.notificationsCount)} />
          <SettingRow
            label="Harmonogram"
            value={`${formatTime12(settings.wakeTime)} – ${formatTime12(settings.sleepTime)}`}
          />
          <SettingRow
            label="Kategorie"
            value={settings.categories.map((category) => category.name).join(', ') || '—'}
          />
          <SettingRow
            label="Powiadomienia push"
            value={settings.notificationsEnabled ? 'Tak' : 'Nie'}
          />
          <SettingRow label="Lokalizacja GPS" value={settings.gpsEnabled ? 'Tak' : 'Nie'} last />
        </Card>

        <View style={styles.actions}>
          <Button testID="edit-settings" title="Edytuj ustawienia" onPress={onEditSettings} />
          <View style={styles.gap} />
          <Button testID="logout" title="Wyloguj się" variant="secondary" onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, last }) {
  return (
    <View style={[styles.settingRow, last && styles.settingRowLast]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 56 },
  label: { fontSize: 13, color: theme.colors.textSecondary },
  email: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: { flex: 1, borderRadius: 16, backgroundColor: theme.colors.background, padding: 12 },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 6 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel: { fontSize: 14, color: theme.colors.textSecondary },
  settingValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actions: { marginTop: 6 },
  gap: { height: 12 },
});
