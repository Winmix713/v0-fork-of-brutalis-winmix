# QA Állapotfelmérő Űrlap – Enhanced Football Predictions v1.1

## Cél
Ez a dokumentum egy konkrét kérdéslistát biztosít a fejlesztési állapot, a fennálló problémák és a következő lépések felméréséhez a Frontend és Backend csapatokkal folytatott megbeszélések során.

---

## **📌 FRONTEND – állapotfelmérő kérdések**

### **1. Állapot**
- [ ] Melyik komponensek vannak már 100%-ban kész? (pl. Prediction Card, Monitoring Widget)
  - _Komponens listája:_
- [ ] Melyik funkciók vannak kész, de még tesztelés alatt?
  - _Funkció listája:_
- [ ] Melyik részek hiányoznak még teljesen?
  - _Hiányzó részek listája:_
- [ ] A dátumkezelés (`safeFormatDate`) minden oldalon élesben működik, és a Hungarian localization helyes?
- [ ] A model clarity (badge-ek, tooltipek) minden kártyán egységesen megjelenik és pontos információt ad?
- [ ] Az Ensemble slider real-time működik, és betölti az utolsó beállítást a LocalStorage-ból?
- [ ] Responsive nézetek (mobil/tablet/desktop) le vannak tesztelve, és minden rendben van?

### **2. Problémák**
- [ ] Van még olyan oldal vagy komponens, ahol `Invalid Date` szöveg vagy hibás dátumformátum jelenik meg? Ha igen, hol?
- [ ] Lassulás tapasztalható nagy adatmennyiségnél (pl. slider mozgatás, hosszú lista renderelése)? Ha igen, hol és milyen mértékben?
- [ ] Van vizuális eltérés böngészők között (Chrome, Firefox, Safari, mobil böngészők)? Ha igen, milyen eltérések?
- [ ] Találkoztatok accessibility (színkontraszt, ARIA címkék, billentyűzet navigáció) hibákkal? Ha igen, mikkel?
- [ ] Minden hiba- és loading-állapot (pl. API hiba, hálózati probléma, adatok betöltése) kezelve van a UI-n?

### **3. Következő lépések**
- [ ] Milyen frontendes tesztek hiányoznak még (unit/e2e)?
- [ ] Van még szükség UI finomításra (színek, ikonok, spacing)? Ha igen, mik a prioritások?
- [ ] Milyen új funkciókat kell még integrálni a backend API-ból?
- [ ] Mikor tervezitek a staging build elkészítését és a QA csapat általi tesztelés megkezdését?

---

## **📌 BACKEND – állapotfelmérő kérdések**

### **1. Állapot**
- [ ] Az `enhanced_predictions` tábla, az indexek és a kapcsolódó nézetek (views) már élesben vannak a Supabase adatbázisban?
- [ ] A cache read/write/upsert logika teljesen működik, és konzisztensen tárolja az adatokat?
- [ ] A Prediction API (`/api/enhanced-prediction`) minden paraméterkombinációra (pl. hiányzó csapatnevek, érvénytelen dátumok) tesztelve van?
- [ ] A model blending (form + H2H + ensemble) számítás validált adatokkal, és a kimenetek logikusan megfelelnek?
- [ ] A generation time és cache hit/miss mérés működik, és logolásra/monitorozásra kerül?
- [ ] Supabase Row Level Security (RLS) és jogosultságok rendben vannak konfigurálva (pl. a frontend ne kapjon service role key-t)?

### **2. Problémák**
- [ ] Van olyan lekérdezés, ami még lassú (pl. >2s friss predikció generálás)? Ha igen, melyek és milyen tervek vannak az optimalizálásra?
- [ ] Akadt cache TTL vagy cleanup hiba? (pl. lejárt adatok nem törlődnek, vagy friss adatok nem kerülnek mentésre)
- [ ] Előfordulnak hiányos statisztikák a feature extractionnél (pl. kevés H2H meccs vagy csapat statisztika esetén)? Hogyan kezeljük ezeket?
- [ ] Volt adatkonzisztencia hiba migráció után? (pl. az új táblákban, indexekben)
- [ ] Minden API hiba megfelelően JSON formátumban tér vissza, és tartalmaz releváns hibakódokat/üzeneteket?

### **3. Következő lépések**
- [ ] Milyen további indexeket vagy query optimalizálásokat terveztek?
- [ ] Beépítjük-e a batch SQL verziót a gyorsításra, ha a terhelés indokolja?
- [ ] Lesz monitoring API endpoint a cache/DB állapot figyelésére, ami a frontend monitoring widgetet is táplálhatja?
- [ ] Mikor lesz production load test, és milyen eredményeket várunk tőle?

---

## **📌 KERESZTMETSZETI KÉRDÉSEK** (frontend + backend együtt)

- [ ] Van bármi adatstruktúra változás a backend API kimenetében, amit a frontend még nem követett le teljesen?
- [ ] Teszteltétek-e a teljes flow-t (API → frontend → felhasználó) production-szerű adatokkal és terheléssel?
- [ ] Találtatok eltérést a backend és frontend számítások között (pl. gólátlag, BTTS %)?
- [ ] Ki és mikor adja meg a végső *Go* jelet az élesítésre?
- [ ] Milyen hibákat hagyunk ismerten az első éles verzióban, és ezek milyen hatással lehetnek a felhasználói élményre?

---

**Kérjük, töltsd ki ezt az űrlapot a csapatoddal történt megbeszélések alapján, és oszd meg az eredményeket a következő felülvizsgálaton.**
