# Spotkanie 22.10 – Bielik lokalnie + backup xAI

## Cel
Postawić Bielika na PC z RTX 5070 Ti (włączony 24/7) i podłączyć go do RythmApp. Jeśli lokalny Bielik nie będzie wystarczający, przełączamy się na xAI API.

## 1. Sprzęt i model
- RTX 5070 Ti ma **16 GB VRAM** – to limit dla modelu.
- Model: **Bielik-11B-v2.x-Instruct** (SpeakLeash), wersja GGUF:
  - `Q4_K_M` (~7 GB) – komfortowo, duży kontekst, szybko,
  - `Q8_0` (~12 GB) – lepsza jakość, mniejszy kontekst.
- Gdyby 11B było za wolne: mniejsze Bieliki (4.5B / 1.5B).
- Dokładne nazwy i tagi sprawdzić na HuggingFace (`speakleash`) przed pobraniem.

## 2. Serwowanie modelu na PC
- **Ollama** (najprostsze) albo `llama.cpp server` / vLLM (więcej kontroli).
- Wystawia API zgodne z OpenAI: `http://<pc>:11434/v1/chat/completions`.
- W repo `homelab` jest już skonteneryzowana Ollama – można ją użyć zamiast stawiać od nowa.
- Tryb 24/7: wyłączyć uśpienie, Docker `restart: unless-stopped`, rezerwacja IP w routerze, opcjonalnie Wake-on-LAN.

## 3. Dostęp spoza domu
Nie wystawiać Ollamy bezpośrednio do internetu (brak autoryzacji).

| Opcja | Plusy | Minusy |
|---|---|---|
| **Tailscale** (zalecane) | zero otwartych portów, prywatnie, proste | każde urządzenie/serwer musi być w tailnecie |
| Cloudflare Tunnel + klucz API | publiczny URL, brak port forwardingu | trzeba dodać autoryzację (reverse proxy z kluczem) |

## 4. Połączenie z aplikacją
```
App (klient) ──► Backend RythmApp ──► LLM router ──┬─► Bielik (PC, przez Tailscale)
                                                   └─► xAI API (backup)
```
- Aplikacja **nie** rozmawia z LLM bezpośrednio – tylko przez backend (klucze i adres PC zostają po stronie serwera).
- Oba providery używają formatu OpenAI, więc zmienia się tylko `base_url`, klucz i nazwa modelu.
- **Fallback:** timeout ~5–10 s lub błąd health-checka Bielika → żądanie idzie do xAI.
- xAI: `https://api.x.ai/v1`, klucz w zmiennej `XAI_API_KEY` (nazwę modelu sprawdzić w dokumentacji xAI).

## 5. Proponowana struktura projektu
Stack aplikacji jeszcze nie ustalony – układ ogólny:
```
RythmApp/
├── app/                  # klient (mobilny/web)
├── backend/
│   └── llm/
│       ├── base.py       # wspólny interfejs providera
│       ├── bielik.py     # lokalny Bielik (OpenAI-compatible)
│       ├── xai.py        # backup xAI
│       └── router.py     # wybór providera + fallback + health-check
├── infra/
│   └── docker-compose.yml  # Ollama + Bielik na PC
├── docs/
│   └── spotkanie-22.10.md
├── .env.example          # BIELIK_BASE_URL, XAI_API_KEY, LLM_TIMEOUT
└── README.md
```

## 6. Następne kroki
1. Na PC: zainstalować Ollamę (lub użyć `homelab`) i pobrać Bielika GGUF.
2. Zainstalować Tailscale na PC i na maszynie z backendem.
3. Test: `curl` do `/v1/chat/completions` przez adres z Tailscale.
4. Zmierzyć szybkość (tokeny/s) i jakość odpowiedzi po polsku.
5. Zaimplementować `llm/router.py` z fallbackiem na xAI.
6. Ustalić stack aplikacji i uzupełnić README.

## Otwarte pytania
- Jaki stack (mobile/web, język backendu)?
- Do czego dokładnie aplikacja używa LLM (czat, generowanie, analiza)? Od tego zależy wymagany rozmiar modelu i opóźnienie.
- Budżet na xAI API jako backup.
