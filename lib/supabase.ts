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
  // This check prevents SUPABASE_SERVICE_ROLE_KEY from being exposed or used on the client
  if (typeof window === "undefined" && supabaseServiceRoleKey) {
    supabaseServiceRole = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        persistSession: false, // Service role client should not persist sessions
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
          home_team: string
          away_team: string
          full_time_home_goals: number
          full_time_away_goals: number
          half_time_home_goals: number | null
          half_time_away_goals: number | null
          league: string | null
          season: string | null
          home_shots: number | null
          away_shots: number | null
          home_shots_on_target: number | null
          away_shots_on_target: number | null
          home_corners: number | null
          away_corners: number | null
          home_yellow_cards: number | null
          away_yellow_cards: number | null
          home_red_cards: number | null
          away_red_cards: number | null
          referee: string | null
          venue: string | null
          attendance: number | null
          match_status: string
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
          half_time_home_goals?: number | null
          half_time_away_goals?: number | null
          league?: string | null
          season?: string | null
          home_shots?: number | null
          away_shots?: number | null
          home_shots_on_target?: number | null
          away_shots_on_target?: number | null
          home_corners?: number | null
          away_corners?: number | null
          home_yellow_cards?: number | null
          away_yellow_cards?: number | null
          home_red_cards?: number | null
          away_red_cards?: number | null
          referee?: string | null
          venue?: string | null
          attendance?: number | null
          match_status?: string
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
          half_time_home_goals?: number | null
          half_time_away_goals?: number | null
          league?: string | null
          season?: string | null
          home_shots?: number | null
          away_shots?: number | null
          home_shots_on_target?: number | null
          away_shots_on_target?: number | null
          home_corners?: number | null
          away_corners?: number | null
          home_yellow_cards?: number | null
          away_yellow_cards?: number | null
          home_red_cards?: number | null
          away_red_cards?: number | null
          referee?: string | null
          venue?: string | null
          attendance?: number | null
          match_status?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          match_id: number | null
          home_team: string
          away_team: string
          match_date: string // date string YYYY-MM-DD
          league: string
          prediction_type: "basic" | "legend_mode" | "ai_enhanced" | "ensemble" | "raw_features"
          home_win_probability: number
          draw_probability: number
          away_win_probability: number
          predicted_home_goals: number | null
          predicted_away_goals: number | null
          predicted_total_goals: number | null
          confidence_score: number | null
          model_version: string | null
          features_used: Json | null
          cache_key: string
          actual_result: string | null
          prediction_correct: boolean | null
          probability_accuracy: number | null
          predicted_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
          comeback_probability_home: number | null
          comeback_probability_away: number | null
          resilience_factor_home: number | null
          resilience_factor_away: number | null
          mental_strength_home: number | null
          mental_strength_away: number | null
          legend_mode_features: Json | null
        }
        Insert: {
          id?: string
          match_id?: number | null
          home_team: string
          away_team: string
          match_date: string
          league: string
          prediction_type?: "basic" | "legend_mode" | "ai_enhanced" | "ensemble" | "raw_features"
          home_win_probability: number
          draw_probability: number
          away_win_probability: number
          predicted_home_goals?: number | null
          predicted_away_goals?: number | null
          predicted_total_goals?: number | null
          confidence_score?: number | null
          model_version?: string | null
          features_used?: Json | null
          cache_key: string
          actual_result?: string | null
          prediction_correct?: boolean | null
          probability_accuracy?: number | null
          predicted_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          comeback_probability_home?: number | null
          comeback_probability_away?: number | null
          resilience_factor_home?: number | null
          resilience_factor_away?: number | null
          mental_strength_home?: number | null
          mental_strength_away?: number | null
          legend_mode_features?: Json | null
        }
        Update: {
          id?: string
          match_id?: number | null
          home_team?: string
          away_team?: string
          match_date?: string
          league?: string
          prediction_type?: "basic" | "legend_mode" | "ai_enhanced" | "ensemble" | "raw_features"
          home_win_probability?: number
          draw_probability?: number
          away_win_probability?: number
          predicted_home_goals?: number | null
          predicted_away_goals?: number | null
          predicted_total_goals?: number | null
          confidence_score?: number | null
          model_version?: string | null
          features_used?: Json | null
          cache_key?: string
          actual_result?: string | null
          prediction_correct?: boolean | null
          probability_accuracy?: number | null
          predicted_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          comeback_probability_home?: number | null
          comeback_probability_away?: number | null
          resilience_factor_home?: number | null
          resilience_factor_away?: number | null
          mental_strength_home?: number | null
          mental_strength_away?: number | null
          legend_mode_features?: Json | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          id: number
          event_type: string
          message: string
          created_at: string
          details: Json | null
        }
        Insert: {
          id?: number
          event_type: string
          message: string
          created_at?: string
          details?: Json | null
        }
        Update: {
          id?: number
          event_type?: string
          message?: string
          created_at?: string
          details?: Json | null
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
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      calculate_features_for_match: {
        Args: {
          p_match_id: number
          p_lookback_days: number
          p_h2h_matches_limit: number
        }
        Returns: Json
      }
      calculate_all_features_batch: {
        Args: {
          p_days_lookback: number
          p_form_lookback_days: number
          p_h2h_matches_limit: number
        }
        Returns: void
      }
      get_legend_mode_comeback_stats: {
        Args: {
          p_team_name: string
          p_lookback_days: number
        }
        Returns: Json
      }
      get_team_form_stats: {
        Args: {
          p_team_name: string
          p_league: string
          p_match_time: string
          p_lookback_days: number
        }
        Returns: {
          matches_played: number
          avg_goals_scored: number
          avg_goals_conceded: number
          wins: number
          draws: number
          losses: number
          avg_shots: number
          avg_shots_on_target: number
          avg_corners: number
          avg_yellow_cards: number
          avg_red_cards: number
        }[]
      }
      get_h2h_stats: {
        Args: {
          p_team1_name: string
          p_team2_name: string
          p_match_time: string
          p_h2h_matches_limit: number
        }
        Returns: {
          h2h_matches_played: number
          h2h_team1_wins: number
          h2h_team2_wins: number
          h2h_draws: number
          h2h_avg_total_goals: number
          h2h_avg_team1_goals: number
          h2h_avg_team2_goals: number
        }[]
      }
      get_comeback_stats: {
        Args: {
          p_team_name: string
          p_lookback_days: number
        }
        Returns: {
          total_matches_in_period: number
          total_comebacks: number
          total_blown_leads: number
          comeback_success_rate: number
          blown_lead_rate: number
          avg_comeback_goal_diff: number
          avg_blown_lead_goal_diff: number
          resilience_factor: number
          mental_strength_factor: number
        }[]
      }
      get_prediction_accuracy_stats: {
        Args: {
          model_type: string | null
          date_from: string | null
          date_to: string | null
        }
        Returns: {
          prediction_type: string
          total_predictions: number
          correct_predictions: number
          accuracy_percentage: number
          avg_confidence: number
          avg_probability_accuracy: number
        }[]
      }
      update_enhanced_predictions: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      refresh_match_analysis_materialized: {
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
export type SystemLog = Database["public"]["Tables"]["system_logs"]["Row"]

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
  id: string // Changed to string for UUID
  league: string
  home_team: string
  away_team: string
  match_date: string
  prediction: any // This should be more specific, e.g., { homeWin: number, draw: number, awayWin: number }
  features: any // This should be more specific, e.g., FeatureData
  model_version: string
  confidence: number
  cache_key: string
  generated_at: string
  expires_at?: string
  created_by?: string
  generation_time_ms?: number
  data_quality_score?: number
}

export interface PredictionData {
  id: string // Changed to string for UUID
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
  return `${league.toLowerCase()}:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}:${matchDate}`
}

/**
 * Get enhanced prediction from cache
 */
export async function getEnhancedPrediction(
  homeTeam: string,
  awayTeam: string,
  matchDate: string, // Removed league as it's part of cacheKey generation
): Promise<Prediction | null> {
  if (!supabase) {
    console.error("Supabase client not initialized for getEnhancedPrediction.")
    return null
  }

  // Assuming league is available or can be derived for cache key
  // For simplicity, let's assume a default or pass it if needed
  const defaultLeague = "La Liga" // Or pass it as a parameter if available
  const key = generateCacheKey(homeTeam, awayTeam, defaultLeague, matchDate) // Use a default or actual league

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
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  predictionResponse: any, // The full response object from the API
  features: any, // The extracted features
  modelVersion: string,
  confidence: number,
  generationTimeMs: number,
): Promise<Prediction | null> {
  if (!supabaseServiceRole) {
    // Use service role for writing to predictions table
    console.error("Supabase service role client not initialized for saveEnhancedPrediction.")
    return null
  }

  const defaultLeague = "La Liga" // Or pass it as a parameter if available
  const cacheKey = generateCacheKey(homeTeam, awayTeam, defaultLeague, matchDate)

  const predictionData: Database["public"]["Tables"]["predictions"]["Insert"] = {
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: matchDate,
    league: defaultLeague, // Use default or actual league
    prediction_type: "ensemble", // Assuming this is for ensemble predictions
    home_win_probability: predictionResponse.predictions.ensemble.home,
    draw_probability: predictionResponse.predictions.ensemble.draw,
    away_win_probability: predictionResponse.predictions.ensemble.away,
    predicted_home_goals: predictionResponse.predictions.ensemble.expected_goals.home,
    predicted_away_goals: predictionResponse.predictions.ensemble.expected_goals.away,
    predicted_total_goals:
      predictionResponse.predictions.ensemble.expected_goals.home +
      predictionResponse.predictions.ensemble.expected_goals.away,
    confidence_score: confidence,
    model_version: modelVersion,
    features_used: features,
    cache_key: cacheKey,
    predicted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 24 hours
    // Add other fields as necessary from your Prediction type
  }

  const { data, error } = await supabaseServiceRole
    .from("predictions")
    .upsert(predictionData, { onConflict: "cache_key" })
    .select()
    .single()

  if (error) {
    console.error("Error saving enhanced prediction to cache:", error)
    return null
  }

  return data
}
