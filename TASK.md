# Raport z pracy z AI przy realizacji zadania

## 1. Kontekst i podejście

Podczas pracy świadomie wykorzystałem narzędzia AI jako element procesu inżynierskiego:

* **Codex** - analiza repozytorium, wsparcie implementacyjne, wykonywanie ograniczonych zmian w kodzie oraz weryfikacja builda
* **ChatGPT** - konsultacje architektoniczne, krytyczna analiza rozwiązań oraz projektowanie promptów dla Codexa

Output generowany przez AI traktowałem jako roboczy wkład do procesu, a nie jako finalne rozwiązanie.

Każda zmiana była:

* ręcznie przeanalizowana,
* oceniona pod kątem zakresu zadania,
* zweryfikowana technicznie,
* oraz - jeśli było to potrzebne - poprawiona manualnie.

Celem nie było maksymalne „wykorzystanie AI”, tylko dostarczenie jak najlepszego rozwiązania inżynierskiego przy efektywnym użyciu AI.

---

## 2. Zasady inżynierskie

Od początku świadomie przyjąłem kilka zasad pracy:

Priorytetem było:

* tworzenie małych, łatwych do review commitów,
* zachowanie istniejącej architektury projektu,
* rozwiązywanie wyłącznie problemów opisanych w zadaniu,
* unikanie zbędnych abstrakcji,
* preferowanie lokalnego stanu zamiast dokładania global state managementu,
* podejmowanie świadomych decyzji architektonicznych z jasnym uzasadnieniem,
* manualna weryfikacja po każdej większej zmianie.

Celowo unikałem tzw. resume-driven engineering, czyli:

* przepisywania kodu tylko po to, by „wyglądał bardziej enterprise”,
* dokładania Pinia/Vuex bez potrzeby,
* rozbijania logiki na composables bez realnej wartości,
* rozwiązywania problemów, których zadanie nie wymagało.

---

## 3. Stałe instrukcje dla AI (`AGENTS.md`)

Na początku przygotowałem plik `AGENTS.md`, który pełnił rolę stałej warstwy instrukcji dla AI.

Jego zadaniem było ustawienie jasnych zasad współpracy z modelem.

W praktyce wymusiło to:

* podejście **analysis-first** (najpierw analiza, potem implementacja),
* ścisłą kontrolę scope’u,
* brak zmian w `src/data/mock.js`,
* preferowanie małych zmian zamiast dużych refaktorów,
* preferowanie local state nad global state,
* świadome rozważanie trade-offów,
* krytyczne podejście do propozycji AI,
* utrzymywanie zmian w granicach łatwego review.

Dzięki temu AI działało bardziej jak partner inżynierski, a nie generator kodu.

---

## 4. Początkowy code review i analiza architektury

Zanim rozpocząłem implementację, najpierw przeanalizowałem istniejący kod.

Struktura aplikacji:

* `App.vue` - główna orkiestracja (zakładki, stan selekcji, panel szczegółów)
* `Graph.vue` - renderowanie grafu i interakcje użytkownika
* `ChunkPanel.vue` - szczegóły wybranego node’a
* `PartPanel.vue` - szczegóły wybranej części źródła
* `SourcesView.vue` - lista źródeł i ich części
* `src/data/mock.js` - mockowane dane

Najważniejsze wnioski z analizy:

* zduplikowana logika pomocnicza (`fmtTime`) występowała w kilku komponentach,
* konfiguracja typów (`TYPE_LABELS`, `TYPE_COLORS`) była rozproszona,
* brakowało warstwy i18n dla hardcoded stringów,
* model interakcji w `Graph.vue` pozwalał rozszerzyć funkcjonalność lokalnie (BFS + search) bez przebudowy architektury,
* ownership stanu był już czytelny, więc global store był zbędny.

Ta analiza została wykonana przed implementacją, żeby dopasować rozwiązanie do istniejącego kodu, zamiast narzucać nową architekturę.

---

## 5. Podział pracy na małe, logiczne commity

Całość została świadomie rozbita na osobne etapy:

1. **Task 1a / 1b**
   Wyciągnięcie współdzielonych utility (`format.js`, `types.js`)

2. **Task 1c**
   Implementacja i18n (`vue-i18n`), locale files, przełącznik języka

3. **Poprawka pluralizacji języka polskiego**
   Naprawa odmiany liczebników

4. **Task 2**
   Implementacja BFS shortest path

5. **Task 3**
   Implementacja live graph search

---

## 6. Co AI zaproponowało i zostało zaakceptowane

Zaakceptowałem wyłącznie propozycje, które poprawiały jakość rozwiązania bez niepotrzebnego zwiększania złożoności.

