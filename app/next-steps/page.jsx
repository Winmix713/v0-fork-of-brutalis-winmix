export const revalidate = 0

export default function NextStepsPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-200 p-4 md:p-8 lg:p-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Következő lépések javaslatok</h1>
          <p className="text-muted-foreground">Rövid- és középtávú teendők a rendszer továbbfejlesztéséhez.</p>
        </header>

        <section aria-labelledby="model-integracio" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="model-integracio" className="mb-3 text-xl font-semibold">1. Modell-integráció és pontosság</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Mock AI helyett valódi ML modell(ek) integrálása (pl. Python szolgáltatás vagy Edge Function)</li>
            <li>Pontosságmérés automatizálása (public.get_prediction_accuracy_stats naplózása és dashboard)</li>
            <li>Több modell (Poisson, ELO, xG) bevezetése és ensemble súlyok validációja A/B tesztekkel</li>
          </ul>
        </section>

        <section aria-labelledby="adatminoseg" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="adatminoseg" className="mb-3 text-xl font-semibold">2. Adatminőség és import</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Valós mérkőzésadat-forrás integrálása (API/Csv pipeline keményített validációval)</li>
            <li>Rendszeres adatminőség-ellenőrzés és anomália-detektálás</li>
            <li>Teljesítményes indexek felülvizsgálata nagy adattömeg esetén</li>
          </ul>
        </section>

        <section aria-labelledby="teljesitmeny-cache" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="teljesitmeny-cache" className="mb-3 text-xl font-semibold">3. Teljesítmény és cache</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Cache stratégia finomítása (kulcs-sémák, TTL ligánként/időablak szerint)</li>
            <li>Cache statisztikák mérőszámokkal (hit rate, átlagos generálási idő)</li>
            <li>Ütemezett takarítás Supabase Cronnal és részletes logok</li>
          </ul>
        </section>

        <section aria-labelledby="biztonsag" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="biztonsag" className="mb-3 text-xl font-semibold">4. Biztonság és megfelelőség</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Rate limiting az API végpontokra (middleware)</li>
            <li>Beviteli validáció szigorítása (zod/yup)</li>
            <li>RLS szabályok felülvizsgálata (audit logok, jogosultságok)</li>
          </ul>
        </section>

        <section aria-labelledby="frontend-elmeny" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="frontend-elmeny" className="mb-3 text-xl font-semibold">5. Frontend élmény</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Predikciós kártyák finomítása (tooltipok, verzió címgombok, cache jelzők)</li>
            <li>Hozzáférhetőség (ARIA szerepek, fókusz-kezelés) szélesebb lefedettség</li>
            <li>Reszponzív optimalizálás kis képernyőkre (grafikonok, slider érintésre)</li>
          </ul>
        </section>

        <section aria-labelledby="observability" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="observability" className="mb-3 text-xl font-semibold">6. Observability</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Hibakövetés (Sentry/LogRocket) és teljesítmény-metrikák bevezetése</li>
            <li>Alkalmazás- és DB-szintű monitoring panelek</li>
          </ul>
        </section>

        <section aria-labelledby="teszteles" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="teszteles" className="mb-3 text-xl font-semibold">7. Tesztelés és QA</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>E2E tesztek (Playwright/Cypress) kritikus felhasználói utakra</li>
            <li>Lefedettség &gt;80% kulcsterületeken (date-utils, hooks, API)</li>
            <li>Regressziós tesztcsomag cache és predikciós áramkörökre</li>
          </ul>
        </section>

        <section aria-labelledby="dokumentacio" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 id="dokumentacio" className="mb-3 text-xl font-semibold">8. Dokumentáció és DevEx</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>API szerződés dokumentálása (OpenAPI)</li>
            <li>Fejlesztői onboarding útmutató (env példák, migrációk, tesztadat)</li>
            <li>CI/CD pipeline bővítése (lint, typecheck, jest, e2e, preview deploy)</li>
          </ul>
        </section>

        <footer className="pt-4 text-sm text-muted-foreground">
          <a href="/" className="underline">Vissza a főoldalra</a>
        </footer>
      </div>
    </main>
  )
}
