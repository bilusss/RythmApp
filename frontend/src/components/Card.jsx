import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../styles/theme';

export default function Card({ children, style, testID }) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },
});
