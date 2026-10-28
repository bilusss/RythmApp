import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';

export default function ScreenHeader({ eyebrow, title, action, onActionPress, actionTestID }) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      {action ? (
        <TouchableOpacity
          testID={actionTestID}
          activeOpacity={0.8}
          onPress={onActionPress}
          style={styles.action}
        >
          {action}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  copy: { flex: 1 },
  eyebrow: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 6 },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: theme.colors.textPrimary,
  },
  action: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B1F33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});
