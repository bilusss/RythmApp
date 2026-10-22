# Specyfikacja Funkcjonalna i Systemowa Aplikacji Mobilnej (ESM Tracker)

## 1. Opis Ogólny (High-Level Overview)

Aplikacja służy do badania produktywności, samopoczucia oraz poziomu energii użytkownika w ciągu dnia za pomocą metody **ESM (Experience Sampling Method)** – czyli wyrywkowego próbkowania doświadczeń w czasie rzeczywistym. 

Zamiast polegać na retrospektywnej ocenie dnia wieczorem, aplikacja wysyła w losowych momentach dnia powiadomienia Push (w ramach zdefiniowanych godzin aktywności), prosząc o szybki raport (tzw. **Check-in**): co użytkownik robi, jak się czuje i jaki ma poziom energii, automatycznie przypisując do wpisu lokalizację GPS. Zebrane dane są agregowane na wykresach kołowych, liniowych, mapie cieplnej oraz analizowane przez model sztucznej inteligencji (AI Insights).

### Główne filary działania systemu:
1. **Personalizacja (Onboarding):** Dostosowanie kategorii czasu, harmonogramu dobowego, dziennej liczby powiadomień oraz zgód systemowych.
2. **Wyzwalacz (Smart Trigger):** Silnik losujący godziny powiadomień w ciągu dnia oraz możliwość ręcznego dodania wpisu w dowolnym momencie (przycisk `+`).
3. **Zbieranie danych (Check-in):** Błyskawiczny formularz rejestracji stanu z obsługą zaległych powiadomień oraz opcją ich pominięcia.
4. **Analityka i AI (Dashboard, Insights, Historia):** Wizualizacja podziału czasu, dobowej krzywej energii, najczęstszych lokalizacji oraz korelacji behawioralnych wyliczanych przez AI.

---

## 2. Struktura Ekranów i Funkcjonalności (UI/UX)

Aplikacja składa się z **6 głównych ekranów**. Ekrany `3. Dashboard`, `4. Insights` oraz `5. Historia` dzielą wspólny dolny pasek nawigacyjny (Bottom Navigation Bar) z wyróżnionym przyciskiem `+` służącym do ręcznego dodawania wpisów.

### Ekran 0: Logowanie i Rejestracja
Ekran uwierzytelniania użytkownika.
* **Zbierane dane:** Adres e-mail oraz hasło.
* **Elementy interfejsu:**
  * Przełącznik trybu widoku: *Logowanie / Rejestracja*.
  * Linki pomocnicze: *„Nie pamiętasz hasła?”* (uruchamia procedurę resetu) oraz *„Załóż konto”*.
* **Logika przejścia:** Po pierwszym zarejestrowaniu użytkownik trafia na `Ekran 1 (Konfiguracja)`. Jeśli konto ma już ukończoną konfigurację (`is_onboarded = true`), użytkownik trafia bezpośrednio na `Ekran 3 (Dashboard)`.

### Ekran 1: Konfiguracja (Onboarding)
Ekran początkowej personalizacji aplikacji (dostępny również później z poziomu ustawień profilu).
* **Zbierane dane i ustawienia:**
  * **Kategorie czasu:** Wybór z listy domyślnej (np. *Nauka, Praca, Relaks, Jazda autem, Obowiązki domowe*) oraz możliwość tworzenia własnych kategorii wraz z przypisaniem im unikalnego koloru.
  * **Liczba powiadomień dziennie:** Wybór w zakresie od `1` do `10` (domyślnie `5`).
  * **Harmonogram dnia:** Godzina pobudki (domyślnie `07:00`) oraz godzina snu (domyślnie `23:00`). Powiadomienia przychodzą wyłącznie w tym przedziale czasowym.
  * **Zgoda na powiadomienia Push:** Wymagana do działania losowych check-inów.
  * **Zgoda na lokalizację GPS:** Opcjonalna (wymagana do generowania mapy cieplnej miejsc).

