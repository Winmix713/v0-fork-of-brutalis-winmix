## **Backend Functional Check – QA Checklist**

Ez a checklist a `BASE_URL`-lel futó `backend-functional-check.js` scripthez és a manuális QA-hoz igazodik.

### **0. Előkészítés**

*   [ ] `BASE_URL` beállítva (`http://localhost:3000` vagy staging domain)
*   [ ] `.env` fájl érvényes, minden szükséges kulccsal (pl. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ha szerver oldali hívásokhoz szükséges)
*   [ ] Backend fut és elérhető a `BASE_URL` alatt

---

### **1. Alap API elérhetőség**

*   [ ] `GET /api/health` → `200 OK`, `"status": "ok"` (Ha van ilyen endpoint)
*   [ ] `GET /api/version` → API verziószám visszaadása (Ha van ilyen endpoint)

---

### **2. Meccsadatok**

*   [ ] `GET /api/matches` (vagy a megfelelő endpoint) → Lista visszaadása, minden mező (`id`, `match_date`, `home_team_name`, `away_team_name`, `score_home`, `score_away`, `league`) helyes és kitöltött.
*   [ ] `GET /api/matches/:id` → Egyedi meccs részletek helyesek.
*   [ ] Hibakezelés: nem létező ID → `404 Not Found` vagy megfelelő hibaüzenet JSON formátumban.

---

### **3. Prediction API**

*   [ ] `GET /api/enhanced-prediction?home=...&away=...&league=...` → `200 OK` + valid JSON válasz a következő mezőkkel:
    *   `home_win`, `draw`, `away_win` (numerikus, 0-1 között)
    *   `btts`, `over_2_5` (numerikus, 0-1 között)
    *   `confidence` (numerikus, 0-1 között)
    *   `features` (JSON objektum, tartalmazza a felhasznált feature-öket)
    *   `model_version` (string, pl. "statistical_v1", "ensemble_v1")
    *   `generated_at` (ISO 8601 formátumú dátum string)
*   [ ] Hiányzó vagy érvénytelen paraméter (pl. `home`, `away`, `league`) → `400 Bad Request` vagy megfelelő hibaüzenet JSON formátumban.
*   [ ] Időmérés (`generationTimeMs`) logolódik a szerver oldalon.
*   [ ] Cache hit/miss logolódik és működik (ellenőrizd a logokat, vagy ha van `cache-status` endpoint).
*   [ ] A `model_type` (form, h2h, ensemble) helyesen szerepel a válaszban, ha releváns.
*   [ ] Edge cases: kevés adat (<5 meccs) → `warning: "insufficient_data"` üzenet a válaszban, és `confidence` csökkentett / null értékű.

---

### **4. Supabase integráció (Cache & DB)**

*   [ ] Cache olvasás/írás működik (`public.predictions` tábla).
*   [ ] Új predikció generálásakor új rekord jön létre a `predictions` táblában.
*   [ ] Ugyanazon predikció ismételt kérésekor a cache-ből szolgálja ki (ellenőrizd a `generated_at` időbélyeget és a logokat).
*   [ ] A `cleanup_old_predictions()` függvény működik, és a `cron.schedule` beállítás szerint naponta fut (ellenőrizd a Supabase logs/schedulerben).
*   [ ] RLS (Row Level Security) beállítások helyesek:
    *   `anon` szerepkör csak `SELECT` joggal rendelkezik a `predictions` táblán.
    *   `service_role` szerepkör `INSERT`/`UPDATE` joggal rendelkezik a `predictions` táblán.

---

### **5. Adatkonzisztencia**

*   [ ] `home_team_name` és `away_team_name` mezők mindenhol egységesek (adatbázis, API válaszok).
*   [ ] Null vagy hiányzó mező nincs a kötelező oszlopokban (pl. `match_date`, `home_team_name`, `away_team_name`, `league`).
*   [ ] Dátumformátumok: Mindenhol egységesen ISO 8601 formátum (`YYYY-MM-DDTHH:mm:ssZ`) vagy a megbeszélt formátum.

---

### **6. Hibakezelés**

*   [ ] Hibás route → `404 Not Found` JSON válasz.
*   [ ] Adatbázis hiba (pl. rossz lekérdezés) → Graceful error JSON válasz, nem belső szerver hiba üzenet.
*   [ ] Prediction számítási hiba → Fallback értékek vagy értelmes hibaüzenet JSON formátumban.

---

### **7. Teljesítmény**

*   [ ] Cache hit válaszidő < 200ms (API válaszidő mérése).
*   [ ] Friss predikció számítási idő < 2s (API válaszidő mérése).
*   [ ] Nincs memória-szivárgás / felesleges CPU terhelés (szerver monitoringgal ellenőrizhető).

---

### **8. Biztonság**

*   [ ] Nincs érzékeny kulcs (pl. `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`) a frontend kódba égetve, csak a szerver oldalon elérhető.
*   [ ] API input szűrés SQL injection ellen (minden DB hívás PDO / prepared statements / Supabase client parameter használattal).
*   [ ] Rate-limit vagy throttling aktív az API endpointokon (ha implementálva van).

---

Ez a checklist részletesen lefedi a backend funkcionalitásának ellenőrzését.

Akarod, hogy elkészítsem a **teljes automatizált teszt scriptet** (`backend-functional-check.js`), ami végigfut ezeken a pontokon és riportot ad? Ez nagyban megkönnyítené a fejlesztő munkáját.
