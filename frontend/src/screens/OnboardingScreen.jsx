import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import { BellIcon, ClockIcon, LocationIcon, MoonIcon, SunIcon } from '../components/Icons';
import Logo from '../components/Logo';
import Slider from '../components/Slider';
import TimePickerModal from '../components/TimePickerModal';
import { buildCategory, CUSTOM_CATEGORY_COLORS, DEFAULT_CATEGORIES } from '../models/categories';
import { theme } from '../styles/theme';
import { activeHoursPerDay, formatTime12, pluralize } from '../utils/date';

// "Co ok. 3 godziny" derived from the chosen schedule and number of notifications.
function describeInterval(count, wakeTime, sleepTime) {
  const hours = activeHoursPerDay(wakeTime, sleepTime);
  if (count < 1 || hours === 0) return 'Wybierz liczbę i godziny';

  const minutes = Math.round((hours * 60) / count);
  if (minutes < 60) return `Co ok. ${minutes} minut`;

  const rounded = Math.round((minutes / 60) * 2) / 2;
  const text = String(rounded).replace('.', ',');
  const word = Number.isInteger(rounded)
    ? pluralize(rounded, ['godzinę', 'godziny', 'godzin'])
    : 'godziny';
  return `Co ok. ${text} ${word}`;
}

export default function OnboardingScreen({ initialSettings, onComplete, onCancel }) {
  const editing = Boolean(initialSettings);
  const initialCategories = initialSettings?.categories ?? [];

  const [categories, setCategories] = useState(() => [
    ...DEFAULT_CATEGORIES,
    ...initialCategories.filter(({ id }) => !DEFAULT_CATEGORIES.some((item) => item.id === id)),
  ]);
  const [selectedIds, setSelectedIds] = useState(() => initialCategories.map(({ id }) => id));
  const [notificationsCount, setNotificationsCount] = useState(
    initialSettings?.notificationsCount ?? 0
  );
  const [wakeTime, setWakeTime] = useState(initialSettings?.wakeTime ?? '');
  const [sleepTime, setSleepTime] = useState(initialSettings?.sleepTime ?? '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialSettings?.notificationsEnabled ?? false
  );
  const [gpsEnabled, setGpsEnabled] = useState(initialSettings?.gpsEnabled ?? false);
  const [pickerFor, setPickerFor] = useState(null); // 'wake' | 'sleep' | null

  const [addingCategory, setAddingCategory] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState(CUSTOM_CATEGORY_COLORS[0]);
  const [customError, setCustomError] = useState('');

  const canFinish =
    selectedIds.length > 0 && notificationsCount >= 1 && Boolean(wakeTime) && Boolean(sleepTime);

  const toggleCategory = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const addCustomCategory = () => {
    const name = customName.trim();
    if (!name) {
      setCustomError('Podaj nazwę kategorii');
      return;
    }
    const category = buildCategory(name, customColor);
    if (categories.some((item) => item.id === category.id)) {
      setCustomError('Taka kategoria już istnieje');
      return;
    }
    setCategories((current) => [...current, category]);
    setSelectedIds((current) => [...current, category.id]);
    setCustomName('');
    setCustomError('');
    setAddingCategory(false);
  };

  const handleComplete = () => {
    onComplete?.({
      categories: categories.filter(({ id }) => selectedIds.includes(id)),
      notificationsCount,
      wakeTime,
      sleepTime,
      notificationsEnabled,
      gpsEnabled,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <Logo size={40} />
            <Text style={styles.brandName}>Rytm</Text>
          </View>
          {editing && onCancel ? (
            <TouchableOpacity testID="cancel-settings" onPress={onCancel}>
              <Text style={styles.stepLabel}>Anuluj</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.stepLabel}>Krok 2 z 2</Text>
          )}
        </View>

        <Text style={styles.title}>Ustaw swój rytm dnia</Text>
        <Text style={styles.subtitle}>
          Wybierz, co chcesz śledzić i kiedy możemy pytać{`\n`}Cię o samopoczucie.
        </Text>

        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Twoje kategorie czasu</Text>
            <Text style={styles.cardMeta}>{selectedIds.length} aktywnych</Text>
          </View>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected = selectedIds.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  testID={`category-${category.name}`}
                  accessibilityState={{ selected }}
                  onPress={() => toggleCategory(category.id)}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: selected ? category.background : theme.colors.background },
                  ]}
                >
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selected ? category.text : theme.colors.textMuted },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {addingCategory ? (
            <View style={styles.customForm}>
              <TextInput
                testID="custom-category-input"
                value={customName}
                onChangeText={(text) => {
                  setCustomName(text);
                  setCustomError('');
                }}
                placeholder="Nazwa kategorii"
                placeholderTextColor={theme.colors.textMuted}
                maxLength={24}
                style={styles.customInput}
              />
              <View style={styles.swatches}>
                {CUSTOM_CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    testID={`custom-color-${color}`}
                    accessibilityLabel={`Kolor ${color}`}
                    onPress={() => setCustomColor(color)}
                    style={[
                      styles.swatch,
                      { backgroundColor: color },
                      customColor === color && styles.swatchActive,
                    ]}
                  />
                ))}
              </View>
              {customError ? <Text style={styles.customError}>{customError}</Text> : null}
              <View style={styles.customActions}>
                <TouchableOpacity
                  testID="custom-category-cancel"
                  onPress={() => {
                    setAddingCategory(false);
                    setCustomError('');
                  }}
                >
                  <Text style={styles.customCancel}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="custom-category-submit"
                  onPress={addCustomCategory}
                  style={styles.customSubmit}
                >
                  <Text style={styles.customSubmitText}>Dodaj</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              testID="add-category"
              onPress={() => setAddingCategory(true)}
              style={styles.addCategory}
            >
              <Text style={styles.addCategoryPlus}>+</Text>
              <Text style={styles.addCategoryText}>Dodaj własną</Text>
            </TouchableOpacity>
          )}
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Liczba powiadomień w ciągu dnia</Text>
            <View style={styles.valueBadge}>
              <Text testID="notifications-value" style={styles.valueBadgeText}>
                {notificationsCount}
              </Text>
            </View>
          </View>
          <View style={styles.sliderArea}>
            <Slider
              testID="notifications-slider"
              accessibilityLabel="Liczba powiadomień w ciągu dnia"
              value={notificationsCount}
              onChange={setNotificationsCount}
              min={1}
              max={10}
              step={1}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1</Text>
            <Text style={styles.sliderLabel}>
              {describeInterval(notificationsCount, wakeTime, sleepTime)}
            </Text>
            <Text style={styles.sliderLabel}>10</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Harmonogram dnia</Text>
          <View style={styles.scheduleRow}>
            <ScheduleField
              label="Od · pobudka"
              icon={<SunIcon size={16} />}
              value={wakeTime}
              tone="warm"
              onPress={() => setPickerFor('wake')}
              testID="wake-time"
            />
            <ScheduleField
              label="Do · sen"
              icon={<MoonIcon size={16} />}
              value={sleepTime}
              tone="cool"
              onPress={() => setPickerFor('sleep')}
              testID="sleep-time"
            />
          </View>
          <Text style={styles.scheduleHint}>
            Powiadomienia pojawią się tylko w tym przedziale, w losowych odstępach.
          </Text>
        </Card>

        <Card style={styles.permissionsCard}>
          <PermissionRow
            label="Zgoda na wysyłanie powiadomień"
            description="Wymagane do check-inów"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            testID="push-permission"
            tone="purple"
          />
          <PermissionRow
            label="Dostęp do lokalizacji GPS"
            description="Opcjonalnie, do mapy miejsc"
            value={gpsEnabled}
            onValueChange={setGpsEnabled}
            testID="gps-permission"
            tone="green"
            last
          />
        </Card>

        <Button
          testID="finish-onboarding"
          title={editing ? 'Zapisz ustawienia' : 'Zaczynamy'}
          disabled={!canFinish}
          onPress={handleComplete}
        />
        {!canFinish ? (
          <Text testID="finish-hint" style={styles.finishHint}>
            Wybierz kategorię, liczbę powiadomień oraz godziny pobudki i snu.
          </Text>
        ) : null}
      </ScrollView>

      {pickerFor ? (
        <TimePickerModal
          visible
          title={pickerFor === 'wake' ? 'Godzina pobudki' : 'Godzina snu'}
          value={pickerFor === 'wake' ? wakeTime : sleepTime}
          onCancel={() => setPickerFor(null)}
          onConfirm={(time) => {
            (pickerFor === 'wake' ? setWakeTime : setSleepTime)(time);
            setPickerFor(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function ScheduleField({ label, icon, value, tone, onPress, testID }) {
  const warm = tone === 'warm';
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[styles.scheduleField, warm ? styles.scheduleWarm : styles.scheduleCool]}
    >
      <View style={styles.scheduleLabelRow}>
        {icon}
        <Text style={[styles.scheduleLabel, { color: warm ? '#76561D' : theme.colors.primary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.scheduleValueRow}>
        <Text style={styles.scheduleValue}>{formatTime12(value)}</Text>
        <ClockIcon size={22} />
      </View>
    </TouchableOpacity>
  );
}

function PermissionRow({ label, description, value, onValueChange, testID, tone, last }) {
  return (
    <View style={[styles.permissionRow, last && styles.permissionRowLast]}>
      <View
        style={[
          styles.permissionIcon,
          tone === 'green' ? styles.permissionIconGreen : styles.permissionIconPurple,
        ]}
      >
        {tone === 'green' ? <LocationIcon size={22} /> : <BellIcon size={22} />}
      </View>
      <View style={styles.permissionCopy}>
        <Text style={styles.permissionLabel}>{label}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
      <Toggle testID={testID} value={value} onToggle={() => onValueChange(!value)} />
    </View>
  );
}

function Toggle({ value, onToggle, testID }) {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={onToggle}
      style={[styles.toggle, value && styles.toggleActive]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginLeft: 12,
  },
  stepLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary, marginBottom: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardMeta: { fontSize: 14, color: theme.colors.textSecondary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  categoryChip: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  categoryText: { fontSize: 14.5, fontWeight: '600' },
  addCategory: {
    alignSelf: 'flex-start',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#AEB3C1',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  addCategoryPlus: { fontSize: 22, lineHeight: 24, color: theme.colors.primary, marginRight: 8 },
  addCategoryText: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },
  customForm: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
  },
  customInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: theme.colors.ink },
  customError: { fontSize: 12, fontWeight: '600', color: theme.colors.error, marginTop: 10 },
  customActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 12,
  },
  customCancel: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  customSubmit: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  customSubmitText: { fontSize: 15, fontWeight: '700', color: theme.colors.primaryText },
  valueBadge: {
    backgroundColor: theme.colors.lilac,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  valueBadgeText: { color: theme.colors.primary, fontSize: 19, fontWeight: '800' },
  sliderArea: { marginTop: 12 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabel: { fontSize: 14, color: theme.colors.textSecondary },
  scheduleRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  scheduleField: { flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14 },
  scheduleWarm: { backgroundColor: '#FFF4DD' },
  scheduleCool: { backgroundColor: '#EAE8FF' },
  scheduleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  scheduleLabel: { fontSize: 14, fontWeight: '500' },
  scheduleValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleValue: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
  scheduleHint: { fontSize: 14, lineHeight: 20, color: theme.colors.textSecondary, marginTop: 14 },
  permissionsCard: { paddingVertical: 6 },
  permissionRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  permissionRowLast: { borderBottomWidth: 0 },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  permissionIconPurple: { backgroundColor: theme.colors.lilac },
  permissionIconGreen: { backgroundColor: '#DDF4E7' },
  permissionCopy: { flex: 1, paddingRight: 12 },
  permissionLabel: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  permissionDescription: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
    backgroundColor: '#D9DDE7',
  },
  toggleActive: { backgroundColor: theme.colors.primary },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  finishHint: {
    fontSize: 13,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
});
