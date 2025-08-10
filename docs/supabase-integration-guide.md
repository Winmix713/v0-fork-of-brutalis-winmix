# Supabase Integrációs Útmutató – Enterprise Szintű Dokumentáció

**Dátum:** 2025. augusztus 10.
**Verzió:** 1.0

---

## 1. Bevezetés

Ez a dokumentum részletesen bemutatja a Supabase integrációját az Enhanced Football Predictions rendszerbe. Kitér a frontend és backend oldali működésre, az adatbázis sémára, az SQL műveletekre, az autentikációra és a valós idejű frissítésekre. Célja, hogy átfogó referenciaként szolgáljon a fejlesztők számára a Supabase hatékony kihasználásához.

A Supabase egy nyílt forráskódú Firebase alternatíva, amely egy PostgreSQL adatbázisra épül, és számos kiegészítő eszközt (autentikáció, valós idejű adatbázis, tárolás, Edge Functions) kínál.

---

## 2. Supabase Kapcsolatok és Kliensek

A rendszer kétféle Supabase klienst használ a biztonság és a funkcionalitás optimalizálása érdekében:

### 2.1. Frontend (Kliensoldali) Kapcsolat
*   **Cél**: Publikus adatok lekérdezése, felhasználói interakciók kezelése.
*   **Kulcs**: `NEXT_PUBLIC_SUPABASE_URL` és `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ezek a kulcsok biztonságosan elérhetők a böngészőben.
*   **Fájl**: `lib/supabase.ts` - `getSupabaseClient()` függvény.
*   **Biztonság**: Ez a kliens **nem** használja a `service_role` kulcsot. Az adatbázis hozzáférését a Row Level Security (RLS) szabályozza.

**Példa: `lib/supabase.ts`**
\`\`\`typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Database } from "./supabase-types" // Feltételezve, hogy van egy generált típusfájl

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton minta a kliensoldali Supabase klienshez
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
    }
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}
\`\`\`

**Használat a Frontend Komponensekben (pl. `components/matches-list.tsx`):**
\`\`\`typescript
'use client'
import { getSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function MatchesList() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true)
      const { data, error } = await supabase.from('matches').select('*').limit(10)
      if (error) {
        console.error('Error fetching matches:', error)
      } else {
        setMatches(data)
      }
      setLoading(false)
    }
    fetchMatches()
  }, [])

  if (loading) return <div>Meccsek betöltése...</div>
  if (!matches.length) return <div>Nincs megjeleníthető meccs.</div>

  return (
    <div>
      {matches.map((match) => (
        <div key={match.id}>
          {match.home_team_name} vs {match.away_team_name} - {match.match_date}
        </div>
      ))}
    </div>
  )
}
\`\`\`

### 2.2. Backend (Szerveroldali) Kapcsolat
*   **Cél**: Privilegizált műveletek (pl. RLS megkerülése, érzékeny adatok írása/frissítése, admin funkciók).
*   **Kulcs**: `SUPABASE_SERVICE_ROLE_KEY`. Ez a kulcs **soha nem** kerülhet a frontend kódba vagy a böngészőbe. Csak szerveroldali környezetben (Next.js Route Handlers, Server Actions) használható.
*   **Fájl**: `lib/supabase.ts` - `createServiceRoleClient()` függvény.
*   **Biztonság**: Ez a kliens megkerüli az RLS-t, ezért rendkívül óvatosan kell használni.

**Példa: `lib/supabase.ts` (kiegészítve)**
\`\`\`typescript
// ... (getSupabaseClient függvény fentebb)

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createServiceRoleClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable for server-side client.")
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
\`\`\`

**Használat a Backend API Route Handlerekben (pl. `app/api/enhanced-prediction/route.ts`):**
\`\`\`typescript
import { NextResponse } from "next/server"
import { getSupabaseClient, createServiceRoleClient } from "@/lib/supabase" // Fontos: a megfelelő kliens importálása

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const homeTeam = searchParams.get("home_team")
  const awayTeam = searchParams.get("away_team")

  if (!homeTeam || !awayTeam) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  const supabase = getSupabaseClient() // Publikus adatok lekérdezéséhez
  const supabaseAdmin = createServiceRoleClient() // Privilegizált műveletekhez (pl. cache írás)

  try {
    // Cache ellenőrzés publikus klienssel
    const { data: cachedPrediction, error: cacheError } = await supabase
      .from("predictions")
      .select("*")
      .eq("home_team", homeTeam)
      .eq("away_team", awayTeam)
      .single()

    if (cachedPrediction) {
      return NextResponse.json({ ...cachedPrediction.prediction, meta: { cache_hit: true } })
    }

    // Predikció számítása (itt lenne a komplex logika)
    const newPredictionData = {
      home_win: 0.5,
      draw: 0.25,
      away_win: 0.25,
      // ...
    }

    // Cache mentése service_role klienssel (RLS megkerülése)
    const { error: saveError } = await supabaseAdmin
      .from("predictions")
      .upsert({
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: new Date().toISOString().split('T')[0],
        league: "spain",
        model_type: "ensemble",
        prediction: newPredictionData,
        confidence: 0.8,
        cache_key: `${homeTeam}-${awayTeam}-${new Date().toISOString().split('T')[0]}`,
        generated_at: new Date().toISOString(),
      })

    if (saveError) {
      console.error("Error saving prediction to cache:", saveError)
      // Folytatás hiba ellenére, de logolva
    }

    return NextResponse.json({ ...newPredictionData, meta: { cache_hit: false } })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
\`\`\`

---

## 3. Adatbázis Séma és SQL Műveletek

A Supabase egy PostgreSQL adatbázist használ, így minden standard SQL parancs és funkció elérhető.

### 3.1. Táblák Létrehozása (SQL Editor)

**`matches` tábla (példa)**
Ez a tábla tárolja a mérkőzésadatokat.
\`\`\`sql
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_date DATE NOT NULL,
    home_team_name TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    full_time_home_goals INTEGER,
    full_time_away_goals INTEGER,
    full_time_result TEXT, -- H, D, A
    half_time_home_goals INTEGER,
    half_time_away_goals INTEGER,
    half_time_result TEXT, -- H, D, A
    league TEXT NOT NULL,
    season TEXT,
    referee TEXT,
    home_shots INTEGER,
    away_shots INTEGER,
    home_shots_target INTEGER,
    away_shots_target INTEGER,
    home_corners INTEGER,
    away_corners INTEGER,
    home_fouls INTEGER,
    away_fouls INTEGER,
    home_yellow INTEGER,
    away_yellow INTEGER,
    home_red INTEGER,
    away_red INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexek a gyors lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches (home_team_name);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches (away_team_name);
CREATE INDEX IF NOT EXISTS idx_matches_league_season ON public.matches (league, season);
\`\`\`

**`predictions` tábla**
Ez a tábla tárolja a generált predikciókat és a cache-t.
\`\`\`sql
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    match_date DATE NOT NULL,
    league TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('form', 'h2h', 'ensemble')),
    prediction JSONB NOT NULL, -- A predikciós adatok JSON formátumban
    confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
    cache_key TEXT NOT NULL, -- Egyedi kulcs a cache-eléshez (pl. "Real Madrid_vs_Barcelona_2025-08-15_ensemble")
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ, -- Lejárat dátuma a cache-elt predikcióknak
    CONSTRAINT predictions_unique_match_model UNIQUE (home_team, away_team, match_date, model_type)
);

-- Indexek a gyors cache lekérdezésekhez
CREATE INDEX IF NOT EXISTS idx_predictions_cache_key ON public.predictions (cache_key);
CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_league ON public.predictions (league);
CREATE INDEX IF NOT EXISTS idx_predictions_expires_at ON public.predictions (expires_at);
\`\`\`

### 3.2. Adatkezelési Műveletek (SQL Editor / Kliens)

**Adatok beszúrása (`INSERT`)**
\`\`\`sql
INSERT INTO public.matches (match_date, home_team_name, away_team_name, full_time_home_goals, full_time_away_goals, full_time_result, league)
VALUES ('2025-08-15', 'Real Madrid', 'Barcelona', 2, 1, 'H', 'La Liga');

INSERT INTO public.predictions (home_team, away_team, match_date, league, model_type, prediction, confidence, cache_key, expires_at)
VALUES (
    'Real Madrid',
    'Barcelona',
    '2025-08-15',
    'La Liga',
    'ensemble',
    '{"home_win": 0.6, "draw": 0.2, "away_win": 0.2, "btts": 0.7, "over_2_5": 0.65}',
    0.85,
    'Real Madrid_vs_Barcelona_2025-08-15_ensemble',
    now() + interval '24 hours'
);
\`\`\`

**Adatok lekérdezése (`SELECT`)**
\`\`\`sql
SELECT * FROM public.matches WHERE league = 'La Liga' ORDER BY match_date DESC LIMIT 10;

SELECT prediction, confidence FROM public.predictions
WHERE home_team = 'Real Madrid' AND away_team = 'Barcelona' AND match_date = '2025-08-15' AND model_type = 'ensemble';
\`\`\`

**Adatok frissítése (`UPDATE`)**
\`\`\`sql
UPDATE public.matches
SET full_time_home_goals = 3, full_time_away_goals = 2, full_time_result = 'H'
WHERE id = 'az-adott-meccs-uuid-ja';

UPDATE public.predictions
SET confidence = 0.90, prediction = '{"home_win": 0.65, "draw": 0.15, "away_win": 0.20}'
WHERE cache_key = 'Real Madrid_vs_Barcelona_2025-08-15_ensemble';
\`\`\`

**Adatok törlése (`DELETE`)**
\`\`\`sql
DELETE FROM public.matches WHERE match_date < '2024-01-01';

DELETE FROM public.predictions WHERE expires_at < now();
\`\`\`

### 3.3. Row Level Security (RLS)

Az RLS alapvető biztonsági réteg a Supabase-ban. Meghatározza, hogy mely felhasználók (vagy szerepkörök) férhetnek hozzá az adatokhoz.

**Példa RLS szabályzatok a `predictions` táblán:**
\`\`\`sql
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Anonim felhasználók csak olvashatnak
CREATE POLICY "Allow read for anon" ON public.predictions
    FOR SELECT USING (true);

-- Service Role (backend) írhat és frissíthet
CREATE POLICY "Allow insert/update for service role" ON public.predictions
    FOR ALL USING (
        auth.role() = 'service_role'
    );
\`\`\`
Ez biztosítja, hogy a frontend kliens (anonim kulccsal) csak olvashassa a predikciókat, míg a backend (service_role kulccsal) írhassa és frissíthesse azokat.

### 3.4. Adatbázis Függvények és Cron Jobok

**`cleanup_old_predictions()` függvény**
Ez a függvény törli a lejárt predikciókat a `predictions` táblából.
\`\`\`sql
CREATE OR REPLACE FUNCTION public.cleanup_old_predictions() RETURNS VOID AS $$
BEGIN
    DELETE FROM public.predictions
    WHERE generated_at < now() - INTERVAL '30 days'; -- Törli a 30 napnál régebbi predikciókat
END;
$$ LANGUAGE plpgsql;
\`\`\`

**Cron Job ütemezése**
A Supabase beépített `pg_cron` kiterjesztésével ütemezhetjük a `cleanup_old_predictions()` függvény napi futtatását.
\`\`\`sql
SELECT cron.schedule(
    'cleanup_predictions_daily', -- Job neve
    '0 3 * * *',                 -- Cron kifejezés (minden nap 03:00-kor)
    $$ SELECT public.cleanup_old_predictions(); $$ -- Futtatandó SQL
);
\`\`\`

---

## 4. Autentikáció (Jövőbeli Bővítés)

Bár a jelenlegi rendszer nem tartalmaz felhasználói autentikációt, a Supabase Auth robusztus megoldást kínál:
*   **E-mail és jelszó alapú bejelentkezés/regisztráció.**
*   **OAuth szolgáltatók** (Google, GitHub stb.) integrációja.
*   **Row Level Security** integráció a felhasználói ID alapján.
*   **JWT (JSON Web Token)** alapú munkamenet-kezelés.

**Példa (koncepcionális):**
\`\`\`typescript
// Regisztráció
const { user, session, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// Bejelentkezés
const { user, session, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Felhasználó lekérdezése
const { data: { user } } = await supabase.auth.getUser()
\`\`\`

---

## 5. Valós Idejű Frissítések (Jövőbeli Bővítés)

A Supabase Realtime lehetővé teszi az adatbázis változásainak valós idejű figyelését. Ez hasznos lehet például élő mérkőzésállások vagy frissülő predikciók megjelenítésére.

**Példa (koncepcionális):**
\`\`\`typescript
'use client'
import { getSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function LiveScoreDisplay() {
  const [latestScore, setLatestScore] = useState('N/A')
  const supabase = getSupabaseClient()

  useEffect(() => {
    const channel = supabase
      .channel('match_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: 'id=eq.some_match_id' },
        (payload) => {
          console.log('Change received!', payload)
          setLatestScore(`${payload.new.home_score} - ${payload.new.away_score}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      <h3>Élő Állás:</h3>
      <p>{latestScore}</p>
    </div>
  )
}
\`\`\`

---

## 6. Best Practices és Biztonság

*   **Környezeti Változók**: Soha ne hardcode-olj API kulcsokat a kódban. Használj környezeti változókat (`.env`, Vercel Environment Variables).
*   **RLS**: Mindig engedélyezd az RLS-t minden táblán, és definiálj szigorú szabályzatokat.
*   **Service Role Key**: A `SUPABASE_SERVICE_ROLE_KEY` kulcsot csak szerveroldalon használd, és soha ne tedd elérhetővé a kliensoldalon.
*   **Input Validáció**: Minden felhasználói bemenetet validálj a backend oldalon, mielőtt adatbázis műveleteket hajtasz végre.
*   **Hiba Kezelés**: Implementálj robusztus hiba kezelést az adatbázis műveletek során.
*   **Monitoring**: Figyeld a Supabase projektet a Dashboardon keresztül (lekérdezési teljesítmény, hiba logok).
*   **Adatbázis Optimalizálás**: Használj indexeket a gyakran lekérdezett oszlopokon. Optimalizáld a komplex lekérdezéseket.

---

Ez a dokumentum átfogó képet nyújt a Supabase integrációjáról a rendszerben, és segíti a fejlesztőket a hatékony és biztonságos adatkezelésben.
