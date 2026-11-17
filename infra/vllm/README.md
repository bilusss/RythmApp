# Bielik na vLLM (PC z RTX 5070 Ti)

Model: [`speakleash/Bielik-11B-v3.1-Instruct-FP8-Dynamic`](https://huggingface.co/speakleash/Bielik-11B-v3.1-Instruct-FP8-Dynamic)
(11.4 GB, Apache-2.0), serwowany jako `bielik` przez API zgodne z OpenAI. Kontekst 16k, KV cache w FP8.

## Uruchomienie

```bash
# jednorazowo: wagi do ~/.cache/huggingface (kontener startuje offline)
uvx --from huggingface_hub hf download speakleash/Bielik-11B-v3.1-Instruct-FP8-Dynamic
cp .env.example .env           # i ustaw BIELIK_API_KEY: openssl rand -hex 32
./vllm.sh up                   # start (restart: unless-stopped -> wstaje po reboocie)
./vllm.sh status               # health + zajęte VRAM
./vllm.sh test                 # przykładowe wpisy ESM -> JSON z wnioskami
./vllm.sh logs | down
```

vLLM zajmuje ~90% VRAM cały czas. Inne modele na tej karcie (np. llama-swap) się obok nie zmieszczą.

## Wywołanie z backendu

```bash
curl $BIELIK_BASE_URL/chat/completions \
  -H "Authorization: Bearer $BIELIK_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"bielik","messages":[{"role":"user","content":"Cześć"}]}'
```

Dowolny klient OpenAI działa po ustawieniu `base_url=BIELIK_BASE_URL`, `api_key=BIELIK_API_KEY`.
Format odpowiedzi wymuszamy przez `response_format: {type: "json_schema", ...}`; pełny przykład z promptem
i schematem Insights jest w `smoke_test.py`.

## Tailscale (dostęp backendu)

Port jest domyślnie związany z `127.0.0.1`. Żeby backend miał dostęp przez tailnet:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --hostname pc-gpu --advertise-tags=tag:gpu
tailscale ip -4                # -> wpisz jako VLLM_BIND_IP w .env
./vllm.sh down && ./vllm.sh up
```

Backend: `BIELIK_BASE_URL=http://pc-gpu:8000/v1`. ACL w panelu Tailscale: tylko `tag:backend` -> `tag:gpu:8000`.
Uwaga: po reboocie interfejs Tailscale może dostać IP później niż wstanie Docker. Wtedy bind się nie uda i trzeba
zrobić `./vllm.sh up` ręcznie.

## Backend na tym samym PC (najprościej)

Jeśli `backend/` działa na tym PC, Tailscale nie jest potrzebny: `BIELIK_BASE_URL=http://127.0.0.1:8000/v1`.
Backend sam łączy się z Supabase (chmura, ruch wychodzący), a telefon potrzebuje tylko publicznego adresu backendu
(np. Cloudflare Tunnel na port 3000). Test samego połączenia backend -> Bielik, bez Supabase:

```bash
cd backend && node --env-file=.env scripts/bielik-smoke.js
```
