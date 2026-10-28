import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../styles/theme';

/**
 * Logo component for Rytm.
 * Renders the rounded squircle indigo badge with a compact, higher-amplitude ECG pulse wave.
 */
export default function Logo({ size = 68, testID = 'app-logo' }) {
  // Width kept compact (~44%), height increased to ~35% for a taller, higher wave amplitude.
  const svgWidth = Math.round(size * 0.44);
  const svgHeight = Math.round(size * 0.35);

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
        },
      ]}
    >
      <Svg width={svgWidth} height={svgHeight} viewBox="0 0 36 28" style={styles.svg}>
        <Path
          d="M 1.5 14 L 8.5 14 L 15 2.5 L 22 25.5 L 27.5 14 L 34.5 14"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  svg: {
    backgroundColor: 'transparent',
  },
});
