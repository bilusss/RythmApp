import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../styles/theme';

const THUMB = 18;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Draggable slider with discrete steps. A value below `min` (e.g. "not chosen yet")
 * renders the thumb at the start of the track.
 */
export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  fillColor = theme.colors.primary,
  thumbColor = theme.colors.sky,
  testID,
  accessibilityLabel,
}) {
  const [width, setWidth] = useState(0);
  const usable = Math.max(width - THUMB, 1);
  const ratio = clamp((value - min) / (max - min), 0, 1);

  const setFromX = (x) => {
    if (!width) return;
    const next = clamp((x - THUMB / 2) / usable, 0, 1);
    const stepped = Math.round((min + next * (max - min)) / step) * step;
    const clamped = clamp(stepped, min, max);
    if (clamped !== value) onChange(clamped);
  };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => {
        const delta = nativeEvent.actionName === 'increment' ? step : -step;
        onChange(clamp(Math.max(value, min) + delta, min, max));
      }}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={({ nativeEvent }) => setFromX(nativeEvent.locationX)}
      onResponderMove={({ nativeEvent }) => setFromX(nativeEvent.locationX)}
      style={styles.area}
    >
      <View pointerEvents="none" style={styles.track}>
        <View
          style={[styles.fill, { width: ratio * usable + THUMB / 2, backgroundColor: fillColor }]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: ratio * usable, backgroundColor: thumbColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  area: { height: 28, justifyContent: 'center' },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.track,
    overflow: 'hidden',
  },
  fill: { height: 10, borderRadius: 5 },
  thumb: {
    position: 'absolute',
    top: (28 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