### Ekran 2: Check-in (Dodawanie wpisu)
Ekran wywoływany po kliknięciu w powiadomienie Push lub po naciśnięciu przycisku `+` na dolnym pasku nawigacji.
* **Informacje kontekstowe na ekranie:**
  * Data oraz dokładna godzina, której dotyczy wpis (np. `14:20`). Jeśli użytkownik otwiera spóźnione powiadomienie, widzi godzinę jego wygenerowania, dzięki czemu może odtworzyć swój stan z tamtego momentu.
* **Zbierane dane:**
  * **Kategoria czasu:** Wybór jednej z kategorii skonfigurowanych przez użytkownika.
  * **Opis tekstowy:** Krótkie pole tekstowe *„Co teraz robisz?”*.
  * **Nastrój:** 5-stopniowa skala oceny samopoczucia (od `1` – *„Bardzo źle”* do `5` – *„Świetnie”*).
  * **Poziom energii:** Suwak w skali od `0%` do `100%`.
  * **Lokalizacja GPS:** Współrzędne geograficzne pobierane automatycznie w tle w momencie zapisu (jeśli użytkownik wyraził zgodę).
* **Dostępne akcje:**
  * **„Zapisz status”:** Zapisuje kompletny wpis w bazie danych (zmienia status na `done`) i zamyka ekran.
  * **„Odpuść check-in”:** Pozwala zignorować powiadomienie (np. gdy minęło zbyt dużo czasu). Usuwa powiadomienie, zmienia jego status w bazie na `deleted` i nie uwzględnia go w statystykach.

### Ekran 3: Dashboard (Analityka)
Ekran czysto prezentacyjny (nie zbiera danych wejściowych poza filtrami widoku).
* **Elementy interfejsu i wykresy:**
  * **Przełącznik zakresu czasu:** *Dzień / Tydzień / Miesiąc* (filtruje wykres kołowy oraz krzywą energii).
  * **Wykres kołowy (Donut Chart):** Przedstawia procentowy podział czasu na poszczególne kategorie (w kolorach przypisanych podczas konfiguracji) oraz szacowaną łączną liczbę godzin spędzonych na danej kategorii.
  * **Dobowy wykres energii (Wykres liniowy):** Oś X reprezentuje pełną dobę (`0:00` – `24:00`), a oś Y poziom energii (`0–100%`). Wykres prezentuje ciągłą linię uśrednionej energii, poziom średniej ogólnej, zacieniowany przedział snu (zgodny z harmonogramem użytkownika) oraz znacznik bieżącej godziny.
  * **Mapa cieplna (Heatmap):** Mapa geograficzna pokazująca miejsca, w których użytkownik najczęściej przebywał (generowana na podstawie danych GPS z ostatnich 7 dni).

### Ekran 4: Insights (Wnioski AI)
Ekran prezentujący analizę behawioralną wygenerowaną przez sztuczną inteligencję.
* **Elementy interfejsu:**
  * **Przycisk „Wyciągnij wnioski”:** Uruchamia proces analizy dotychczasowych wpisów użytkownika przez model AI.
  * **Karta z wnioskami AI:** Prezentuje podsumowanie tekstowe oraz krótkie wskaźniki określające:
    * Kiedy użytkownik jest najszczęśliwszy (korelacja kategorii, godzin i miejsc z wysokim nastrojem).
    * Co pozytywnie lub negatywnie wpływa na jego energię i nastrój (analiza semantyczna opisów tekstowych *„Co teraz robisz?”*).

### Ekran 5: Historia
Chronologiczny dziennik wszystkich zapisanych check-inów (`status = done`).
* **Elementy interfejsu:**
  * Lista wpisów pogrupowana według dni (od najnowszych), z nagłówkiem dnia pokazującym łączną liczbę wpisów w danym dniu.
  * Pojedynczy wiersz wpisu zawiera: godzinę (`scheduled_at`), nazwę i kolor kategorii, poziom energii w `%` oraz ikonę odpowiadającą wybranemu nastrojowi (`1–5`).

---

## 3. Logika Procesów i Działanie Systemu „Pod Maską”

### 3.1. Silnik losowania i cykl życia powiadomień (Check-in Lifecycle)
Aby powiadomienia były równomiernie rozłożone w ciągu dnia, a jednocześnie zaskakiwały użytkownika, system wykorzystuje algorytm blokowego losowania czasu:

