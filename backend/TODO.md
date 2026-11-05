# Backend TODO

## Waiting for the Supabase project
- [ ] Create the Supabase project
- [ ] Run `migrations/001_init.sql` in the SQL editor
- [ ] Copy `.env.example` to `.env`; fill `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (Settings -> API, service_role key, server only)
- [ ] Auth settings: decide on email confirmation; set the password-reset redirect URL
- [ ] Frontend: add `@supabase/supabase-js`, do sign-up / sign-in / `resetPasswordForEmail` there, send `Authorization: Bearer <access_token>` to this API (store the session in expo-secure-store)
- [ ] Smoke test: sign up in the app, `PUT /me`, `POST /checkins`, `GET /dashboard`

## Later
- [ ] Bielik: set `BIELIK_BASE_URL`, `BIELIK_API_KEY`, `BIELIK_MODEL` once vLLM is running
- [ ] Push notifications: send in `scheduler.js` `tick()` (FCM / Expo push) + the app must `PUT /me { push_token }`
- [ ] Use `profiles.timezone` in `planDay` and the dashboard hourly energy (currently server time)
- [ ] Check that `category_id` belongs to the user on check-in writes
- [ ] Spec says insights cluster GPS; we only round to ~1 km (`anonymise`), fine for now
