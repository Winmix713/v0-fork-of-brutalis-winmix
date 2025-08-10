import MatchesList from "@/components/matches-list"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Futballmeccsek Adatbázis</h1>
        <p className="text-muted-foreground">Meccseredmények megtekintése és keresése</p>
      </div>
      <MatchesList />
    </main>
  )
}
