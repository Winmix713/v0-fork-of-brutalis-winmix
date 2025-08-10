import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Ensure these are defined in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side only

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing from environment variables.")
}

// Client-side Supabase client (for public access) - Directly exported for backward compatibility
export let supabase: SupabaseClient | null = null
export let supabaseServiceRole: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!)
  // Only initialize service role client on the server
  if (typeof window === "undefined" && supabaseServiceRoleKey) {
    supabaseServiceRole = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        persistSession: false,
      },
    })
  }
} else {
  console.warn("Supabase environment variables are not configured. Database operations will not work.")
}

// Type definitions for your database schema
// This should match your actual Supabase table structure
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      matches: {
        Row: {
          id: number
          created_at: string
          updated_at: string | null
          match_time: string // ISO string
          home_team: string // Changed from home_team_name
          away_team: string // Changed from away_team_name
          full_time_home_goals: number
          full_time_away_goals: number
          half_time_home_goals: number
          half_time_away_goals: number
          league: string | null
          season: string | null
          // Add other columns from your matches table
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string | null
          match_time: string
          home_team: string
          away_team: string
          full_time_home_goals: number
          full_time_away_goals: number
          half_time_home_goals: number
          half_time_away_goals: number
          league?: string | null
          season?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string | null
          match_time?: string
          home_team?: string
          away_team?: string
          full_time_home_goals?: number
          full_time_away_goals?: number
          half_time_home_goals?: number
          half_time_away_goals?: number
          league?: string | null
          season?: string | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          home_team: string
          away_team: string
          match_date: string // date string YYYY-MM-DD
          league: string
          model_type: "form" | "h2h" | "ensemble"
          prediction: Json
          confidence: number | null
          cache_key: string
          generated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          home_team: string
          away_team: string
          match_date: string
          league: string
          model_type: "form" | "h2h" | "ensemble"
          prediction: Json
          confidence?: number | null
          cache_key: string
          generated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          home_team?: string
          away_team?: string
          match_date?: string
          league?: string
          model_type?: "form" | "h2h" | "ensemble"
          prediction?: Json
          confidence?: number | null
          cache_key?: string
          generated_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_predictions: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type definitions from previous context for matches module
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"]

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

export interface EnhancedPrediction {
  id: number
  league: string
  home_team: string
  away_team: string
  match_date: string
  prediction: any
  features: any
  model_version: string
  confidence: number
  cache_key: string
  generated_at: string
  expires_at: string
  created_by?: string
  generation_time_ms?: number
  data_quality_score?: number
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

/**
 * Generate cache key for prediction
 */
function generateCacheKey(homeTeam: string, awayTeam: string, league: string, matchDate: string): string {
  return `${league}:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}:${matchDate}`
}

/**
 * Get enhanced prediction from cache or calculate new one
 */
export async function getEnhancedPrediction(
  homeTeam: string,
  awayTeam: string,
  league: string,
  matchDate: string,
): Promise<Prediction | null> {
  if (!supabase) {
    console.error("Supabase client not initialized for getEnhancedPrediction.")
    return null
  }

  const key = generateCacheKey(homeTeam, awayTeam, league, matchDate)
  const { data, error } = await supabase.from("predictions").select("*").eq("cache_key", key).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 means no rows found
    console.error("Error fetching enhanced prediction from cache:", error)
    return null
  }

  return data || null
}

/**
 * Save enhanced prediction to cache
 */
export async function saveEnhancedPrediction(
  predictionData: Omit<Prediction, "id" | "generated_at">,
): Promise<Prediction | null> {
  if (!supabaseServiceRole) {
    // Use service role for writing to predictions table
    console.error("Supabase service role client not initialized for saveEnhancedPrediction.")
    return null
  }

  const { data, error } = await supabaseServiceRole
    .from("predictions")
    .upsert(predictionData as any, { onConflict: "cache_key" }) // Use 'cache_key' for conflict resolution
    .select()
    .single()

  if (error) {
    console.error("Error saving enhanced prediction to cache:", error)
    return null
  }

  return data
}
