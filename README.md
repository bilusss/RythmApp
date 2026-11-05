# RythmApp

Aplikacja Expo (SDK 58) / React Native: tracker aktywności, nastroju i energii.

## Uruchomienie frontendu

Potrzebny Node 20+.

```bash
cd frontend
npm ci
npx expo start
```

Podgląd:

- **Telefon:** zainstaluj Expo Go dla SDK 58 i zeskanuj kod QR z terminala (telefon i komputer w tej samej sieci).
- **Emulator Androida:** w terminalu Expo naciśnij `a` (albo `npx expo start --android`).
- **Przeglądarka:** naciśnij `w` (albo `npm run web`). Przy pierwszym uruchomieniu może być potrzebne `npx expo install react-dom react-native-web @expo/metro-runtime`.

## Testy i lint

```bash
cd frontend
npm test
npm run lint
npm run format:check
```
