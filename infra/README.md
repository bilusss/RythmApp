# Infrastruktura (PC z RTX 5070 Ti, działa 24/7)

```
Aplikacja (Mac / telefon) ──HTTPS──► Cloudflare ──tunel──► backend 127.0.0.1:3001 ──► Supabase (chmura)
                                                                  └──► vLLM / Bielik 127.0.0.1:8000
```

| Element | Gdzie | Start / stan |
|---|---|---|
| Bielik-11B-v3.1 FP8 (vLLM) | kontener `rythm-vllm`, `infra/vllm/` | `infra/vllm/vllm.sh up\|status\|test` |
| Backend (Express) | systemd --user `rythm-backend`, `backend/.env` | `systemctl --user status rythm-backend`, `journalctl --user -u rythm-backend -f` |
| Tunel Cloudflare `rythmapp` | kontener `rythm-tunnel`, `infra/cloudflared/` | `docker compose -f infra/cloudflared/docker-compose.yml up -d` |
| Baza + logowanie | Supabase `etubqkilyushiksjrvgv` | panel Supabase |

Publiczny adres API: **https://rythm-api.lukasz-bilski.eu** (`/health` bez logowania).

## Bezpieczeństwo
- Na PC i routerze nie ma otwartych portów. Backend i vLLM słuchają tylko na `127.0.0.1`, a z zewnątrz da się wejść wyłącznie przez tunel.
- Wszystko poza `/health` i `/auth/signup` wymaga tokenu Supabase (`Authorization: Bearer`).
- Limity zapytań: 120/min na IP, 5 rejestracji/h na IP, 20 analiz LLM/h na użytkownika.
- Klucz Supabase secret, klucz API vLLM i token tunelu są tylko w plikach `.env` na PC (w `.gitignore`).
- Do LLM trafiają zanonimizowane wpisy (bez id, maila i współrzędnych) i nie opuszczają PC.

Usługa `rythm-backend` startuje razem z sesją użytkownika `bilus`. Żeby startowała po reboocie bez logowania:
`sudo loginctl enable-linger bilus`.
