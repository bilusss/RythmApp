import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import { SparkIcon } from '../components/Icons';
import ScreenHeader from '../components/ScreenHeader';
import { theme } from '../styles/theme';
import { INSIGHT_DAYS, MIN_INSIGHT_ENTRIES } from '../utils/insights';
import { filterByDays } from '../utils/stats';
import { pluralize } from '../utils/date';

const TONES = {
  green: { dot: '#2CA26F', chipBg: '#D9F4E7', chipText: '#14653F' },
  orange: { dot: '#EF8528', chipBg: '#FFE9D0', chipText: '#8A4A0C' },
  purple: { dot: '#7954E8', chipBg: '#E8DEFF', chipText: '#4B2BB0' },
};

export default function InsightsScreen({ checkins, insight, onGenerate, now = new Date() }) {
  const total = filterByDays(checkins, INSIGHT_DAYS, now).length;
  const shownTotal = insight?.status === 'ready' ? insight.total : total;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow={`na podstawie ${shownTotal} ${pluralize(shownTotal, ['wpisu', 'wpisów', 'wpisów'])}`}
          title="Insights"
        />

        <TouchableOpacity
          testID="generate-insights"
          activeOpacity={0.85}
          onPress={onGenerate}
          style={styles.generate}
        >
          <Text style={styles.generateText}>Wyciągnij wnioski</Text>
        </TouchableOpacity>

        <Card testID="insight-card" style={styles.card}>
          {insight?.status === 'ready' ? (
            <>
              <View style={styles.tag}>
                <View style={styles.tagIcon}>
                  <SparkIcon size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.tagText}>Analiza · ostatnie {insight.days} dni</Text>
              </View>
              <Text style={styles.title}>{insight.title}</Text>
              {insight.bullets.map((bullet) => (
                <View key={bullet.text} style={styles.bullet}>
                  <View style={[styles.bulletDot, { backgroundColor: TONES[bullet.tone].dot }]} />
                  <Text style={styles.bulletText}>{bullet.text}</Text>
                </View>
              ))}
              <View style={styles.chips}>
                {insight.chips.map((chip) => (
                  <View
                    key={chip.text}
                    style={[styles.chip, { backgroundColor: TONES[chip.tone].chipBg }]}
                  >
                    <Text style={[styles.chipText, { color: TONES[chip.tone].chipText }]}>
                      {chip.text}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View testID="insights-empty" style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SparkIcon size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {insight?.status === 'insufficient' ? 'Za mało danych' : 'Brak wniosków'}
              </Text>
              <Text style={styles.emptyText}>
                {total < MIN_INSIGHT_ENTRIES
                  ? `Zapisz co najmniej ${MIN_INSIGHT_ENTRIES} check-iny z ostatnich ${INSIGHT_DAYS} dni (masz ${total}), aby wyciągnąć wnioski.`
                  : 'Kliknij „Wyciągnij wnioski”, aby przeanalizować swoje wpisy.'}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 56 },
  generate: {
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  card: { paddingVertical: 18 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: theme.colors.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 14,
  },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bulletDot: { width: 9, height: 9, borderRadius: 5, marginTop: 8, marginRight: 12 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 23, color: '#2B2F45' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 18 },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.lilac,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
});
