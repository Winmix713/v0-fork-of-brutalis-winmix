# Rendszer Dokumentáció - Enhanced Football Predictions v1.1 (Verzió 21)

**Dátum:** 2025. augusztus 10.
**Verzió:** 21 (Enhanced Football Predictions v1.1)

---

## 1. Bevezetés

Ez a dokumentum az Enhanced Football Predictions rendszer "Verzió 21" állapotát rögzíti. Célja, hogy átfogó képet adjon a rendszer funkcionalitásáról, architektúrájáról, minőségbiztosítási folyamatairól és a jövőbeli fejlesztési irányokról. A rendszer célja, hogy fejlett statisztikai és gépi tanulási modellek segítségével pontos labdarúgó-mérkőzés előrejelzéseket biztosítson.

---

## 2. Rendszer Áttekintés

A rendszer egy webes alkalmazásból (Next.js frontend), egy robusztus backend API-ból (Next.js Route Handlers), és egy Supabase alapú adatbázisból áll. Képes mérkőzésadatok lekérdezésére, fejlett predikciók generálására, és ezek cache-elésére a gyors válaszidő érdekében.

**Fő komponensek:**
*   **Frontend (Next.js App Router)**: Felhasználói felület a mérkőzések megtekintéséhez, csapatstatisztikákhoz és predikciókhoz.
*   **Backend API (Next.js Route Handlers)**: Kezeli az adatlekérdezéseket, feature extrációt, predikciós számításokat és a cache-elést.
*   **Adatbázis (Supabase - PostgreSQL)**: Tárolja a mérkőzésadatokat, a generált predikciókat és a kapcsolódó statisztikákat.
*   **Segéd PHP scriptek**: Külső adatforrások feldolgozására és statisztikai modellek futtatására (bár a fő predikciós logika átkerült a Next.js API-ba).

---

## 3. Architektúra

```mermaid title="Rendszer Architektúra Áttekintés" type="diagram"
graph TD;
    User[Felhasználó] |HTTP/HTTPS| Frontend[Next.js Frontend];
    Frontend |API Hívások| BackendAPI[Next.js Backend API];
    BackendAPI |DB Lekérdezések| Supabase[Supabase (PostgreSQL)];
    Supabase |Adatok| BackendAPI;
    BackendAPI |Cache Írás/Olvasás| Supabase;
    CI_CD[CI/CD Pipeline (GitHub Actions)] |Deploy| Vercel[Vercel Hosting];
    CI_CD |DB Migrációk| Supabase;
    Monitoring[Monitoring Eszközök] |Logok, Metrikák| BackendAPI;
