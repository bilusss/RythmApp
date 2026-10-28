import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { theme } from '../styles/theme';

const HEIGHT = 200;
const MARGIN = 0.2;

// Neutral street-map backdrop; carries no data, only gives the heat spots context.
function MapBackdrop({ width }) {
  const w = width;
  return (
    <>
      <Rect x={0} y={0} width={w} height={HEIGHT} fill="#EEF0F4" />
      <Rect x={w * 0.62} y={20} width={w * 0.22} height={46} rx={6} fill="#DCEFE0" />
      <Path
        d={`M 0 ${HEIGHT * 0.78} C ${w * 0.3} ${HEIGHT * 0.66}, ${w * 0.55} ${HEIGHT * 0.92}, ${w} ${HEIGHT * 0.74} L ${w} ${HEIGHT * 0.9} C ${w * 0.55} ${HEIGHT * 1.02}, ${w * 0.3} ${HEIGHT * 0.84}, 0 ${HEIGHT * 0.98} Z`}
        fill="#CFE3F3"
      />
      {[0.22, 0.48, 0.72].map((fraction) => (
        <Rect
          key={`v${fraction}`}
          x={w * fraction}
          y={0}
          width={7}
          height={HEIGHT}
          fill="#FFFFFF"
          opacity={0.9}
        />
      ))}
      {[0.28, 0.58].map((fraction) => (
        <Rect
          key={`h${fraction}`}
          x={0}
          y={HEIGHT * fraction}
          width={w}
          height={7}
          fill="#FFFFFF"
          opacity={0.9}
        />
      ))}
    </>
  );
}

function project(clusters, width) {
  const lats = clusters.map((item) => item.latitude);
  const lngs = clusters.map((item) => item.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const spanLat = maxLat - minLat;
  const spanLng = maxLng - minLng;
  const maxCount = Math.max(...clusters.map((item) => item.count));

  return clusters.map((item) => ({
    ...item,
    px:
      width *
      (spanLng === 0 ? 0.5 : MARGIN + ((item.longitude - minLng) / spanLng) * (1 - 2 * MARGIN)),
    py:
      HEIGHT *
      (spanLat === 0 ? 0.5 : MARGIN + ((maxLat - item.latitude) / spanLat) * (1 - 2 * MARGIN)),
    radius: 34 + 22 * (item.count / maxCount),
  }));
}

export default function HeatMap({ clusters, gpsEnabled }) {
  const [width, setWidth] = useState(0);
  const spots = width > 0 && clusters.length > 0 ? project(clusters, width) : [];

  const emptyMessage = gpsEnabled
    ? 'Brak danych o lokalizacji z ostatnich 7 dni'
    : 'Włącz lokalizację GPS w ustawieniach, aby zobaczyć mapę miejsc';

  return (
    <View>
      <View
        testID="heatmap"
        style={styles.map}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <RadialGradient id="heat" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#EF4444" stopOpacity={0.85} />
                <Stop offset="35%" stopColor="#F59E0B" stopOpacity={0.7} />
                <Stop offset="70%" stopColor="#FDE047" stopOpacity={0.35} />
                <Stop offset="100%" stopColor="#FDE047" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <MapBackdrop width={width} />
            {spots.map((spot) => (
              <Circle
                key={`${spot.latitude}:${spot.longitude}`}
                cx={spot.px}
                cy={spot.py}
                r={spot.radius}
                fill="url(#heat)"
              />
            ))}
          </Svg>
        ) : null}

        {spots.map((spot) => (
          <View
            key={`label-${spot.latitude}:${spot.longitude}`}
            pointerEvents="none"
            style={[styles.label, { left: spot.px, top: spot.py }]}
          >
            <Text style={styles.labelText}>{spot.label}</Text>
          </View>
        ))}

        {clusters.length === 0 ? (
          <View style={styles.empty} pointerEvents="none">
            <Text testID="heatmap-empty" style={styles.emptyText}>
              {emptyMessage}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>rzadko</Text>
        <Svg height={8} style={styles.legendBar}>
          <Defs>
            <LinearGradient id="scale" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#C8E67A" />
              <Stop offset="0.5" stopColor="#F5B800" />
              <Stop offset="1" stopColor="#EF4444" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={8} rx={4} fill="url(#scale)" />
        </Svg>
        <Text style={styles.legendText}>często</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: HEIGHT, borderRadius: 18, overflow: 'hidden', backgroundColor: '#EEF0F4' },
  label: {
    position: 'absolute',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  labelText: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
  empty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    maxWidth: 240,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  legendBar: { flex: 1 },
  legendText: { fontSize: 14, color: theme.colors.textSecondary },
});
