import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CategoryPill({ category }) {
  return (
    <View style={[styles.pill, { backgroundColor: category.background }]}>
      <View style={[styles.dot, { backgroundColor: category.color }]} />
      <Text numberOfLines={1} style={[styles.text, { color: category.text }]}>
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  text: { fontSize: 14, fontWeight: '600' },
});