1. **Podział dnia na bloki:** Każdego dnia (lub po zmianie ustawień) serwer pobiera okno aktywności użytkownika (np. `07:00` – `23:00`, czyli 16 godzin) i dzieli je na $N$ równych przedziałów, gdzie $N$ to wybrana liczba powiadomień (np. dla 5 powiadomień powstaje 5 bloków po 3 godziny i 12 minut).
2. **Losowanie (Status `queued`):** Wewnątrz każdego bloku losowana jest konkretna minuta wysyłki (z zachowaniem buforu bezpieczeństwa na styku bloków, np. minimum 30 minut odstępu między powiadomieniami). W bazie danych tworzone są rekordy w tabeli `checkins` ze statusem `queued` oraz wyliczoną datą `scheduled_at`.
3. **Wysyłka (Status `sent`):** Zadanie cykliczne na serwerze (Cron / Queue Worker) sprawdza co minutę rekordy `queued`, których czas `scheduled_at` właśnie nadszedł, wysyła powiadomienie Push na urządzenie użytkownika i zmienia status rekordu na `sent`.
4. **Reakcja użytkownika (Status `done` lub `deleted`):**
   * Kliknięcie *„Zapisz status”* uzupełnia puste pola (`category_id`, `description`, `mood`, `energy_level`, współrzędne GPS), zapisuje czas wypełnienia `completed_at` i zmienia status na `done`.
   * Kliknięcie *„Odpuść check-in”* zmienia status rekordu na `deleted`.
5. **Wpisy ręczne (Przycisk `+`):** Tworzą od razu rekord ze statusem `done`, flagą `is_manual = true` oraz czasem `scheduled_at` równym czasowi bieżącemu.

### 3.2. Wyliczanie danych na Dashboardzie (Ekran 3)
Wszystkie wykresy biorą pod uwagę wyłącznie wpisy o statusie `done` (zarówno te z powiadomień, jak i dodane ręcznie przyciskiem `+`).

* **Udział procentowy i liczba godzin na wykresie kołowym:**
  * Udział procentowy kategorii $K$ to stosunek liczby wpisów z kategorią $K$ do wszystkich wpisów w wybranym okresie (Dzień / Tydzień / Miesiąc):
    $$\text{Udział } K (\%) = \left( \frac{\text{Liczba wpisów kategorii } K}{\text{Wszystkie wpisy w okresie}} \right) \times 100\%$$
  * Szacowana liczba godzin obliczana jest poprzez pomnożenie udziału procentowego przez długość aktywnego dnia użytkownika (różnica między godziną snu a godziną pobudki pomnożona przez liczbę analizowanych dni).
* **Dobowa krzywa energii:**
  * Wpisy z wybranego zakresu grupowane są według godziny z pola `scheduled_at` (przedziały od `00:00` do `23:59`). Dla każdej godziny wyliczana jest średnia arytmetyczna z pola `energy_level`, co pozwala narysować płynną krzywą na osi 24-godzinnej. Obszar pomiędzy `schedule_end_time` a `schedule_start_time` jest wizualnie oznaczany na wykresie jako strefa snu.
* **Mapa cieplna (Heatmap):**
  * Pobierane są wszystkie wpisy z ostatnich 7 dni posiadające niepuste współrzędne `latitude` oraz `longitude`. Komponent mapy zagęszcza punkty leżące blisko siebie, tworząc kolorowy gradient częstotliwości przebywania.

