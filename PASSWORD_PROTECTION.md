# Ochrona hasłem - instrukcja

## Domyślne hasło
Domyślne hasło to: **`domostwo123`**

## Zmiana hasła

1. Wygeneruj nowy hash hasła:
```bash
node migrations/generate-password-hash.js twoje-nowe-haslo
```

2. Skopiuj wygenerowany hash

3. Zaktualizuj plik `.env.local` (użyj `\` przed znakami `$`):
```
PASSWORD_HASH=\$2a\$10\$<reszta-hashu>
```

4. **WAŻNE: Zrestartuj serwer** (Next.js nie odczytuje zmian w .env.local bez restartu):
```bash
# Ctrl+C żeby zatrzymać serwer
npm run dev
```

## Jak to działa

1. Przy pierwszym wejściu na stronę pojawia się ekran z hasłem
2. Hasło jest sprawdzane przez API route `/api/verify-password`
3. Używany jest bcrypt do bezpiecznego porównania hasła z hashem
4. Po poprawnym hasle, informacja zapisuje się w `sessionStorage`
5. Hasło obowiązuje do zamknięcia przeglądarki (session)

## Bezpieczeństwo

- Hash hasła jest przechowywany w `.env.local` (nie w git)
- Hasło nigdy nie jest przechowywane w plain text
- Używany jest bcrypt z salt=10 (bardzo bezpieczne)
- Session timeout = do zamknięcia karty/przeglądarki

## Wyłączenie ochrony

Jeśli chcesz wyłączyć ochronę hasłem:
1. Usuń import i użycie `PasswordScreen` z `pages/index.js`
2. Usuń state `isAuthenticated` i warunek renderowania
