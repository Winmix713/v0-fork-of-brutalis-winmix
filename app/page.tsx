import MatchesList from "@/components/matches-list"
import type { Match } from "@/lib/supabase"

export const revalidate = 0 // Ensure data is always fresh on page load

export default async function Home() {
  const initialMatches: Match[] = []
  let error: string | null = null

  try {
    // In a real application, you would fetch initial data from Supabase here
    // This is a Server Component, so it can directly call server-side functions
    // initialMatches = await getRealMatches(20); // Fetch some initial matches
  } catch (e: any) {
    console.error("Failed to fetch initial matches for homepage:", e)
    error = e.message || "Failed to load initial match data."
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12 bg-gradient-to-br from-gray-50 to-gray-200">
      {error && (
        <div className="mb-4 text-red-600 text-center">
          <p className="font-semibold">Hiba történt:</p>
          <p>{error}</p>
        </div>
      )}
      <MatchesList initialMatches={initialMatches} />
    </main>
  )
}
