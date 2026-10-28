import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../styles/theme';

const GAP = 3;

/** Ring chart. Segments are `{ value, color }`; with no data a neutral ring is drawn. */
export default function DonutChart({ segments, size = 124, strokeWidth = 17, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visible = segments.filter((segment) => segment.value > 0);

  const arcs = visible.map((segment, index) => ({
    ...segment,
    length: (segment.value / total) * circumference,
    offset: visible
      .slice(0, index)
      .reduce((sum, item) => sum + (item.value / total) * circumference, 0),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={total === 0 ? '#ECEDF3' : 'transparent'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {arcs.map((arc) => {
          const gap = arcs.length > 1 ? Math.min(GAP, arc.length / 2) : 0;
          const dash = Math.max(arc.length - gap, 0.01);
          return (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-(arc.offset + gap / 2)}
              fill="none"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

export function DonutCenter({ value, caption }) {
  return (
    <>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  svg: { position: 'absolute' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary },
  caption: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
});
