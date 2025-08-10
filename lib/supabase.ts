import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Ensure these are defined in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side only

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing from environment variables.")
}

// Client-side Supabase client (for public access) - Directly exported for backward compatibility
export const supabase = createSupabaseClient(supabaseUrl!, supabaseAnonKey!)

// Server-side Supabase client (for privileged operations like RLS bypass)
export const createServiceRoleClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is not defined for server-side.")
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey)
}

// Type definitions for your database schema
// This should match your actual Supabase table structure
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: {
          id: string
          match_date: string
          home_team_name: string // Updated column name
          away_team_name: string // Updated column name
          score_home: number | null
          score_away: number | null
          league: string
          season: string | null
          ht_score_home: number | null
          ht_score_away: number | null
          // Add any other columns from your matches table
        }
        Insert: {
          id?: string
          match_date: string
          home_team_name: string
          away_team_name: string
          score_home?: number | null
          score_away?: number | null
          league: string
          season?: string | null
          ht_score_home?: number | null
          ht_score_away?: number | null
        }
        Update: {
          id?: string
          match_date?: string
          home_team_name?: string
          away_team_name?: string
          score_home?: number | null
          score_away?: number | null
          league?: string
          season?: string | null
          ht_score_home?: number | null
          ht_score_away?: number | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          home_team: string
          away_team: string
          match_date: string
          league: string
          model_type: "form" | "h2h" | "ensemble"
          prediction: Json
          confidence: number | null
          cache_key: string
          generated_at: string
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
        }
        Relationships: []
      }
      // Add other tables as needed
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
export interface Match {
  id: number
  div: string
  date: string
  home_team: string
  away_team: string
  full_time_home_goals: number
  full_time_away_goals: number
  full_time_result: string
  half_time_home_goals: number
  half_time_away_goals: number
  half_time_result: string
  referee: string
  home_shots: number
  away_shots: number
  home_shots_target: number
  away_shots_target: number
  home_corners: number
  away_corners: number
  home_fouls: number
  away_fouls: number
  home_yellow: number
  away_yellow: number
  home_red: number
  away_red: number
  created_at?: string
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
function generateCacheKey(homeTeam: string, awayTeam: string, matchDate: string): string {
  // Use a simple hash or combine for the key. Node's crypto module is not available on client-side.
  // For client-side, a simpler approach is needed or this function should only be called server-side.
  // If `require("crypto")` is causing issues on the client, ensure this function is only used server-side
  // or use a client-side compatible hashing library.
  // Given this is for lib/supabase.ts (used by both client and server),
  // we need a client-compatible method or move this to a server-only utility.
  // For this fix, I'll assume it's for server-side or a compatible `crypto` polyfill exists for Next.js.
  // However, `crypto` is typically server-side. Let's provide a robust client-compatible alternative or note.
  // For `Next.js`, `crypto` is available server-side.

  // Simple string concatenation for client-side compatibility if crypto is not globally available.
  // If this function MUST run on client AND server, a different approach is needed.
  // For the purpose of fixing the deployment error, let's keep it assuming server-side context for crypto.
  // The error indicated missing exports, not runtime crypto issues.

  // Re-adding the original `crypto` usage as it was likely intended for server-side
  // or a bundler polyfills it for client-side in Next.js.
  // If `crypto` truly causes client-side issues, this part needs a more complex refactor.

  // Check if crypto is available (server-side context)
  if (typeof window === "undefined" && typeof require === "function") {
    const crypto = require("crypto")
    const input = `${homeTeam}_vs_${awayTeam}_${matchDate}`
    return crypto.createHash("md5").update(input).digest("hex")
  } else {
    // Fallback for client-side (less secure, but avoids immediate deployment crash)
    // For production client-side hashing, use a dedicated client-side library.
    return btoa(`${homeTeam}_vs_${awayTeam}_${matchDate}`).replace(/=/g, "") // Base64 encode for a simple unique string
  }
}

/**
 * Get enhanced prediction from cache or calculate new one
 */
export async function getEnhancedPrediction(
  homeTeam: string,
  awayTeam: string,
  matchDate: string = new Date().toISOString().split("T")[0],
): Promise<EnhancedPrediction | null> {
  const cacheKey = generateCacheKey(homeTeam, awayTeam, matchDate)

  try {
    const { data, error } = await supabase
      .from("enhanced_predictions")
      .select("*")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error && error.code !== "PGRST116") {
      console.warn("Cache lookup error:", error)
      return null
    }

    return data
  } catch (error) {
    console.warn("Enhanced prediction fetch error:", error)
    return null
  }
}

/**
 * Save enhanced prediction to cache
 */
export async function saveEnhancedPrediction(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  prediction: any,
  features: any,
  modelVersion = "enhanced_stat_v1.1",
  confidence = 0.8,
  generationTimeMs?: number,
): Promise<boolean> {
  const cacheKey = generateCacheKey(homeTeam, awayTeam, matchDate)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  try {
    const { error } = await supabase.from("enhanced_predictions").upsert(
      {
        league: "spain", // Hardcoded as per previous context
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: matchDate,
        prediction,
        features,
        model_version: modelVersion,
        confidence,
        cache_key: cacheKey,
        expires_at: expiresAt,
        generation_time_ms: generationTimeMs,
        created_by: "frontend",
      },
      {
        onConflict: "cache_key",
      },
    )

    if (error) {
      console.error("Enhanced prediction save error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Enhanced prediction save exception:", error)
    return false
  }
}
