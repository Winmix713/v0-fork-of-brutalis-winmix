import { supabase } from "./supabase"
import type { Match } from "./supabase"

export async function searchMatches(homeTeam?: string, awayTeam?: string, limit = 50): Promise<Match[]> {
  let query = supabase.from("matches").select("*").order("match_time", { ascending: false })

  if (homeTeam) {
    query = query.ilike("home_team", `%${homeTeam}%`)
  }
  if (awayTeam) {
    query = query.ilike("away_team", `%${awayTeam}%`)
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    console.error("Error searching matches:", error)
    throw new Error(error.message)
  }

  return data as Match[]
}

export async function getTeamNames(): Promise<string[]> {
  const { data: homeTeams, error: homeError } = await supabase.from("matches").select("home_team").distinct()

  const { data: awayTeams, error: awayError } = await supabase.from("matches").select("away_team").distinct()

  if (homeError || awayError) {
    console.error("Error fetching team names:", homeError || awayError)
    throw new Error((homeError || awayError)?.message || "Failed to fetch team names")
  }

  const allTeamNames = new Set<string>()
  homeTeams?.forEach((row) => allTeamNames.add(row.home_team))
  awayTeams?.forEach((row) => allTeamNames.add(row.away_team))

  return Array.from(allTeamNames).sort()
}

export async function searchMatchesByTeam(teamName: string, limit = 50): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .or(`home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%`)
    .order("match_time", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error searching matches by team:", error)
    throw new Error(error.message)
  }

  return data as Match[]
}
