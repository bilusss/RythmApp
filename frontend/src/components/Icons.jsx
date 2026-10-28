import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function MailIcon({ size = 18, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="4.5" width="19" height="15" rx="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M3 6.5L12 13.5L21 6.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LockIcon({ size = 18, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="10" width="16" height="11" rx="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M7.5 10V6.5A4.5 4.5 0 0 1 12 2a4.5 4.5 0 0 1 4.5 4.5V10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="15.5" r="1.2" fill={color} />
    </Svg>
  );
}

export function EyeIcon({ size = 20, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function EyeOffIcon({ size = 20, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 24, color = '#3E39C3' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10a6 6 0 0 1 12 0c0 5 2 5 2 6H4c0-1 2-1 2-6Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 19a2.2 2.2 0 0 0 4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function LocationIcon({ size = 24, color = '#2CA26F' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="2.2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function SunIcon({ size = 16, color = '#76561D' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoonIcon({ size = 16, color = '#3E39C3' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClockIcon({ size = 20, color = '#111827' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BarsIcon({ size = 24, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20h16M7 20V8M12 20V4M17 20v-9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 24, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="15" rx="3.5" stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function SparkIcon({ size = 24, color = '#6B7280', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C12.600 8 14 10.500 21 12C14 13.500 12.600 16 12 21C11.400 16 10 13.500 3 12C10 10.500 11.400 8 12 3Z"
        stroke={color}
        fill={filled ? color : 'none'}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4.500 20.500c.8-3.900 3.700-6 7.500-6s6.700 2.100 7.500 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 28, color = '#FFFFFF', strokeWidth = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SlidersIcon({ size = 22, color = '#111827' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h9M17 8h3M4 16h3M11 16h9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="15" cy="8" r="2.2" stroke={color} strokeWidth={1.8} />
      <Circle cx="9" cy="16" r="2.2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function FilterIcon({ size = 22, color = '#111827' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 12h10M10 17h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function BoltIcon({ size = 18, color = '#8A5A00', filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2.500 5 13.500h6l-1 8 8-11h-6l1-8Z"
        stroke={color}
        fill={filled ? color : 'none'}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = '#273A75' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m5 12.500 4.500 4.500L19 7.500"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const MOOD_FILL = {
  1: '#FFD2CF',
  2: '#FFE2D2',
  3: 'none',
  4: '#FFE48A',
  5: '#FFD84D',
};

const MOUTHS = {
  1: 'M8 17c1-2.200 2.500-3 4-3s3 .8 4 3',
  2: 'M8.500 16.200c1-1.300 2.100-1.800 3.500-1.800s2.500.5 3.500 1.800',
  3: 'M8.500 15.500h7',
  4: 'M8 14c1 2 2.500 3 4 3s3-1 4-3',
};

/**
 * Mood face for a 1-5 rating. `tinted` fills the face with the mood colour
 * (history rows / selected option); otherwise only the outline is drawn.
 */
export function MoodIcon({ value, size = 30, color = '#2B2F45', tinted = false }) {
  const fill = tinted ? MOOD_FILL[value] : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.500" stroke={color} fill={fill} strokeWidth={1.8} />
      <Circle cx="9" cy="10" r="1.100" fill={color} />
      <Circle cx="15" cy="10" r="1.100" fill={color} />
      {value === 5 ? (
        <Path d="M7.800 13.500h8.400a4.200 4.200 0 0 1-8.400 0Z" fill={color} />
      ) : (
        <Path d={MOUTHS[value]} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      )}
    </Svg>
  );
}
