import { Alert, Platform } from 'react-native';

// Alert.alert does nothing on web, so fall back to window.alert there.
export function notify(title, message) {
  if (Platform.OS === 'web') globalThis.alert?.(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}
