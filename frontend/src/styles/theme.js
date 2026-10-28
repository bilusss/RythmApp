export const theme = {
  colors: {
    // Screen background: light soft lilac-gray from mockup
    background: '#F4F5F9',
    // Card background: clean white
    card: '#FFFFFF',
    // Primary purple/indigo from mockup (logo & action buttons)
    primary: '#3E39C3',
    primaryHover: '#332EA6',
    primaryText: '#FFFFFF',

    // Text colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textLink: '#3E39C3',

    // Inputs
    inputBackground: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputBorderFocus: '#3E39C3',
    iconColor: '#6B7280',

    // Segmented Control (Tabs)
    segmentBackground: '#E6E6F0',
    segmentActive: '#FFFFFF',
    segmentActiveText: '#111827',
    segmentInactiveText: '#6B7280',

    // Status
    error: '#DC2626',

    // Surfaces & accents shared by the app screens
    ink: '#1B1F33',
    lilac: '#ECE8FF',
    divider: '#F0F1F5',
    track: '#E3E5EC',
    amberBg: '#FFF1C9',
    amberText: '#8A5A00',
    amberAccent: '#F2B400',
    sky: '#087CF2',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    input: 16,
    card: 24,
    pill: 9999,
  },
  typography: {
    title: {
      fontSize: 26,
      fontWeight: '700', // Crisp bold, not overly heavy
      color: '#111827',
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '400', // Clean regular for clear visual hierarchy
      color: '#6B7280',
      lineHeight: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600', // Semi-bold for sharp, legible labels
      color: '#111827',
    },
    input: {
      fontSize: 15,
      fontWeight: '400', // Regular text for comfortable typing
      color: '#111827',
    },
    button: {
      fontSize: 16,
      fontWeight: '600', // Professional semi-bold action button
    },
    link: {
      fontSize: 13,
      fontWeight: '600', // Semi-bold link
      color: '#3E39C3',
    },
  },
};
