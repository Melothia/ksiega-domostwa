# Migracje bazy danych - Księga Domostwa

## 📋 Kolejność wykonania

Uruchamiaj skrypty **w tej kolejności** w Supabase SQL Editor:

### 1️⃣ Dodanie kolumny xp_required
**Plik:** `01_add_xp_required.sql`

Dodaje kolumnę `xp_required` do tabeli `monthly_progress` i przelicza wartości dla istniejących graczy.

```sql
-- Po uruchomieniu zobaczysz tabelę z postępem graczy
```

### 2️⃣ Funkcje wykonywania questów
**Plik:** `02_complete_quest_function.sql`

Tworzy:
- `complete_quest(player_id, quest_id)` - wykonanie questa solo
  - Liczy XP (base lub +30% dla emergency)
  - Automatyczny level up (może być kilka poziomów naraz)
  - Aktualizuje `xp_required`
  - Dodaje wpisy do kroniki
- `complete_group_quest(player_1, player_2, quest_id)` - dla questów grupowych

### 3️⃣ Funkcja pobierania questów
**Plik:** `03_get_quests_function.sql`

Tworzy:
- `get_quests_for_today(player_id)` - zwraca questy podzielone na:
  - `emergency` - przekroczony deadline
  - `active` - gotowe do wykonania
  - `upcoming` - jeszcze za wcześnie

### 4️⃣ Funkcje resetowania miesiąca
**Plik:** `04_reset_and_winner_functions.sql`

Tworzy:
- `reset_month_if_needed()` - automatyczny reset na początku miesiąca
- `last_month_winner()` - zwraca gracza miesiąca z poprzedniego miesiąca

### 5️⃣ Rebalans XP
**Plik:** `05_rebalance_xp.sql`

Balansuje wartości XP dla wszystkich questów:
- **Codzienne (1-2 dni):** 10-20 XP
- **Cotygodniowe (7 dni):** 30 XP
- **Co 2 tygodnie (14 dni):** 50-70 XP
- **Miesięczne (30 dni):** 100-150 XP
- **Kwartalne (90 dni):** 150-300 XP
- **Półroczne (180 dni):** 200-400 XP
- **Roczne (365 dni):** 500 XP

**Cel:** Osiągnięcie 10 poziomu w 2-3 miesiące przy regularnej grze (~700-1000 XP/miesiąc/gracz)

### 6️⃣ Seedowanie dat wykonania questów
**Plik:** `06_seed_quest_dates.sql`

Tworzy początkowe wpisy w `quest_completions` dla wszystkich questów:
- **Rozłożenie czasowe** - questy nie wszystkie dostępne od razu
- **Questy rzadkie** (>60 dni) rozłożone w różnych miesiącach
- **Strategia:**
  - Codzienne: dostępne teraz/wkrótce
  - Miesięczne: rozłożone przez 30 dni
  - Kwartalne: każdy w innym miesiącu
  - Półroczne: każdy w innym kwartale
  - Roczne: jeden latem, jeden zimą

Po uruchomieniu wyświetla tabelę z statusem wszystkich questów i datami dostępności.

## ✅ Weryfikacja

Po uruchomieniu wszystkich skryptów, sprawdź:

```sql
-- 1. Czy kolumna xp_required istnieje
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'monthly_progress';

-- 2. Czy funkcje zostały utworzone
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'complete_quest',
    'complete_group_quest', 
    'get_quests_for_today',
    'reset_month_if_needed',
    'last_month_winner'
  );

-- 3. Test pobierania questów
SELECT get_quests_for_today(
  (SELECT id FROM players WHERE nick = 'Melothy')
);
```

## 🎯 Co to zmienia w aplikacji

**Przed:**
- Brak `xp_required` - nie wiadomo ile XP do następnego levelu
- Prawdopodobnie brak funkcji RPC - aplikacja nie działała

**Po:**
- Backend decyduje o wszystkim (zgodnie z dokumentacją)
- Frontend tylko wyświetla dane
- Automatyczny level up
- Wpisy do kroniki
- System emergency dla questów

## 🔄 Następne kroki

Po uruchomieniu migracji:
1. Zrestartuj aplikację Next.js (`npm run dev`)
2. Sprawdź czy wyświetla się XP progress (np. "390/207")
3. Przetestuj wykonanie questa
4. Sprawdź kronikę czy zapisują się wydarzenia
