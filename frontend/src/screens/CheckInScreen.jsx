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
import { BoltIcon, CheckIcon, ClockIcon, LocationIcon, MoodIcon } from '../components/Icons';
import Slider from '../components/Slider';
import { MOODS, moodLabel } from '../models/moods';
import { theme } from '../styles/theme';
import { formatShortDate, formatTime } from '../utils/date';

/**
 * Check-in form. `scheduledAt` is the moment the entry is about (the notification time for
 * late check-ins); without it the entry is a manual one made right now.
 */
export default function CheckInScreen({
  categories,
  scheduledAt,
  gpsEnabled = false,
  onSave,
  onSkip,
}) {
  const isManual = !scheduledAt;
  const [moment] = useState(() => scheduledAt ?? new Date());
  const [categoryId, setCategoryId] = useState(null);
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(0);
  const [saving, setSaving] = useState(false);

  const canSave = categoryId !== null && mood !== null && !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        categoryId,
        description: description.trim(),
        mood,
        energyLevel: energy,
        scheduledAt: moment,
        isManual,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View testID="checkin-banner" style={styles.banner}>
          <View style={styles.bannerIcon}>
            <ClockIcon size={26} color="#FFFFFF" />
          </View>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>
              {isManual
                ? `Nowy check-in o ${formatTime(moment)}`
                : `Check-in wygenerowany o ${formatTime(moment)}`}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isManual ? 'Wpis dotyczy teraz' : 'Wpis dotyczy tej godziny'} ·{' '}
              {formatShortDate(moment)}
            </Text>
          </View>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Kategoria czasu</Text>
          {categories.length === 0 ? (
            <Text style={styles.emptyHint}>
              Nie masz jeszcze kategorii. Dodaj je w ustawieniach profilu.
            </Text>
          ) : (
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <TouchableOpacity
                    key={category.id}
                    testID={`checkin-category-${category.name}`}
                    accessibilityState={{ selected }}
                    onPress={() => setCategoryId(category.id)}
                    style={[
                      styles.categoryTile,
                      { backgroundColor: category.background },
                      selected && styles.categoryTileSelected,
                    ]}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text numberOfLines={1} style={[styles.categoryText, { color: category.text }]}>
                      {category.name}
                    </Text>
                    {selected ? <CheckIcon size={20} color={category.text} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Co teraz robisz?</Text>
          <TextInput
            testID="description-input"
            value={description}
            onChangeText={setDescription}
            placeholder="Co teraz robisz? Opisz krótko..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={200}
            textAlignVertical="top"
            style={styles.textarea}
          />
        </Card>

        <Card>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Jak się czujesz?</Text>
            <Text testID="mood-label" style={styles.moodLabel}>
              {mood ? moodLabel(mood) : ''}
            </Text>
          </View>
          <View style={styles.moodRow}>
            {MOODS.map((item) => {
              const selected = item.value === mood;
              return (
                <TouchableOpacity
                  key={item.value}
                  testID={`mood-${item.value}`}
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setMood(item.value)}
                  style={[styles.moodButton, selected && styles.moodButtonSelected]}
                >
                  <MoodIcon
                    value={item.value}
                    size={34}
                    tinted={selected}
                    color={selected ? '#2B2F45' : '#7B8091'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={styles.energyTitle}>
              <View style={styles.energyIcon}>
                <BoltIcon size={20} />
              </View>
              <Text style={styles.cardTitle}>Poziom energii</Text>
            </View>
            <Text testID="energy-value" style={styles.energyValue}>
              {energy}%
            </Text>
          </View>
          <View style={styles.energySlider}>
            <Slider
              testID="energy-slider"
              accessibilityLabel="Poziom energii"
              value={energy}
              onChange={setEnergy}
              min={0}
              max={100}
              step={1}
              fillColor={theme.colors.amberAccent}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.sliderLabel}>0% · wyczerpany</Text>
            <Text style={styles.sliderLabel}>100% · pełen energii</Text>
          </View>
        </Card>

        <View style={styles.location}>
          <LocationIcon size={16} color="#6B7280" />
          <Text style={styles.locationText}>
            {gpsEnabled ? 'Lokalizacja pobrana automatycznie' : 'Lokalizacja wyłączona'}
          </Text>
        </View>

        <View style={styles.spacer} />

        <Button
          testID="save-checkin"
          title="Zapisz status"
          disabled={!canSave}
          loading={saving}
          onPress={handleSave}
        />
        <TouchableOpacity testID="skip-checkin" onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Odpuść check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontSize: 20, lineHeight: 24, fontWeight: '800', color: '#FFFFFF' },
  bannerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: theme.colors.textPrimary },
  emptyHint: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  categoryTile: {
    width: '48%',
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTileSelected: { borderColor: theme.colors.primary },
  categoryDot: { width: 11, height: 11, borderRadius: 6, marginRight: 10 },
  categoryText: { flex: 1, fontSize: 16, fontWeight: '700' },
  textarea: {
    height: 92,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.inputBorder,
    backgroundColor: '#FAFAFD',
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moodLabel: { fontSize: 14, color: theme.colors.textSecondary },
  moodRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  moodButton: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.lilac,
  },
  energyTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  energyIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: theme.colors.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyValue: { fontSize: 22, fontWeight: '800', color: theme.colors.amberText },
  energySlider: { marginTop: 10, marginBottom: 2 },
  sliderLabel: { fontSize: 13, color: theme.colors.textSecondary },
  location: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  locationText: { fontSize: 14, color: theme.colors.textSecondary },
  spacer: { flex: 1, minHeight: 28 },
  skip: { alignItems: 'center', paddingVertical: 16 },
  skipText: { fontSize: 15, fontWeight: '700', color: theme.colors.textSecondary },
});
