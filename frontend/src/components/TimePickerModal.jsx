import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from './Button';
import { formatTime12, makeTime, timeToMinutes } from '../utils/date';
import { theme } from '../styles/theme';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

export default function TimePickerModal({ visible, title, value, onConfirm, onCancel }) {
  const initial = timeToMinutes(value) ?? 0;
  const [hour, setHour] = useState(Math.floor(initial / 60));
  const [minute, setMinute] = useState(initial % 60);

  const selected = makeTime(hour, minute);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview}>{formatTime12(selected)}</Text>

          <Text style={styles.sectionLabel}>Godzina</Text>
          <View style={styles.grid}>
            {HOURS.map((item) => (
              <Option
                key={item}
                testID={`hour-${item}`}
                label={String(item).padStart(2, '0')}
                active={item === hour}
                onPress={() => setHour(item)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Minuta</Text>
          <View style={styles.grid}>
            {MINUTES.map((item) => (
              <Option
                key={item}
                testID={`minute-${item}`}
                label={String(item).padStart(2, '0')}
                active={item === minute}
                onPress={() => setMinute(item)}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button testID="time-confirm" title="Gotowe" onPress={() => onConfirm(selected)} />
            <TouchableOpacity testID="time-cancel" onPress={onCancel} style={styles.cancel}>
              <Text style={styles.cancelText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({ label, active, onPress, testID }) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[styles.option, active && styles.optionActive]}
    >
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 31, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 28,
  },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  preview: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 6,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 10,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    width: 46,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: { backgroundColor: theme.colors.primary },
  optionText: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  optionTextActive: { color: theme.colors.primaryText },
  actions: { marginTop: 20 },
  cancel: { alignItems: 'center', paddingTop: 14 },
  cancelText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
});
