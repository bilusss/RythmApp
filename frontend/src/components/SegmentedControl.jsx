import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';

export default function SegmentedControl({ tabs, activeTab, onTabChange, testID }) {
  return (
    <View style={styles.container} testID={testID}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            testID={`tab-${tab.value}`}
            activeOpacity={0.8}
            onPress={() => onTabChange(tab.value)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, isActive ? styles.activeTabText : styles.inactiveTabText]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.segmentBackground,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm + 2,
  },
  activeTab: {
    backgroundColor: theme.colors.segmentActive,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
  },
  activeTabText: {
    color: theme.colors.segmentActiveText,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: theme.colors.segmentInactiveText,
    fontWeight: '500',
  },
});
