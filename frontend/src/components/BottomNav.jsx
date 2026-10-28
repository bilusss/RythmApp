import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarsIcon, CalendarIcon, PlusIcon, SparkIcon, UserIcon } from './Icons';
import { theme } from '../styles/theme';

const ITEMS = [
  { value: 'dashboard', label: 'Dzisiaj', Icon: BarsIcon },
  { value: 'history', label: 'Historia', Icon: CalendarIcon },
  { value: 'add' },
  { value: 'insights', label: 'Insights', Icon: SparkIcon },
  { value: 'profile', label: 'Profil', Icon: UserIcon },
];

const INACTIVE = '#6B7280';

export default function BottomNav({ active, onChange, onAdd }) {
  return (
    <View style={styles.bar}>
      {ITEMS.map((item) => {
        if (item.value === 'add') {
          return (
            <View key="add" style={styles.addSlot}>
              <TouchableOpacity
                testID="nav-add"
                accessibilityLabel="Dodaj wpis"
                activeOpacity={0.9}
                onPress={onAdd}
                style={styles.addButton}
              >
                <PlusIcon size={30} />
              </TouchableOpacity>
            </View>
          );
        }

        const isActive = active === item.value;
        const color = isActive ? theme.colors.primary : INACTIVE;
        return (
          <TouchableOpacity
            key={item.value}
            testID={`nav-${item.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(item.value)}
            style={styles.item}
          >
            <item.Icon size={26} color={color} />
            <Text style={[styles.label, { color }, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 8,
    shadowColor: '#1B1F33',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 2 },
  label: { fontSize: 13, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
  addSlot: { flex: 1, alignItems: 'center' },
  addButton: {
    width: 68,
    height: 68,
    marginTop: -42,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.card,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
});
