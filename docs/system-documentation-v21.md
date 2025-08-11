# Rendszer Dokumentáció - Enhanced Football Predictions v1.1 (Verzió 21)

Dátum: 2025-08-10
Verzió: 21 (Enhanced Football Predictions v1.1)

---

## 1. Bevezetés
Az alkalmazás célja labdarúgó mérkőzések adatainak kezelése, megjelenítése és AI-alapú előrejelzések készítése. A rendszer modern full-stack architektúrát használ Next.js 14 (App Router) alapon, Supabase (PostgreSQL) háttérrel és egyedi cache-elési stratégiával.

---

## 2. Architektúra áttekintés

```mermaid
flowchart TD
  User[Felhasználó] -->|HTTP/HTTPS| Frontend[Next.js Frontend]
  Frontend -->|API hívások| BackendAPI[Next.js API Route Handlers]
  BackendAPI -->|DB lekérdezések| Supabase[(Supabase PostgreSQL)]
  BackendAPI <-->|Cache írás/olvasás| Supabase
  CI[CI/CD (GitHub Actions)] -->|Deploy| Vercel[Vercel Hosting]
  CI -->|DB migrációk| Supabase
  Monitoring[Monitoring/Loggolás] --> BackendAPI
```

Fő komponensek:
- Frontend: Next.js + Tailwind + Radix UI
- Backend: Next.js API Route Handlers
- Adatbázis: Supabase (RLS)
- Tesztelés: Jest + RTL

---

## 3. Backend API-k
- GET /api/health
  - Egyszerű egészség-ellenőrzés
- GET /api/matches
  - Paraméterek: limit, offset
  - Visszaad: mérkőzés lista
- GET /api/matches/[id]
  - Paraméter: id
  - Visszaad: egy mérkőzés
- GET /api/enhanced-prediction
  - Kötelező query paraméterek: home_team, away_team, match_date (YYYY-MM-DD)
  - Cache kulcs: `${home}-${away}-${match_date}`
  - Visszaad: predikciós objektum (valószínűségek, gólok, confidence, stb.)

---

## 4. Adatbázis
Fő táblák:
- matches
  - oszlopok: id, home_team, away_team, match_time, full_time_home_goals, full_time_away_goals, league, created_at, updated_at
- predictions (005_enhanced_predictions_table.sql)
  - oszlopok: id (UUID), match_id, home_team, away_team, match_date, league, prediction_type, home/draw/away_win_probability, predicted_*_goals, predicted_total_goals, confidence_score, model_version, features_used (JSONB), cache_key (UNIQUE), legend mód mezők, accuracy mezők, predicted_at, expires_at, created_at, updated_at
  - indexek: match_id, teams+date, type, date, accuracy, confidence, expires_at
  - RLS: anonim SELECT, service_role ALL

Hasznos függvények/nézetek:
- VIEW public.prediction_analysis
- FUNCTION public.get_prediction_accuracy_stats(...)
- FUNCTION public.update_enhanced_predictions()

---

## 5. Cache stratégia
- Cache key: `${home}-${away}-${match_date}` (lowercase)
- TTL: 24 óra (expires_at)
- Upsert: onConflict: cache_key a gyors frissítéshez
- Cache miss esetén: mockAIPredict generál új predikciót (példa implementáció)

---

## 6. Frontend fő elemek
- components/matches-list.tsx: mérkőzés lista szűrőkkel
- components/enhanced-prediction-card.tsx: predikciók megjelenítése (modellek, súlyozás)
- hooks/use-ensemble-weight.ts: ensemble súlyok kezelése (localStorage perzisztencia, keverés, magyarázatok)

---

## 7. Tesztelés és QA
- Egységtesztek: tests/date-utils.test.js, tests/prediction-blending.test.js
- Jest beállítások: jsdom környezet, @/ alias támogatása
- Mockok: Supabase kliens és fetch a jest.setup.js-ben
- QA checklist: docs/qa-checklist.md

---

## 8. Biztonság és konfiguráció
- Frontend: csak publikus Supabase kulcsok
- Szerver: SUPABASE_SERVICE_ROLE_KEY kizárólag szerver oldalon
- .gitignore: .env* kizárva, build és cache könyvtárak ignorálva
- RLS: predictions táblán anon olvasás, service_role írás/frissítés

---

## 9. Telepítés
- Futtatás lokálisan: npm i, npm run dev
- Tesztek: npm test
- Deploy: Vercel (Next.js), DB migrációk: Supabase CLI / Dashboard

---

## 10. Ismert korlátozások
- mockAIPredict demonstrációs (nem éles ML modell)
- H2H és form adatok példák (valódi integráció szükséges)
- Cache takarítás ütemezése Supabase Cron/Edge függő

