import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import DonutChart, { DonutCenter } from '../components/DonutChart';
import EnergyChart from '../components/EnergyChart';
import HeatMap from '../components/HeatMap';
import { BoltIcon, SlidersIcon } from '../components/Icons';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import { theme } from '../styles/theme';
import { activeHoursPerDay, formatDecimal, formatLongDate, pluralize } from '../utils/date';
import {
  RANGES,
  averageEnergy,
  categoryBreakdown,
  energyByHour,
  filterByRange,
  locationClusters,
  rangeDays,
} from '../utils/stats';

export default function DashboardScreen({
  checkins,
  categories,
  settings,
  now = new Date(),
  onOpenSettings,
}) {
  const [range, setRange] = useState('day');

  const view = useMemo(() => {
    const entries = filterByRange(checkins, range, now);
    const days = rangeDays(range);
    const activeHours = activeHoursPerDay(settings?.wakeTime, settings?.sleepTime);
    return {
      entries,
      breakdown: categoryBreakdown(entries, categories, activeHours, days),
      totalHours: entries.length === 0 ? 0 : activeHours * days,
      energyPoints: energyByHour(entries),
      average: averageEnergy(entries),
      clusters: locationClusters(checkins, categories, now),
    };
    // `now` is intentionally read once per render pass; entries change identity on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkins, categories, settings, range]);

  const count = view.entries.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow={formatLongDate(now)}
          title="Twój dzień"
          action={<SlidersIcon />}
          onActionPress={onOpenSettings}
          actionTestID="open-settings"
        />

        <SegmentedControl
          tabs={RANGES.map(({ value, label }) => ({ value, label }))}
          activeTab={range}
          onTabChange={setRange}
          testID="range-switch"
        />

        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Podział czasu</Text>
            <Text testID="checkin-count" style={styles.cardMeta}>
              {count} {pluralize(count, ['check-in', 'check-iny', 'check-inów'])}
            </Text>
          </View>
          <View style={styles.donutRow}>
            <DonutChart
              size={112}
              strokeWidth={16}
              segments={view.breakdown.map(({ category, share }) => ({
                key: category.id,
                value: share,
                color: category.color,
              }))}
            >
              <DonutCenter value={`${formatDecimal(view.totalHours)} h`} caption="aktywności" />
            </DonutChart>
            <View style={styles.legend}>
              {view.breakdown.length === 0 ? (
                <Text style={styles.legendEmpty}>Brak kategorii</Text>
              ) : (
                view.breakdown.map(({ category, percent, hours }) => (
                  <View
                    key={category.id}
                    testID={`legend-${category.name}`}
                    accessibilityLabel={`${category.name}: ${percent}%, ${formatDecimal(hours)} h`}
                    style={styles.legendRow}
                  >
                    <View style={[styles.legendDot, { backgroundColor: category.color }]} />
                    <Text numberOfLines={1} style={styles.legendName}>
                      {category.name}
                    </Text>
                    <Text style={styles.legendValue}>{percent}%</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <BoltIcon size={22} color={theme.colors.amberAccent} filled />
              <Text style={styles.cardTitle}>Energia w ciągu doby</Text>
            </View>
            <View style={styles.averageBadge}>
              <Text testID="average-energy" style={styles.averageText}>
                śr. {view.average}%
              </Text>
            </View>
          </View>
          <View style={styles.chart}>
            <EnergyChart
              points={view.energyPoints}
              average={view.average}
              wakeTime={settings?.wakeTime}
              sleepTime={settings?.sleepTime}
              now={now}
            />
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendLine} />
            <Text style={styles.chartLegendText}>Odczuwalna energia</Text>
            <View style={styles.legendBox} />
            <Text style={styles.chartLegendText}>Sen</Text>
          </View>
          {view.energyPoints.length === 0 ? (
            <Text testID="energy-empty" style={styles.emptyNote}>
              Brak wpisów w tym okresie
            </Text>
          ) : null}
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Gdzie spędzasz czas</Text>
            <Text style={styles.cardMeta}>Ostatnie 7 dni</Text>
          </View>
          <View style={styles.map}>
            <HeatMap clusters={view.clusters} gpsEnabled={Boolean(settings?.gpsEnabled)} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 56 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: theme.colors.textPrimary },
  cardMeta: { fontSize: 14, color: theme.colors.textSecondary },
  donutRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 16 },
  legend: { flex: 1, gap: 9 },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 3, marginRight: 8 },
  legendName: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
  legendValue: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  legendEmpty: { fontSize: 14, color: theme.colors.textSecondary },
  averageBadge: {
    backgroundColor: theme.colors.amberBg,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  averageText: { fontSize: 14, fontWeight: '800', color: theme.colors.amberText },
  chart: { marginTop: 8, marginLeft: -4 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  legendLine: { width: 20, height: 4, borderRadius: 2, backgroundColor: theme.colors.primary },
  legendBox: {
    width: 20,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#ECEBF8',
    marginLeft: 14,
  },
  chartLegendText: { fontSize: 14, color: theme.colors.textSecondary },
  emptyNote: { fontSize: 13, color: theme.colors.textMuted, marginTop: 8 },
  map: { marginTop: 14 },
});
