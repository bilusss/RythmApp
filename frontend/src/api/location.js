/**
 * Current coordinates, or null when unavailable. Uses the platform geolocation API when it
 * exists (web); native builds need an expo-location based implementation here.
 */
export function getCurrentCoords() {
  const geolocation = globalThis.navigator?.geolocation;
  if (!geolocation?.getCurrentPosition) return Promise.resolve(null);

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}
