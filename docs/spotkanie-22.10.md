# Spotkanie 22.10 – Bielik na vLLM + Tailscale

## Cel
Postawić Bielika w **vLLM** na PC z RTX 5070 Ti (włączony 24/7) i połączyć go z backendem RythmApp (ESM Tracker) przez **Tailscale**. Bielik jest jedynym modelem – bez zewnętrznego API zapasowego.

## 1. Do czego używamy LLM
Tylko do **Ekranu 4 (AI Insights)** – patrz `opis_funkcjonalnosci.md`, sekcja 3.3.
- Użytkownik klika „Wyciągnij wnioski”, backend wysyła zanonimizowany JSON z wpisami (dzień tygodnia, godzina, kategoria, opis, nastrój, energia, miejsce).
- Model zwraca tekst główny + wskaźniki w JSON, zapisywane w tabeli `insights`.
- Zadanie jest asynchroniczne i nie wymaga niskiego opóźnienia. Miesiąc danych (~150 wpisów) to kilka tysięcy tokenów.

## 2. Model i pamięć GPU
- RTX 5070 Ti ma **16 GB VRAM** – to limit dla modelu.
- vLLM najlepiej działa na wagach HF (safetensors), a nie na GGUF (wsparcie GGUF jest eksperymentalne). Z tego wynika:
  - **Bielik-11B w bf16 (~22 GB) się nie zmieści.**
  - Opcje dla 11B: wersja skwantyzowana **FP8** (~11 GB, Blackwell ją wspiera), **AWQ/GPTQ 4-bit** (~6–7 GB) lub kwantyzacja w locie (bitsandbytes).
  - Opcja prostsza: **Bielik-4.5B** w bf16 (~9 GB), mniejsza jakość, ale dużo zapasu na kontekst.
- Trzeba zostawić miejsce na KV cache: ustawić `--max-model-len` (np. 8192–16384) i `--gpu-memory-utilization` (np. 0.90).
- Dokładne nazwy repozytoriów i dostępne kwantyzacje sprawdzić na HuggingFace (`speakleash`) przed pobraniem.
- Karta jest z architektury Blackwell – potrzebna **aktualna wersja vLLM z CUDA 12.8+**. Najbezpieczniej użyć oficjalnego obrazu `vllm/vllm-openai`.

## 3. Uruchomienie vLLM na PC
- Docker + **NVIDIA Container Toolkit**, serwer OpenAI-compatible:
  ```
  docker run -d --restart unless-stopped --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -p <IP_TAILSCALE_PC>:8000:8000 \
    vllm/vllm-openai:<wersja> \
    --model <repo-bielika> \
    --max-model-len 8192 \
    --gpu-memory-utilization 0.90 \
    --api-key <SEKRET>
  ```
  (nazwa modelu, wersja obrazu i flagi kwantyzacji do uzupełnienia po wyborze wariantu)
- Endpoint: `http://<pc>:8000/v1/chat/completions` (format OpenAI).
- `-p <IP_TAILSCALE_PC>:8000:8000` wiąże port **tylko** z interfejsem Tailscale, więc serwer nie jest widoczny w sieci domowej ani w internecie.
- `--api-key` to dodatkowa warstwa – vLLM sam nie ma autoryzacji.
- JSON z modelu: vLLM wspiera structured outputs (`response_format` z `json_schema`), co wymusza poprawny format odpowiedzi.
- Tryb 24/7: wyłączyć uśpienie, `restart: unless-stopped`, rezerwacja IP w routerze. Jeśli PC działa na Windows – vLLM przez WSL2/Docker Desktop (Linux jest prostszy).

## 4. Połączenie przez Tailscale
```
App mobilna ──► Backend RythmApp ──(tailnet)──► PC z RTX 5070 Ti: vLLM :8000
```
- Tailscale instalujemy na **PC z GPU** i na **maszynie z backendem** – obie w jednym tailnecie.
- Backend łączy się po adresie MagicDNS (np. `http://pc-gpu:8000/v1`) lub po IP `100.x.y.z`, adres w zmiennej `BIELIK_BASE_URL`, klucz w `BIELIK_API_KEY`.
- Zero otwartych portów i port forwardingu na routerze.
- **ACL w Tailscale:** pozwolić na dostęp do portu 8000 PC tylko z tagu backendu (np. `tag:backend` → `tag:gpu:8000`).
- Aplikacja mobilna **nie** łączy się z vLLM – tylko z backendem, więc telefony nie muszą być w tailnecie.
- Jeśli backend działa w chmurze: Tailscale na VPS-ie albo w kontenerze obok backendu (sidecar). Jeśli lokalnie – wystarczy zwykły klient Tailscale.
- Dane użytkownika (opisy, nastrój, miejsca) nie opuszczają naszej infrastruktury.
- Alternatywa, jeśli Tailscale nie wypali: Cloudflare Tunnel + klucz API.

## 5. Obsługa błędów (bez fallbacku)
- Timeout / niedostępny PC → ponowienie 1–2 razy z opóźnieniem, potem czytelny komunikat w aplikacji („Analiza chwilowo niedostępna, spróbuj później”).
- Ostatni wygenerowany wniosek jest cache’owany lokalnie w aplikacji (Ekran 4 ładuje się od razu), więc awaria PC nie psuje ekranu.
- Odpowiedź w JSON: structured outputs z vLLM + walidacja w `validators/`. Przy błędnym formacie – jedna ponowna próba.
- Health-check (`GET /health` w vLLM, np. co minutę) – jeśli PC leży, przycisk „Wyciągnij wnioski” może być od razu nieaktywny.

## 6. Struktura projektu
Zgodnie z aktualnym układem repo (stack backendu jeszcze nie ustalony):
```
RythmApp/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── llm/          # klient vLLM (OpenAI-compatible), budowa promptu, parsowanie JSON
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── validators/       # walidacja odpowiedzi modelu
│   │   └── utils/
│   └── tests/
├── frontend/                 # aplikacja mobilna (screens, navigation, hooks, state…)
├── infra/
│   └── vllm/
│       └── docker-compose.yml  # vLLM + Bielik na PC z GPU
├── docs/
└── .env.example              # BIELIK_BASE_URL, BIELIK_API_KEY, LLM_TIMEOUT
```
Uwaga: migracja `initial_migration.sql` leży w `frontend/src/migrations/`, a dotyczy bazy MySQL na serwerze – powinna trafić do `backend/`.

## 7. Następne kroki
1. Na PC: sterownik NVIDIA, Docker + NVIDIA Container Toolkit, Tailscale.
2. Wybrać wariant Bielika, który mieści się w 16 GB (FP8 / AWQ 11B albo 4.5B bf16).
3. Uruchomić vLLM (`infra/vllm/docker-compose.yml`) związany z IP Tailscale i z `--api-key`.
4. Test z maszyny backendu: `curl` do `/v1/chat/completions` przez tailnet.
5. Zmierzyć szybkość (tokeny/s) i jakość odpowiedzi po polsku na przykładowych wpisach ESM.
6. Ustawić ACL w Tailscale (tylko backend → port 8000).
7. Zaimplementować `services/llm/` z retry, timeoutem i walidacją JSON.
8. Ustalić stack backendu, przenieść migrację do `backend/`, uzupełnić README.

## Otwarte pytania
- Który wariant Bielika (11B skwantyzowany czy 4.5B)? Rozstrzygnie test jakości i szybkości.
- System operacyjny PC (Linux vs Windows/WSL2) – wpływa na instalację vLLM.
- Stack backendu i miejsce jego hostingu (chmura vs lokalnie) – od tego zależy, jak wpiąć backend w tailnet.
