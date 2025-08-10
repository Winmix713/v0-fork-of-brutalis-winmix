# Biztonsági Tisztítás és Kulcsrotációs Útmutató

Ez az útmutató részletezi a repository történetéből származó érzékeny adatok (pl. API kulcsok, jelszavak, demo adatok) eltávolításának folyamatát, valamint a kapcsolódó kulcsrotációs lépéseket. **Ez egy kritikus, blokkoló feladat, amelyet minden más munka előtt el kell végezni.**

---

## 0) Kiemelten Fontos, Nem Tárgyalható Utasítás

Minden **placeholder**, **demo**, **példa-adat**, **sample-credential**, **hardcode-API kulcs**, **test-jelszó**, vagy bármilyen érzékeny adat **AZONNAL** törlendő a forrásból **és** a git történetből.

**Ha a repo tartalmaz Supabase / Postgres / bármilyen valódi kulcsot, rotáljátok azonnal az érintett kulcsokat (SUPABASE_SERVICE_ROLE_KEY, ANON key, DB password stb.) és jelezzétek a tulajdonosnak.**

---

## 1) Előkészületek

### 1.1) Eszközök Telepítése

Az érzékeny adatok Git történetből való eltávolításához a `git-filter-repo` vagy a BFG Repo-Cleaner eszközöket ajánljuk. A `git-filter-repo` a Git hivatalos eszköze, míg a BFG egy gyorsabb, Java alapú alternatíva.

