import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { smoothPath } from '../utils/chart';
import { energyAt } from '../utils/stats';
import { formatTime, timeToMinutes } from '../utils/date';
import { theme } from '../styles/theme';

const HEIGHT = 196;
const PAD = { left: 40, right: 12, top: 34, bottom: 30 };
const X_TICKS = [0, 6, 12, 18, 24];
const SLEEP_FILL = '#ECEBF8';

// Sleep time -> list of [fromHour, toHour] bands inside the 0..24 axis.
function sleepBands(wakeTime, sleepTime) {
  const wake = timeToMinutes(wakeTime);
  const sleep = timeToMinutes(sleepTime);
  if (wake === null || sleep === null || wake === sleep) return [];
  const [wakeHour, sleepHour] = [wake / 60, sleep / 60];
  return sleepHour > wakeHour
    ? [
        [0, wakeHour],
        [sleepHour, 24],
      ]
    : [[sleepHour, wakeHour]];
}

/** 24-hour energy curve with sleep zone, average line and a marker for the current time. */
export default function EnergyChart({ points, average, wakeTime, sleepTime, now = new Date() }) {
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(width - PAD.left - PAD.right, 0);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const x = (hour) => PAD.left + (hour / 24) * plotWidth;
  const y = (value) => PAD.top + (1 - value / 100) * plotHeight;

  const coords = points.map((point) => ({ x: x(point.x), y: y(point.value) }));
  const line = smoothPath(coords);
  const area =
    coords.length > 1
      ? `${line} L ${coords[coords.length - 1].x} ${y(0)} L ${coords[0].x} ${y(0)} Z`
      : '';

  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowValue = energyAt(points, nowHour);
  const nowX = x(nowHour);
  const tooltipWidth = 46;
  const tooltipX = Math.min(
    Math.max(nowX - tooltipWidth / 2, PAD.left),
    width - PAD.right - tooltipWidth
  );

  return (
    <View
      testID="energy-chart"
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      style={styles.container}
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {sleepBands(wakeTime, sleepTime).map(([from, to]) => (
            <Rect
              key={`${from}-${to}`}
              x={x(from)}
              y={PAD.top}
              width={x(to) - x(from)}
              height={plotHeight}
              fill={SLEEP_FILL}
            />
          ))}

          {[100, 50, 0].map((tick) => (
            <React.Fragment key={tick}>
              <Line
                x1={PAD.left}
                x2={PAD.left + plotWidth}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#E6E7EF"
                strokeWidth={1}
              />
              <SvgText
                x={PAD.left - 10}
                y={y(tick) + 4}
                fontSize={12}
                fill={theme.colors.textSecondary}
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          ))}

          {X_TICKS.map((tick) => (
            <SvgText
              key={tick}
              x={x(tick)}
              y={HEIGHT - 8}
              fontSize={12}
              fill={theme.colors.textSecondary}
              textAnchor={tick === 0 ? 'start' : tick === 24 ? 'end' : 'middle'}
            >
              {`${tick}:00`}
            </SvgText>
          ))}

          {points.length > 0 ? (
            <Line
              x1={PAD.left}
              x2={PAD.left + plotWidth}
              y1={y(average)}
              y2={y(average)}
              stroke="#C9C7EE"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ) : null}

          {area ? <Path d={area} fill="#3E39C3" fillOpacity={0.08} /> : null}
          {line ? (
            <Path
              d={line}
              stroke={theme.colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
          {points.length <= 8
            ? coords.map((coord, index) => (
                <Circle
                  key={points[index].hour}
                  cx={coord.x}
                  cy={coord.y}
                  r={3.5}
                  fill={theme.colors.primary}
                />
              ))
            : null}

          <Line
            x1={nowX}
            x2={nowX}
            y1={PAD.top - 4}
            y2={y(0)}
            stroke="#8F8CD9"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          <Rect
            x={tooltipX}
            y={4}
            width={tooltipWidth}
            height={24}
            rx={8}
            fill={theme.colors.ink}
          />
          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={20}
            fontSize={12}
            fontWeight="700"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            {formatTime(now)}
          </SvgText>
          {nowValue !== null ? (
            <Circle
              cx={nowX}
              cy={y(nowValue)}
              r={6}
              fill="#FFFFFF"
              stroke={theme.colors.primary}
              strokeWidth={3}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: HEIGHT, width: '100%' },
});
