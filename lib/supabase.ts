import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

export interface Match {
  id: number
  match_time: string
  home_team: string
  away_team: string
  half_time_home_goals: number
  half_time_away_goals: number
  full_time_home_goals: number
  full_time_away_goals: number
  league?: string
  season?: string
  created_at: string
  updated_at?: string
}

export interface FormattedMatch {
  id: number
  match_date: string
  home_team: string
  away_team: string
  result: string
  half_time_result: string
  total_goals: number
  both_teams_scored: boolean
}

export interface PredictionData {
  id: number
  league: string
  home_team: string
  away_team: string
  features: any
  prediction: any
  model_version: string
  generated_at: string
  expires_at?: string
}
