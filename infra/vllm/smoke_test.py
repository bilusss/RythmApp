"""Smoke test of the AI Insights contract (docs/opis_funkcjonalnosci.md, 3.3) against vLLM.

Sends sample anonymised ESM entries and forces the answer into a JSON schema (structured outputs).
Env: BIELIK_BASE_URL (e.g. http://100.x.y.z:8000/v1), BIELIK_API_KEY. Stdlib only.
"""
import json
import os
import time
import urllib.request

BASE = os.environ.get("BIELIK_BASE_URL", "http://127.0.0.1:8000/v1").rstrip("/")
KEY = os.environ["BIELIK_API_KEY"]

ENTRIES = [
    {"dzien": "poniedziałek", "godzina": "08:40", "kategoria": "Jazda autem", "opis": "korek do pracy", "nastroj": 2, "energia": 35, "miejsce": "M2"},
    {"dzien": "poniedziałek", "godzina": "11:15", "kategoria": "Praca", "opis": "code review, spokojnie", "nastroj": 4, "energia": 70, "miejsce": "M1"},
    {"dzien": "poniedziałek", "godzina": "15:30", "kategoria": "Praca", "opis": "długie spotkanie bez agendy", "nastroj": 2, "energia": 30, "miejsce": "M1"},
    {"dzien": "poniedziałek", "godzina": "19:50", "kategoria": "Relaks", "opis": "bieganie w parku", "nastroj": 5, "energia": 80, "miejsce": "M3"},
    {"dzien": "wtorek", "godzina": "09:05", "kategoria": "Nauka", "opis": "C++ szablony, kawa", "nastroj": 4, "energia": 75, "miejsce": "M0"},
    {"dzien": "wtorek", "godzina": "13:40", "kategoria": "Praca", "opis": "po obiedzie, senność", "nastroj": 3, "energia": 40, "miejsce": "M1"},
    {"dzien": "wtorek", "godzina": "17:20", "kategoria": "Obowiązki domowe", "opis": "zakupy i pranie", "nastroj": 3, "energia": 50, "miejsce": "M0"},
    {"dzien": "wtorek", "godzina": "21:30", "kategoria": "Relaks", "opis": "serial z dziewczyną", "nastroj": 5, "energia": 45, "miejsce": "M0"},
    {"dzien": "środa", "godzina": "07:50", "kategoria": "Relaks", "opis": "poranny spacer", "nastroj": 4, "energia": 65, "miejsce": "M3"},
    {"dzien": "środa", "godzina": "12:10", "kategoria": "Praca", "opis": "debugowanie produkcji, stres", "nastroj": 1, "energia": 55, "miejsce": "M1"},
]

SCHEMA = {
    "type": "object",
    "properties": {
        "podsumowanie": {"type": "string"},
        "najszczesliwszy_gdy": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
        "pozytywny_wplyw": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
        "negatywny_wplyw": {"type": "array", "items": {"type": "string"}, "maxItems": 3},
        "szczyt_energii_godzina": {"type": "integer", "minimum": 0, "maximum": 23},
        "dolek_energii_godzina": {"type": "integer", "minimum": 0, "maximum": 23},
    },
    "required": ["podsumowanie", "najszczesliwszy_gdy", "pozytywny_wplyw", "negatywny_wplyw",
                 "szczyt_energii_godzina", "dolek_energii_godzina"],
    "additionalProperties": False,
}

SYSTEM = (
    "Jesteś analitykiem danych z badania ESM (Experience Sampling Method). Dostajesz wpisy użytkownika: "
    "dzień tygodnia, godzina, kategoria, opis, nastrój (1-5), energia (0-100%), identyfikator miejsca. "
    "Szukaj korelacji między opisami, porą dnia, kategoriami i miejscami a nastrojem i energią. "
    "Opieraj się wyłącznie na danych, nie wymyślaj faktów. Pisz po polsku, zwięźle, w drugiej osobie."
)

body = {
    "model": "bielik",
    "messages": [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": "Wpisy:\n" + json.dumps(ENTRIES, ensure_ascii=False)},
    ],
    "temperature": 0.3,
    "max_tokens": 800,
    "response_format": {"type": "json_schema", "json_schema": {"name": "insights", "schema": SCHEMA, "strict": True}},
}

req = urllib.request.Request(
    BASE + "/chat/completions",
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"},
)
t0 = time.time()
with urllib.request.urlopen(req, timeout=180) as r:
    resp = json.load(r)
dt = time.time() - t0
content = resp["choices"][0]["message"]["content"]
usage = resp["usage"]
parsed = json.loads(content)  # fails loudly if the model broke the format
missing = set(SCHEMA["required"]) - parsed.keys()
assert not missing, f"brak pól: {missing}"
print(json.dumps(parsed, ensure_ascii=False, indent=2))
print(f"\nOK: {usage['prompt_tokens']} tok in, {usage['completion_tokens']} tok out, "
      f"{dt:.1f} s, {usage['completion_tokens'] / dt:.1f} tok/s")
