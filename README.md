# 📜 Księga Domostwa

RPG-owy system gamifikacji obowiązków domowych dla 4 graczy.

![Next.js](https://img.shields.io/badge/Next.js-13.5.6-black)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## 🎮 O projekcie

**Księga Domostwa** to aplikacja webowa zamieniająca codzienne obowiązki domowe w questy RPG. Gracze zdobywają XP za wykonywanie zadań, awansują na kolejne poziomy i rywalizują o tytuł "Gracza Miesiąca".

### Główne funkcje

- 🗡️ **System questów** – codzienne zadania z rotacją, tryb solo i grupowy
- 🚨 **Emergency quests** – zaległe zadania z bonusem +30% XP
- 📊 **Ranking miesięczny** – rywalizacja między graczami
- 🏆 **Osiągnięcia** – odblokuj tytuły i wybierz aktywny
- 📖 **Kronika** – historia wszystkich wydarzeń
- 🧾 **Paragony** – nagroda 50 XP za robienie zakupów

## 🚀 Uruchomienie

### Wymagania

- Node.js 18+
- Konto Supabase

### Instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd ksiega-domostwa

# Instalacja zależności
npm install

# Konfiguracja środowiska
cp .env.local.example .env.local
# Uzupełnij NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY

# Uruchomienie
npm run dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`

## 🗂️ Struktura projektu

```
ksiega-domostwa/
├── components/
│   ├── ui/
│   │   ├── ErrorBoundary.jsx   # Obsługa błędów React
│   │   └── Loading.jsx         # Komponenty ładowania
│   ├── AchievementsView.jsx    # Zakładka osiągnięć
│   ├── ChronicleView.jsx       # Zakładka kroniki
│   ├── Layout.jsx              # Główny layout
│   ├── LoginScreen.jsx         # Ekran wyboru gracza
│   ├── PlayerPanel.jsx         # Panel gracza (avatar, XP, level)
│   ├── QuestList.jsx           # Lista questów
│   ├── RankingBar.jsx          # Pasek rankingu
│   ├── ReceiptsView.jsx        # Zakładka paragonów
│   ├── Tabs.jsx                # Nawigacja zakładkami
│   └── UpcomingQuest.jsx       # Nadchodzące questy
├── contexts/
│   ├── AppProvider.jsx         # Combined provider
│   ├── GameContext.jsx         # Stan gry (progress, ranking)
│   ├── PlayerContext.jsx       # Stan gracza
│   └── QuestContext.jsx        # Stan questów
├── lib/
│   ├── api.js                  # Centralne wywołania Supabase
│   ├── dateUtils.js            # Pomocnicze funkcje dat
│   ├── questLogic.js           # Logika questów
│   └── supabase.js             # Klient Supabase
├── migrations/                 # Migracje SQL
├── pages/
│   ├── _app.js                 # App wrapper z Context
│   └── index.js                # Strona główna
├── public/avatars/             # Awatary graczy
└── styles/globals.css          # Style globalne
```

## 🎯 System XP i poziomów

| Poziom | Wymagane XP | Formuła |
|--------|-------------|---------|
| 1 | 100 | bazowe |
| 2 | 120 | 100 × 1.2¹ |
| 3 | 144 | 100 × 1.2² |
| ... | ... | ... |
| 10 | 516 | MAX LEVEL |

**Źródła XP:**
- Questy solo: 10-50 XP (zależnie od zadania)
- Questy grupowe: XP dzielone między graczy
- Emergency bonus: +30% XP
- Paragony: 50 XP za każdy

## 🗄️ Baza danych (Supabase)

### Tabele

| Tabela | Opis |
|--------|------|
| `players` | Gracze (nick, avatar, active_title) |
| `quests` | Definicje questów |
| `quest_completions` | Historia ukończonych questów |
| `monthly_progress` | Postęp miesięczny (XP, level) |
| `achievements` | Definicje osiągnięć |
| `player_achievements` | Odblokowane osiągnięcia |
| `chronicle` | Historia wydarzeń |
| `receipts` | Paragony |
| `monthly_winners` | Zwycięzcy miesięcy |

### Funkcje RPC

- `get_quests_for_today` – pobiera questy z rotacją
- `complete_quest` – wykonanie questa solo
- `complete_group_quest` – wykonanie questa grupowo
- `reset_month_if_needed` – reset miesięczny
- `last_month_winner` – zwycięzca poprzedniego miesiąca
- `add_receipt` – dodanie paragonu
- `add_chronicle_entry` – wpis do kroniki

## 👥 Gracze

| Nick | Domyślny tytuł |
|------|----------------|
| Melothy | Zaklinaczka Mopa |
| Reu | Cień Domostwa |
| Pshemcky | Strażnik Natury |
| Benditt | Koci Kleryk |

## 🛠️ Technologie

- **Frontend:** Next.js 13 (Pages Router), React 18
- **State Management:** React Context API
- **Backend:** Supabase (PostgreSQL + RPC)
- **Styling:** CSS z gradientami (dark theme)

## 📝 Licencja

Projekt prywatny.

---

*Niech moc czystego domu będzie z Tobą! ⚔️🧹*