**`git-filter-repo` telepítése (ajánlott):**
\`\`\`bash
# macOS (Homebrew-val)
brew install git-filter-repo

# Linux (pip-pel)
pip3 install git-filter-repo

# Windows (pip-pel, Git Bash-ben)
pip3 install git-filter-repo
\`\`\`

**BFG Repo-Cleaner telepítése (alternatíva):**
Töltsd le a legújabb `.jar` fájlt a hivatalos GitHub oldalról: [https://github.com/rtyley/bfg-repo-cleaner/releases](https://github.com/rtyley/bfg-repo-cleaner/releases)
Helyezd el egy könnyen elérhető helyre (pl. `~/bin/bfg.jar`).

### 1.2) Repo Klónozása Tisztításhoz

**Fontos:** A tisztítást egy friss, "meztelen" klónon végezd, hogy elkerüld a helyi referenciák problémáit.
\`\`\`bash
git clone --mirror https://github.com/Winmix713/v0-fork-of-brutalis-winmix.git
cd v0-fork-of-brutalis-winmix.git # Ez a "meztelen" klón könyvtára
\`\`\`

---

## 2) Érzékeny Adatok Azonosítása

Mielőtt törölnénk, azonosítsuk, hol lehetnek érzékeny adatok. A következő `grep` parancs segít a gyors átvizsgálásban:

\`\`\`bash
# A repo gyökérkönyvtárából futtatva
grep -RIn --exclude-dir=.git --exclude-dir=node_modules -e "SUPABASE" -e "ANON" -e "SERVICE_ROLE" -e "password" -e "secret" -e "apiKey" -e "demo" -e "example" -e "placeholder" -e "sample" -e "TODO" -e "FIXME" || true
\`\`\`
Ez a parancs kiírja azokat a fájlokat és sorokat, amelyek a megadott kulcsszavakat tartalmazzák. Jegyezd fel ezeket a fájlokat és a bennük lévő érzékeny tartalmakat.

---

## 3) Git Történet Tisztítása

**Figyelem:** Ez a művelet átírja a Git történetét! Győződj meg róla, hogy mindenki tud róla, és koordináld a csapattal, mielőtt `git push --force`-ot használnál.

### 3.1) `git-filter-repo` Használata (ajánlott)

Ez az eszköz fájlok, mappák vagy konkrét tartalmak eltávolítására is alkalmas.

**Példa: Konkrét fájlok eltávolítása a történetből**
Ha tudod, hogy mely fájlok tartalmaztak érzékeny adatokat (pl. `config.js`, `secrets.env`), akkor eltávolíthatod őket:
\`\`\`bash
git filter-repo --path config.js --path secrets.env --invert-paths --force
\`\`\`
*   `--path <fájl>`: A törlendő fájl(ok) elérési útja.
*   `--invert-paths`: Azt jelenti, hogy mindent megtart, kivéve a megadott fájlokat.
*   `--force`: Erőlteti a műveletet.

**Példa: Konkrét szöveges tartalom eltávolítása a történetből**
Ha egy konkrét kulcsot vagy jelszót szeretnél eltávolítani, ami több fájlban is előfordult:
\`\`\`bash
git filter-repo --replace-text <(echo 'YOUR_SENSITIVE_KEY==>REDACTED') --force
\`\`\`
*   Cseréld ki a `YOUR_SENSITIVE_KEY` részt a tényleges érzékeny adatra. A `REDACTED` helyére bármilyen szöveg kerülhet, vagy akár üres string is lehet.
*   **Fontos:** Ha speciális karakterek vannak a kulcsban, azokat escape-elni kell, vagy használj reguláris kifejezéseket.

**Példa: Placeholder/demo fájlok eltávolítása (pl. `public/images/dribbble-getting-started.png`)**
\`\`\`bash
git filter-repo --path public/images/dribbble-getting-started.png --path public/images/dribbble-shot.jpg --path public/images/stats-card-example.png --path public/images/desired-layout.png --path public/images/general-stats.png --path public/images/team-analysis.png --path public/images/ai-predictions.png --invert-paths --force
\`\`\`
Ez a parancs eltávolítja a megadott képfájlokat a teljes Git történetből.

### 3.2) BFG Repo-Cleaner Használata (alternatíva)

A BFG különösen hatékony nagy repository-k és nagy fájlok eltávolítására.

**Példa: Fájlok eltávolítása a történetből (pl. `secrets.env`)**
\`\`\`bash
java -jar ~/bin/bfg.jar --delete-files secrets.env --no-blob-protection v0-fork-of-brutalis-winmix.git
\`\`\`
*   `--delete-files <fájlnév>`: Eltávolítja a megadott nevű fájlt a történetből.
*   `--no-blob-protection`: Engedélyezi a fájlok törlését, még akkor is, ha azok a legújabb commitban is szerepelnek.

**Példa: Érzékeny szöveges tartalom eltávolítása (pl. jelszavak)**
Hozd létre egy `words-to-obliterate.txt` fájlt, és írd bele soronként az eltávolítandó érzékeny szövegeket:
\`\`\`
MY_SUPER_SECRET_KEY
ANOTHER_PASSWORD
\`\`\`
Majd futtasd a BFG-t:
\`\`\`bash
java -jar ~/bin/bfg.jar --replace-text-with "***REDACTED***" --no-blob-protection --strip-text-from-commits words-to-obliterate.txt v0-fork-of-brutalis-winmix.git
\`\`\`
*   `--replace-text-with "***REDACTED***"`: A talált szövegeket erre cseréli.
*   `--strip-text-from-commits <fájl>`: A megadott fájlban lévő szövegeket keresi és távolítja el.

### 3.3) Tisztítás Utáni Lépések

Miután a `git-filter-repo` vagy BFG lefutott, a "meztelen" klónod története átíródott. Most frissítened kell a helyi klónodat és a távoli repository-t.

1.  **Lépj vissza a "meztelen" klón könyvtárából:**
    \`\`\`bash
    cd ..
    \`\`\`
2.  **Frissítsd a helyi klónodat:**
    \`\`\`bash
    # Ha van már egy helyi klónod, töröld és klónozd újra
    rm -rf v0-fork-of-brutalis-winmix
    git clone https://github.com/Winmix713/v0-fork-of-brutalis-winmix.git
    cd v0-fork-of-brutalis-winmix
    \`\`\`
    **VAGY** ha nem akarod újra klónozni, de ez kockázatosabb:
    \`\`\`bash
    git remote set-url origin v0-fork-of-brutalis-winmix.git # A "meztelen" klón elérési útja
    git fetch origin
    git reset --hard origin/main # Vagy a fő branch neve
    git clean -fd
    \`\`\`
3.  **Force Push a távoli repository-ra:**
    **EZ A LÉPÉS ÁTÍRJA A TÁVOLI REPO TÖRTÉNETÉT! GYŐZŐDJ MEG RÓLA, HOGY MINDENKI TUD RÓLA, ÉS EGYEZTESS A CSAPATTAL!**
    \`\`\`bash
    git push --force --all origin
    git push --force --tags origin
    \`\`\`
    Ez felülírja a távoli repository-t a megtisztított történettel.

---

## 4) Kulcsrotációs Checklist

Miután az érzékeny adatok eltávolításra kerültek a Git történetéből, **azonnal rotálni kell az összes érintett kulcsot**. Ez biztosítja, hogy a korábban esetlegesen kompromittált kulcsok érvénytelenné váljanak.

### 4.1) Supabase Kulcsok Rotálása

1.  **Lépj be a Supabase projektedbe.**
2.  **Navigálj a Project Settings -> API menüpontba.**
3.  **`anon` (Public) kulcs rotálása:**
    *   Kattints a "Generate new key" gombra az `anon` kulcs mellett.
    *   **Frissítsd a `NEXT_PUBLIC_SUPABASE_ANON_KEY` környezeti változót** a Vercel-ben (vagy más CI/CD platformon) és a helyi `.env.local` fájlban.
4.  **`service_role` (Secret) kulcs rotálása:**
    *   Kattints a "Generate new key" gombra a `service_role` kulcs mellett.
    *   **Frissítsd a `SUPABASE_SERVICE_ROLE_KEY` környezeti változót** a Vercel-ben (vagy más CI/CD platformon). **Soha ne tedd ezt a kulcsot frontend kódba vagy publikus környezeti változóba!**
5.  **JWT Secret rotálása (ha használsz egyedi JWT-t):**
    *   Navigálj a Project Settings -> Authentication -> Settings menüpontba.
    *   Kattints a "Rotate secret" gombra a JWT Secret mellett.
    *   **Frissítsd a `SUPABASE_JWT_SECRET` környezeti változót** a Vercel-ben (vagy más CI/CD platformon).

### 4.2) PostgreSQL Adatbázis Jelszó Rotálása

1.  **Lépj be a Supabase projektedbe.**
2.  **Navigálj a Project Settings -> Database menüpontba.**
3.  **Keresd meg a "Database Password" szekciót.**
4.  **Kattints a "Reset Database Password" gombra.**
5.  **Frissítsd az összes kapcsolódó környezeti változót** (pl. `DATABASE_URL`, `POSTGRES_PASSWORD`) a Vercel-ben (vagy más CI/CD platformon) és a helyi `.env.local` fájlban.

### 4.3) Egyéb API Kulcsok / Jelszavak Rotálása

Ha a repo más külső szolgáltatások (pl. harmadik féltől származó API-k) kulcsait is tartalmazta, azokat is rotálni kell a megfelelő szolgáltató felületén, majd frissíteni a környezeti változókat.

---

## 5) Ellenőrzés és Dokumentáció

1.  **Ellenőrizd újra a repository-t:** Futtasd le a `grep` parancsot a megtisztított repository-n, hogy megbizonyosodj arról, hogy az érzékeny adatok valóban eltűntek.
2.  **Kommunikáció:** Tájékoztasd a csapatot a sikeres tisztításról és a kulcsrotációról. Mindenki klónozza újra a repository-t, vagy frissítse a helyi klónját a `git reset --hard origin/main` paranccsal.
3.  **Dokumentáció:** Dokumentáld a megtett lépéseket, a rotált kulcsokat és az új környezeti változók helyét.

---

**Záró Megjegyzés:**
Ez a folyamat kritikus a projekt biztonsága szempontjából. Ne térj át más feladatokra, amíg ez a lépés nincs teljesen befejezve és ellenőrizve.