### 3.3. Proces generowania sekcji „AI Insights” (Ekran 4)
1. **Wyzwalacz:** Użytkownik klika przycisk *„Wyciągnij wnioski”*.
2. **Agregacja na serwerze:** Backend pobiera z bazy danych wszystkie wpisy użytkownika (`status = done`) z analizowanego przedziału dat (`beginning_checkin_date` – `end_checkin_date`). Współrzędne GPS są grupowane w klastry przestrzenne, aby model rozpoznał powtarzające się miejsca.
3. **Budowa wsadu (Payload):** Serwer przygotowuje zanonimizowaną listę wpisów w formacie JSON zawierającą: *dzień tygodnia, godzinę, nazwę kategorii, opis tekstowy, ocenę nastroju (1–5), poziom energii (0–100%) oraz identyfikator miejsca*.
4. **Analiza przez LLM:** Dane trafiają do modelu AI opatrzonego instrukcją systemową (System Prompt) nakazującą wyszukanie korelacji między opisami tekstowymi, porą dnia a skokami/spadkami nastroju i energii.
5. **Zapis i prezentacja:** Model zwraca ustrukturyzowaną odpowiedź (tekst główny + wskaźniki JSON), która jest zapisywana w tabeli `insights` i natychmiast wyświetlana na Ekranie 4.

---

## 4. Architektura Danych

### 4.1. Podział danych: Pamięć lokalna telefonu vs Serwer

| Zakres danych | Miejsce przechowywania | Uzasadnienie i sposób synchronizacji |
| :--- | :--- | :--- |
| **Token autoryzacyjny (JWT)** | **Lokalnie** (Bezpieczna pamięć: Keychain / Keystore) | Zapewnia utrzymanie sesji po zamknięciu aplikacji bez konieczności ponownego logowania na Ekranie 0. |
| **Konfiguracja i Kategorie** | **Serwer** + **Lokalny Cache** (SQLite / SharedPrefs) | Pobierane po zalogowaniu i zapisywane lokalnie. Dzięki temu otwarcie Ekranu 2 (Check-in) natychmiast wyświetla kafelki kategorii bez oczekiwania na sieć. |
| **Formularz Check-in** | **Serwer** + **Kolejka Offline** w aplikacji | W przypadku braku zasięgu podczas zapisywania wpisu na Ekranie 2, aplikacja przechowuje wpis lokalnie i synchronizuje go z serwerem automatycznie po odzyskaniu połączenia. |
| **Dane Dashboardu** | **Serwer** (Obliczenia SQL) + **Cache w pamięci RAM** | Wyliczenia procentów i średnich godzinowych wykonuje serwer. Aplikacja odbiera gotowe dane do narysowania wykresów i przechowuje je w pamięci podręcznej do momentu dodania nowego wpisu lub ręcznego odświeżenia. |
| **Wnioski AI (Insights)** | **Serwer** + **Lokalny Cache ostatniego wniosku** | Zapytania do API modelu AI wychodzą wyłącznie z serwera (ochrona kluczy API). Ostatni wygenerowany wniosek jest zapisywany lokalnie, aby Ekran 4 ładował się natychmiastowo. |
| **Historia wpisów** | **Serwer** (pobieranie z paginacją) | Lista na Ekranie 5 pobierana jest porcjami (np. po 14 dni), co gwarantuje płynne działanie interfejsu nawet przy tysiącach historycznych wpisów. |

### 4.2. Struktura Bazy Danych (MySQL)

System opiera się na 4 relacyjnych tabelach w bazie MySQL:

1. **`users`** – przechowuje dane logowania (`email`, `password_hash`, `auth_id`), ustawienia z Ekranu 1 (`notifications_count`, `schedule_start_time`, `schedule_end_time`, `timezone`, `notifications_enabled`, `gps_enabled`), token powiadomień (`fcm_token`) oraz flagę ukończenia konfiguracji (`is_onboarded`).
2. **`categories`** – słownik kategorii przypisanych do użytkownika (`user_id`, `name`, `color`, `icon`) z obsługą miękkiego usuwania (`is_archived`), aby usunięcie kategorii nie uszkodziło historycznych wykresów.
3. **`checkins`** – centralna tabela przechowująca zarówno zaplanowane powiadomienia, jak i gotowe wpisy (`user_id`, `category_id`, `description`, `mood`, `energy_level`, `latitude`, `longitude`, `checkin_status` [`queued`, `sent`, `done`, `deleted`], `is_manual`, `scheduled_at`, `completed_at`).
4. **`insights`** – archiwum wygenerowanych analiz AI przypisanych do użytkownika (`user_id`, `description`, `structured_data` [JSON], `beginning_checkin_date`, `end_checkin_date`, `created_at`).