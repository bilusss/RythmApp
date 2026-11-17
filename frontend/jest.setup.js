// Native safe-area insets do not exist under Jest: use the library's mock (zero insets, children render).
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);
