import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import CategoryPill from '../components/CategoryPill';
import { BoltIcon, FilterIcon, MoodIcon } from '../components/Icons';
import ScreenHeader from '../components/ScreenHeader';
import { theme } from '../styles/theme';
import { dayKey, formatDayHeading, formatTime, pluralize } from '../utils/date';
import { doneCheckins } from '../utils/stats';

export default function HistoryScreen({ checkins, categories, now = new Date() }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const groups = useMemo(() => {
    const entries = doneCheckins(checkins)
      .filter((item) => categoryFilter === null || item.categoryId === categoryFilter)
      .sort((a, b) => b.scheduledAt - a.scheduledAt);

    const byDay = new Map();
    entries.forEach((item) => {
      const key = dayKey(item.scheduledAt);
      byDay.set(key, [...(byDay.get(key) ?? []), item]);
    });
    return [...byDay.entries()].map(([key, items]) => ({ key, date: items[0].scheduledAt, items }));
  }, [checkins, categoryFilter]);

  const categoryOf = (id) => categories.find((category) => category.id === id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Twoje check-iny"
          title="Historia"
          action={<FilterIcon />}
          onActionPress={() => setFilterOpen((open) => !open)}
          actionTestID="toggle-filter"
        />

        {filterOpen ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <FilterChip
              testID="filter-all"
              label="Wszystkie"
              active={categoryFilter === null}
              onPress={() => setCategoryFilter(null)}
            />
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                testID={`filter-${category.name}`}
                label={category.name}
                active={categoryFilter === category.id}
                onPress={() => setCategoryFilter(category.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        {groups.length === 0 ? (
          <Card testID="history-empty" style={styles.empty}>
            <Text style={styles.emptyTitle}>Brak wpisów</Text>
            <Text style={styles.emptyText}>
              {categoryFilter === null
                ? 'Zapisane check-iny pojawią się tutaj. Dodaj pierwszy przyciskiem +.'
                : 'Brak wpisów w tej kategorii.'}
            </Text>
          </Card>
        ) : (
          groups.map((group) => (
            <View key={group.key} testID={`day-${group.key}`}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{formatDayHeading(group.date, now)}</Text>
                <Text style={styles.dayCount}>
                  {group.items.length} {pluralize(group.items.length, ['wpis', 'wpisy', 'wpisów'])}
                </Text>
              </View>
              <Card style={styles.dayCard}>
                {group.items.map((item, index) => {
                  const category = categoryOf(item.categoryId);
                  return (
                    <View
                      key={item.id}
                      testID={`entry-${item.id}`}
                      style={[styles.row, index > 0 && styles.rowDivider]}
                    >
                      <Text style={styles.time}>{formatTime(item.scheduledAt)}</Text>
                      <View style={styles.category}>
                        {category ? <CategoryPill category={category} /> : null}
                      </View>
                      <BoltIcon size={16} />
                      <Text style={styles.energy}>{item.energyLevel} %</Text>
                      <MoodIcon value={item.mood} size={34} tinted />
                    </View>
                  );
                })}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, testID }) {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 56 },
  filters: { gap: 8, paddingBottom: 14 },
  chip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.primaryText },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  dayTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  dayCount: { fontSize: 14, color: theme.colors.textSecondary },
  dayCard: { paddingVertical: 4, paddingHorizontal: 16, marginBottom: 20 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.divider },
  time: { width: 56, fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  category: { flex: 1, paddingRight: 8 },
  energy: {
    width: 52,
    marginLeft: 4,
    marginRight: 10,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.amberText,
  },
  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
});