Zaakceptowane:

* wyciągnięcie `fmtTime()` do `src/utils/format.js`,
* centralizacja konfiguracji typów w `src/utils/types.js`,
* utrzymanie path mode lokalnie w `Graph.vue`,
* utrzymanie search query w `App.vue` (tam, gdzie znajduje się input),
* implementacja BFS przez adjacency map + parent reconstruction,
* normalizacja endpointów linków (force-graph mutuje `source/target`),
* dodanie `vue-i18n`,
* normalizacja wyszukiwania:

  * case-insensitive,
  * normalizacja spacji,
  * normalizacja znaków diakrytycznych,
  * wsparcie dla polskiego `ł → l`.

To były decyzje zgodne z architekturą projektu i zakresem zadania.

---

## 7. Co AI zaproponowało, ale świadomie odrzuciłem

Pojawiło się kilka poprawnych technicznie propozycji, które świadomie odrzuciłem, ponieważ były poza zakresem zadania.

Odrzucone:

* dodanie Pinia / Vuex,
* rozbijanie logiki grafu na kilka composables,
* fuzzy search,
* highlight linków dla searcha,
* zmiana modelu danych,
* szeroki redesign `Graph.vue`,
* rozwiązywanie pobocznych problemów architektonicznych.

Przykład:

AI zaproponowało dodatkowo:

* sanitizację markdowna,
* obsługę async race conditions,
* poprawki accessibility,
* dodatkowe zabezpieczenia runtime.

To są poprawne uwagi techniczne, ale zostały odrzucone jako out of scope, żeby zachować fokus na zadaniu.

---

## 8. Manualny feedback i poprawki

AI output był aktywnie reviewowany i poprawiany.

### Najlepszy przykład - pluralizacja po polsku

Pierwsza implementacja działała technicznie, ale generowała błędne formy:

* `16 węzły`
* `20 połączenia`

Manual review wykazał, że język polski wymaga osobnej obsługi plural rules.

Wprowadziłem:

* poprawę locale messages,
* poprawę wywołań tłumaczeń count-based,
* custom Polish plural rule.

Zweryfikowane przypadki:

* `0 węzłów`
* `1 węzeł`
* `2 węzły`
* `5 węzłów`
* `16 węzłów`
* `22 węzły`
* `25 węzłów`

To dobry przykład sytuacji, gdzie AI przyspieszyło implementację, ale manual engineering judgment zapewnił poprawność końcowego efektu.

---

## 9. Doinstalowane biblioteki i uzasadnienie

Dodałem jedną bibliotekę:

* vue-i18n `vue-i18n@^9.14.5`

Powód:

* wymaganie Task 1c,
* wsparcie dla Vue 3 Composition API,
* runtime language switch,
* pluralization support,
* możliwość definiowania locale-specific plural rules.

Nie dodawałem żadnych zbędnych zależności.

---

## 10. Krótkie podsumowanie zadań

### Task 1a / 1b - shared utils

* wydzielenie `format.js`,
* wydzielenie `types.js`,
* usunięcie duplikacji,
* bez zmiany UI / behavior.

### Task 1c - i18n

* konfiguracja i18n,
* locale files PL / EN,
* runtime switch języka,
* tłumaczenia UI,
* pluralizacja.

### Task 2 - BFS shortest path

* lokalny state w `Graph.vue`,
* BFS w `O(V + E)`,
* adjacency map,
* parent reconstruction,
* overlay „No path found”,
* highlight ścieżki.

### Task 3 - live graph search

* input w headerze,
* search state w `App.vue`,
* highlight node’ów,
* licznik wyników,
* normalizacja zapytań,
* integracja z path mode.

Priorytet renderowania:

1. path
2. selected
3. search match
4. dimmed
5. default

---

## 11. Strategia weryfikacji

Po każdym etapie:

* `npm run build`
* manualny smoke test
* ręczna weryfikacja UI

Sprawdzałem:

* compile-time correctness,
* integrację zmian,
* poprawność i18n,
* działanie BFS,
* działanie searcha,
* zachowanie priorytetów wizualnych.

---

## 12. Podsumowanie

AI zostało wykorzystane jako engineering multiplier, a nie substytut kompetencji technicznych.

Największa wartość płynęła z:

* szybszej eksploracji rozwiązań,
* generowania alternatywnych podejść,
* krytycznego testowania decyzji projektowych,
* szybszej iteracji.

Natomiast:

* finalne decyzje,
* kontrola zakresu,
* weryfikacja,
* oraz poprawki

pozostały po stronie manual engineering judgment.