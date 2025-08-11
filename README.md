# Futballmeccsek Adatbázis

Labdarúgó mérkőzések adatbázisa, elemzése és AI-alapú előrejelzések. A rendszer Next.js 14-re épül, Supabase (PostgreSQL) adatbázissal és modern komponensalapú felülettel.

## Fő funkciók
- Mérkőzések keresése és szűrése (csapat, dátum, liga)
- AI-alapú mérkőzés-előrejelzések több modellből (forma, H2H, ensemble)
- Legend mód: fejlett statisztikák és visszajöveteli valószínűségek
- Valós idejű predikció-cache és teljesítménymutatók
- Részletes csapatstatisztikák és H2H összehasonlítás

## Technológiák
- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI
- Backend: Next.js API Route Handlers
- Adatbázis: Supabase (PostgreSQL) RLS-sel
- Tesztelés: Jest + React Testing Library

## Fejlesztői környezet
1. Klónozás és függőségek:
   - pnpm i vagy npm i
2. Környezeti változók (példa):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (csak szerveroldalon)
3. Futtatás:
   - npm run dev
4. Tesztek futtatása:
   - npm test

## Mappastruktúra
- app/ – Next.js oldalak és API-k
- components/ – újrafelhasználható UI komponensek
- hooks/ – egyedi React hookok (pl. use-ensemble-weight)
- lib/ – segédfüggvények, Supabase kliens és típusok
- supabase/ – adatbázis migrációk
- tests/ – egységtesztek
- docs/ – rendszer-dokumentáció és QA ellenőrzőlisták

## Hasznos szkriptek
- npm run db:migrate – migrációk futtatása
- npm run db:cleanup – cache tisztítás (mintascript)
- npm run test:coverage – tesztlefedettség

## Dokumentáció
- docs/system-documentation-v21.md – Rendszer állapot és architektúra
- docs/qa-checklist.md – Kiadás előtti QA ellenőrzőlista
- docs/supabase-integration-guide.md – Supabase integráció

## Licenc
Belső fejlesztői projekt. A felhasználás a csapat irányelvei szerint történik.
