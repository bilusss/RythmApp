// Every collection starts empty and every setting starts unset: nothing is pre-filled.
export const EMPTY_SETTINGS = {
  categories: [],
  notificationsCount: 0,
  wakeTime: '',
  sleepTime: '',
  notificationsEnabled: false,
  gpsEnabled: false,
};

export const initialState = { user: null, checkins: [], insight: null };

export function appReducer(state, action) {
  switch (action.type) {
    case 'sign-in':
      return {
        ...initialState,
        user: { email: action.email, isOnboarded: false, settings: EMPTY_SETTINGS },
      };
    case 'complete-onboarding':
      return { ...state, user: { ...state.user, isOnboarded: true, settings: action.settings } };
    case 'add-checkin':
      return { ...state, checkins: [...state.checkins, action.checkin], insight: null };
    case 'set-insight':
      return { ...state, insight: action.insight };
    case 'sign-out':
      return initialState;
    default:
      return state;
  }
}
