# Következő lépések javaslatok

Rövid- és középtávú teendők a rendszer továbbfejlesztéséhez.

## 1. Modell-integráció és pontosság
- Mock AI helyett valódi ML modell(ek) integrálása (pl. Python szolgáltatás vagy Edge Function)
- Pontosságmérés automatizálása (public.get_prediction_accuracy_stats naplózása és dashboard)
- Több modell (Poisson, ELO, xG) bevezetése és ensemble súlyok validációja A/B tesztekkel

## 2. Adatminőség és import
- Valós mérkőzésadat-forrás integrálása (API/Csv pipeline keményített validációval)
- Rendszeres adatminőség-ellenőrzés és anomália-detektálás
- Teljesítményes indexek felülvizsgálata nagy adattömeg esetén

## 3. Teljesítmény és cache
- Cache stratégia finomítása (kulcs-sémák, TTL ligánként/időablak szerint)
- Cache statisztikák mérőszámokkal (hit rate, átlagos generálási idő)
- Ütemezett takarítás Supabase Cronnal és részletes logok

## 4. Biztonság és megfelelőség
- Rate limiting az API végpontokra (middleware)
- Beviteli validáció szigorítása (zod/yup)
- RLS szabályok felülvizsgálata (audit logok, jogosultságok)

## 5. Frontend élmény
- Predikciós kártyák finomítása (tooltipok, verzió címgombok, cache jelzők)
- Hozzáférhetőség (ARIA szerepek, fókusz-kezelés) szélesebb lefedettség
- Reszponzív optimalizálás kis képernyőkre (grafikonok, slider érintésre)

## 6. Observability
- Hibakövetés (Sentry/LogRocket) és teljesítmény-metrikák bevezetése
- Alkalmazás- és DB-szintű monitoring panelek

## 7. Tesztelés és QA
- E2E tesztek (Playwright/Cypress) kritikus felhasználói utakra
- Lefedettség >80% kulcsterületeken (date-utils, hooks, API)
- Regressziós tesztcsomag cache és predikciós áramkörökre

## 8. Dokumentáció és DevEx
- API szerződés dokumentálása (OpenAPI)
- Fejlesztői onboarding útmutató (env példák, migrációk, tesztadat)
- CI/CD pipeline bővítése (lint, typecheck, jest, e2e, preview deploy)
