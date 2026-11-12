#!/usr/bin/env bash
# Bielik/vLLM helper: ./vllm.sh up|down|logs|status|test
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || { echo "Brak .env – skopiuj .env.example"; exit 1; }
set -a; . ./.env; set +a
URL="http://${VLLM_BIND_IP:-127.0.0.1}:${VLLM_PORT:-8000}"
case "${1:-status}" in
  up)     docker compose up -d && echo "Ładowanie trwa ~1–3 min: ./vllm.sh logs" ;;
  down)   docker compose down ;;
  logs)   docker compose logs -f --tail 100 ;;
  status) docker compose ps; curl -fs "$URL/health" >/dev/null && echo "health: OK ($URL)" || echo "health: niedostępny ($URL)"
          nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader ;;
  test)   BIELIK_BASE_URL="$URL/v1" python3 -I smoke_test.py ;;
  *)      echo "użycie: $0 up|down|logs|status|test"; exit 1 ;;
esac
