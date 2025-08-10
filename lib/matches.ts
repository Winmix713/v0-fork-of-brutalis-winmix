import { supabase } from "./supabase" // Ensure supabase is imported
import type { Match, FormattedMatch } from "./supabase" // Ensure Match and FormattedMatch types are imported

// Hibaüzenet a hiányzó konfiguráció esetén
const SUPABASE_ERROR = "Supabase nincs megfelelően konfigurálva. Ellenőrizd a környezeti változókat."
const TABLE_NOT_FOUND_ERROR =
  "A 'matches' tábla nem található. Kérlek, győződj meg róla, hogy létrehoztad a Supabase adatbázisodban."

// Összes meccs lekérdezése (limitált, hogy ne legyen túl lassú)
export async function getAllMatches(limit = 100): Promise<Match[]> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_time", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Hiba a meccsek lekérdezése során:", error)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }
    throw error
  }

  return data || []
}

// Keresési függvény hazai és vendég csapat alapján
export async function searchMatches(homeTeam?: string, awayTeam?: string, limit = 50): Promise<Match[]> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  let query = supabase.from("matches").select("*")

  if (homeTeam && homeTeam.trim()) {
    query = query.ilike("home_team", `%${homeTeam.trim()}%`)
  }
  if (awayTeam && awayTeam.trim()) {
    query = query.ilike("away_team", `%${awayTeam.trim()}%`)
  }

  query = query.order("match_time", { ascending: false }).limit(limit)

  const { data, error } = await query

  if (error) {
    console.error("Hiba a meccsek keresése során:", error)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }
    throw error
  }

  return data || []
}

// Csapat nevek lekérdezése autocomplete-hez
export async function getTeamNames(): Promise<string[]> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  // The error was 'column matches.home_team does not exist'.
  // Assuming the correct column names are 'home_team_name' and 'away_team_name' as previously discussed.
  // If the actual column names in your DB are 'home_team' and 'away_team', please revert this change.
  const { data, error } = await supabase.from("matches").select("home_team_name, away_team_name").limit(1000)

  if (error) {
    console.error("Hiba a csapat nevek lekérdezése során:", error)
    return []
  }

  const teams = new Set<string>()
  data?.forEach((match) => {
    // Ensure you're accessing the correct properties based on your DB schema.
    // If 'home_team_name' and 'away_team_name' are correct:
    if (match.home_team_name) teams.add(match.home_team_name)
    if (match.away_team_name) teams.add(match.away_team_name)
    // If your DB uses 'home_team' and 'away_team', change above to:
    // if (match.home_team) teams.add(match.home_team)
    // if (match.away_team) teams.add(match.away_team)
  })

  return Array.from(teams).sort()
}

// Formázott meccsek lekérdezése
export async function getFormattedMatches(limit = 100): Promise<FormattedMatch[]> {
  const matches = await getAllMatches(limit)

  return matches.map((match) => ({
    id: match.id,
    match_date: new Date(match.match_time).toLocaleDateString("hu-HU"), // Assuming match_time exists
    home_team: match.home_team,
    away_team: match.away_team,
    result: `${match.full_time_home_goals}-${match.full_time_away_goals}`,
    half_time_result: `${match.half_time_home_goals}-${match.half_time_away_goals}`,
    total_goals: match.full_time_home_goals + match.full_time_away_goals,
    both_teams_scored: match.full_time_home_goals > 0 && match.full_time_away_goals > 0,
  }))
}

// Meccs keresése csapat név alapján
export async function searchMatchesByTeam(teamName: string, limit = 50): Promise<Match[]> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  // Assuming 'home_team_name' and 'away_team_name' are the column names.
  // If your DB uses 'home_team' and 'away_team', adjust the .or() clause accordingly.
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .or(`home_team_name.ilike.%${teamName}%,away_team_name.ilike.%${teamName}%`)
    .order("match_time", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Hiba a meccsek keresése során:", error)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }
    throw error
  }

  return data || []
}

// Csapat statisztikák lekérdezése
export async function getTeamStatistics(teamName: string): Promise<any> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .or(`home_team_name.ilike.%${teamName}%,away_team_name.ilike.%${teamName}%`) // Adjust if your DB uses 'home_team'
    .order("match_time", { ascending: false }) // Assuming match_time exists
    .limit(100)

  if (error) {
    console.error("Hiba a csapat statisztikák lekérdezése során:", error)
    throw error
  }

  return data || []
}

// Új meccs hozzáadása
export async function addMatch(match: Omit<Match, "id" | "created_at" | "updated_at">): Promise<Match> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  const { data, error } = await supabase.from("matches").insert([match]).select().single()

  if (error) {
    console.error("Hiba a meccs hozzáadása során:", error)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }
    throw error
  }

  return data
}

// Meccs frissítése
export async function updateMatch(id: number, updates: Partial<Match>): Promise<Match> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  const { data, error } = await supabase
    .from("matches")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Hiba a meccs frissítése során:", error)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }
    throw error
  }

  return data
}

// Meccs törlése
export async function deleteMatch(id: number): Promise<void> {
  if (!supabase) {
    throw new Error(SUPABASE_ERROR)
  }

  const { error } = await supabase.from("matches").delete().eq("id", id)

  if (error) {
    console.error("Hiba a meccs törlése során:", error)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }
    throw error
  }
}
