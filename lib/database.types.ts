// Minimal Supabase Database types for this project
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: {
          id: number
          home_team: string
          away_team: string
          match_time: string // ISO string
          full_time_home_goals: number | null
          full_time_away_goals: number | null
          league: string
          created_at?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: number
          home_team: string
          away_team: string
          match_time: string
          full_time_home_goals?: number | null
          full_time_away_goals?: number | null
          league: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["matches"]["Row"]>
      }
      predictions: {
        Row: {
          id: string
          match_id: number | null
          home_team: string
          away_team: string
          match_date: string
          league: string
          prediction_type: string
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
          comeback_probability_home: number | null
          comeback_probability_away: number | null
          resilience_factor_home: number | null
          resilience_factor_away: number | null
          mental_strength_home: number | null
          mental_strength_away: number | null
          legend_mode_features: Json | null
          actual_result: string | null
          prediction_correct: boolean | null
          probability_accuracy: number | null
          predicted_at: string
          expires_at: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: string
          match_id?: number | null
          home_team: string
          away_team: string
          match_date: string
          league: string
          prediction_type?: string
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
          comeback_probability_home?: number | null
          comeback_probability_away?: number | null
          resilience_factor_home?: number | null
          resilience_factor_away?: number | null
          mental_strength_home?: number | null
          mental_strength_away?: number | null
          legend_mode_features?: Json | null
          actual_result?: string | null
          prediction_correct?: boolean | null
          probability_accuracy?: number | null
          predicted_at?: string
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["predictions"]["Row"]>
      }
    }
  }
}
