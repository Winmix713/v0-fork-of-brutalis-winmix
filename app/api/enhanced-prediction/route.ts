import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase"
import { utcToZonedTime } from "date-fns-tz"
import { v4 as uuidv4 } from "uuid"

// Define the structure for the expected request body
interface PredictionRequest {
  homeTeam: string
  awayTeam: string
  matchDate: string // YYYY-MM-DD
  league?: string
  // Add other parameters needed for prediction if any
}

// Mock AI prediction function - In a real app, this would call an external ML model
async function mockAIPredict(homeTeam: string, awayTeam: string, matchDate: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Basic deterministic prediction for demonstration
  const seed = homeTeam.length + awayTeam.length + new Date(matchDate).getDate()
  const homeWinProb = (0.4 + (seed % 3) * 0.05 + Math.random() * 0.1).toFixed(4)
  const drawProb = (0.2 + (seed % 2) * 0.03 + Math.random() * 0.05).toFixed(4)
  const awayWinProb = (1.0 - Number.parseFloat(homeWinProb) - Number.parseFloat(drawProb)).toFixed(4)

  return {
    home_win_probability: Number.parseFloat(homeWinProb),
    draw_probability: Number.parseFloat(drawProb),
    away_win_probability: Number.parseFloat(awayWinProb),
    predicted_home_goals: Math.floor(seed / 5) + 1,
    predicted_away_goals: Math.floor(seed / 7) + 1,
    confidence_score: (0.7 + (seed % 4) * 0.05 + Math.random() * 0.1).toFixed(4),
    model_version: "v1.2-mock",
    features_used: {
      team_form: "mock_data",
      h2h_stats: "mock_data",
      elo_ratings: "mock_data",
    },
    comeback_probability_home: (0.1 + (seed % 5) * 0.02 + Math.random() * 0.03).toFixed(4),
    comeback_probability_away: (0.08 + (seed % 6) * 0.02 + Math.random() * 0.03).toFixed(4),
    resilience_factor_home: (0.6 + (seed % 7) * 0.01 + Math.random() * 0.02).toFixed(4),
    resilience_factor_away: (0.55 + (seed % 8) * 0.01 + Math.random() * 0.02).toFixed(4),
    mental_strength_home: (0.7 + (seed % 9) * 0.01 + Math.random() * 0.02).toFixed(4),
    mental_strength_away: (0.68 + (seed % 10) * 0.01 + Math.random() * 0.02).toFixed(4),
    predicted_total_goals: Math.floor(seed / 5) + Math.floor(seed / 7) + 2, // Simple sum of predicted goals
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const homeTeam = searchParams.get("home_team")
    const awayTeam = searchParams.get("away_team")
    const matchDateStr = searchParams.get("match_date") // YYYY-MM-DD format

    if (!homeTeam || !awayTeam || !matchDateStr) {
      return NextResponse.json(
        { error: "Missing required parameters: home_team, away_team, and match_date" },
        { status: 400 },
      )
    }

    // Validate matchDate format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDateStr)) {
      return NextResponse.json({ error: "Invalid match_date format. Expected YYYY-MM-DD" }, { status: 400 })
    }

    const supabaseServiceRole = getSupabaseServiceRoleClient()

    const today = utcToZonedTime(new Date(), "Europe/Budapest")
    const matchDate = utcToZonedTime(new Date(matchDateStr), "Europe/Budapest")

    // Define the cache key for this specific prediction
    const cacheKey = `${homeTeam}-${awayTeam}-${matchDateStr}`.toLowerCase()

    // 1. Try to fetch from cache first
    const { data: cachedPrediction, error: cacheError } = await supabaseServiceRole
      .from("predictions")
      .select("*")
      .eq("cache_key", cacheKey)
      .single()

    if (cachedPrediction) {
      // Check if cached prediction is still valid (e.g., not expired)
      if (cachedPrediction.expires_at && new Date(cachedPrediction.expires_at) > today) {
        console.log(`✅ Cache hit for ${cacheKey}`)
        return NextResponse.json(cachedPrediction)
      } else {
        console.log(`⏳ Cache expired for ${cacheKey}. Re-generating...`)
      }
    } else if (cacheError && cacheError.code !== "PGRST116") {
      // PGRST116 is "No rows found", which is expected for a cache miss. Log other errors.
      console.error("❌ Supabase cache query error:", cacheError)
    }

    // 2. If no cache hit or cache expired, generate a new prediction
    console.log(`🔄 Generating new prediction for ${homeTeam} vs ${awayTeam} on ${matchDateStr}`)
    const newPredictionData = await mockAIPredict(homeTeam, awayTeam, matchDateStr)

    // Calculate expiration: e.g., 24 hours from now
    const expiresAt = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

    const predictionToSave = {
      id: uuidv4(), // Generate a UUID for the prediction
      home_team: homeTeam,
      away_team: awayTeam,
      match_date: matchDateStr, // Store as YYYY-MM-DD string
      league: searchParams.get("league") || "La Liga (Mock)", // Default mock league
      prediction_type: "ai_enhanced",
      ...newPredictionData,
      cache_key: cacheKey,
      predicted_at: today.toISOString(), // Store as ISO string
      expires_at: expiresAt, // Store as ISO string
      // Additional fields based on predictions table schema
      actual_result: null, // To be filled after match
      prediction_correct: null, // To be filled after match
      probability_accuracy: null, // To be filled after match
      // Legend Mode specific fields
      comeback_probability_home: Number.parseFloat(Math.random().toFixed(4)),
      comeback_probability_away: Number.parseFloat(Math.random().toFixed(4)),
      resilience_factor_home: Number.parseFloat(Math.random().toFixed(4)),
      resilience_factor_away: Number.parseFloat(Math.random().toFixed(4)),
      mental_strength_home: Number.parseFloat(Math.random().toFixed(4)),
      mental_strength_away: Number.parseFloat(Math.random().toFixed(4)),
      legend_mode_features: {
        recent_form_h2h: Math.random() > 0.5 ? "good" : "bad",
        player_injuries: Math.random() > 0.8 ? ["Player A"] : [],
      },
    }

    // Try to find the corresponding match_id from the matches table
    const { data: matchData, error: matchError } = await supabaseServiceRole
      .from("matches")
      .select("id")
      .eq("home_team", homeTeam)
      .eq("away_team", awayTeam)
      .like("match_time", `${matchDateStr}%`) // Check for any match on that date
      .limit(1)
      .single()

    if (matchData) {
      predictionToSave.match_id = matchData.id
    } else if (matchError && matchError.code !== "PGRST116") {
      console.warn(`⚠️ Could not find match_id for ${homeTeam} vs ${awayTeam} on ${matchDateStr}: ${matchError.message}`)
    }

    // 3. Save the new prediction to the database (upsert to handle cache key conflicts)
    const { data, error: saveError } = await supabaseServiceRole
      .from("predictions")
      .upsert(predictionToSave, { onConflict: "cache_key" }) // Use cache_key for conflict resolution
      .select()
      .single()

    if (saveError) {
      console.error("❌ Error saving new prediction:", saveError)
      return NextResponse.json({ error: "Failed to save prediction", details: saveError.message }, { status: 500 })
    }

    console.log(`🎉 Successfully generated and saved prediction for ${cacheKey}`)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("🔥 API unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
