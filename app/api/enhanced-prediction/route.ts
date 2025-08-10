import { type NextRequest, NextResponse } from "next/server"
import { getEnhancedPrediction, saveEnhancedPrediction } from "@/lib/supabase"
import { getRealMatchesData } from "@/lib/real-matches-data"

interface PredictionRequest {
  homeTeam: string
  awayTeam: string
  matchDate?: string
  league?: string // Added league parameter
}

interface FeatureData {
  home_total_matches: number
  home_avg_goals_scored: number
  home_avg_goals_conceded: number
  home_btts_ratio: number
  home_over_2_5_ratio: number
  home_overall_form: number
  home_comeback_win_ratio: number
  home_comeback_count: number
  away_total_matches: number
  away_avg_goals_scored: number
  away_avg_goals_conceded: number
  away_btts_ratio: number
  away_over_2_5_ratio: number
  away_overall_form: number
  away_comeback_win_ratio: number
  away_comeback_count: number
  h2h_stats: {
    total_matches: number
    home_wins: number
    away_wins: number
    draws: number
    avg_goals: number
    comeback_count: number
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const homeTeam = searchParams.get("home_team")
  const awayTeam = searchParams.get("away_team")
  const matchDate = searchParams.get("match_date") || new Date().toISOString().split("T")[0]
  const league = searchParams.get("league") || "La Liga" // Default league

  if (!homeTeam || !awayTeam) {
    return NextResponse.json(
      {
        error: "home_team és away_team paraméterek szükségesek",
        code: "MISSING_PARAMETERS",
      },
      { status: 400 },
    )
  }

  const startTime = performance.now()

  try {
    // Check cache first
    // Pass matchDate directly, league is handled within getEnhancedPrediction's cacheKey generation
    const cachedPrediction = await getEnhancedPrediction(homeTeam, awayTeam, matchDate)

    if (cachedPrediction) {
      return NextResponse.json({
        ...cachedPrediction.prediction,
        meta: {
          ...cachedPrediction.prediction.meta,
          cache_hit: true,
          generated_at: cachedPrediction.predicted_at, // Use predicted_at from DB
        },
      })
    }

    // Generate fresh prediction
    const features = await extractEnhancedFeatures(homeTeam, awayTeam)
    const predictions = await calculateAllPredictions(features)
    const confidence = calculateConfidence(features, predictions)

    const endTime = performance.now()
    const generationTime = Math.round(endTime - startTime)

    const response = {
      model_version: "enhanced_stat_v1.1",
      features: {
        home: {
          form_index: {
            value: Math.round(features.home_overall_form * 100),
            window: Math.min(features.home_total_matches, 10),
          },
          comeback_win_ratio: {
            percent: Math.round(features.home_comeback_win_ratio * 1000) / 1000,
            count: features.home_comeback_count,
            total: features.home_total_matches,
          },
          avg_goals: Math.round(features.home_avg_goals_scored * 100) / 100,
          btts_rate: Math.round(features.home_btts_ratio * 1000) / 1000,
          over_25_rate: Math.round(features.home_over_2_5_ratio * 1000) / 1000,
        },
        away: {
          form_index: {
            value: Math.round(features.away_overall_form * 100),
            window: Math.min(features.away_total_matches, 10),
          },
          comeback_win_ratio: {
            percent: Math.round(features.away_comeback_win_ratio * 1000) / 1000,
            count: features.away_comeback_count,
            total: features.away_total_matches,
          },
          avg_goals: Math.round(features.away_avg_goals_scored * 100) / 100,
          btts_rate: Math.round(features.away_btts_ratio * 1000) / 1000,
          over_25_rate: Math.round(features.away_over_2_5_ratio * 1000) / 1000,
        },
        h2h_summary: {
          matches: features.h2h_stats.total_matches,
          home_wins: features.h2h_stats.home_wins,
          away_wins: features.h2h_stats.away_wins,
          draws: features.h2h_stats.draws,
          comeback_count: features.h2h_stats.comeback_count,
          avg_goals: Math.round(features.h2h_stats.avg_goals * 100) / 100,
        },
      },
      predictions: {
        form: {
          home: Math.round(predictions.form.homeWin * 1000) / 1000,
          draw: Math.round(predictions.form.draw * 1000) / 1000,
          away: Math.round(predictions.form.awayWin * 1000) / 1000,
          btts: Math.round(predictions.form.btts * 1000) / 1000,
          over_25: Math.round(predictions.form.over25 * 1000) / 1000,
          expected_goals: {
            home: Math.round(predictions.form.expectedGoalsHome * 100) / 100,
            away: Math.round(predictions.form.expectedGoalsAway * 100) / 100,
          },
        },
        h2h: {
          home: Math.round(predictions.h2h.homeWin * 1000) / 1000,
          draw: Math.round(predictions.h2h.draw * 1000) / 1000,
          away: Math.round(predictions.h2h.awayWin * 1000) / 1000,
          btts: Math.round(predictions.h2h.btts * 1000) / 1000,
          over_25: Math.round(predictions.h2h.over25 * 1000) / 1000,
          expected_goals: {
            home: Math.round(predictions.h2h.expectedGoalsHome * 100) / 100,
            away: Math.round(predictions.h2h.expectedGoalsAway * 100) / 100,
          },
        },
        ensemble: {
          home: Math.round(predictions.ensemble.homeWin * 1000) / 1000,
          draw: Math.round(predictions.ensemble.draw * 1000) / 1000,
          away: Math.round(predictions.ensemble.awayWin * 1000) / 1000,
          btts: Math.round(predictions.ensemble.btts * 1000) / 1000,
          over_25: Math.round(predictions.ensemble.over25 * 1000) / 1000,
          expected_goals: {
            home: Math.round(predictions.ensemble.expectedGoalsHome * 100) / 100,
            away: Math.round(predictions.ensemble.expectedGoalsAway * 100) / 100,
          },
        },
      },
      confidence: Math.round(confidence * 1000) / 1000,
      meta: {
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: matchDate,
        generated_at: new Date().toISOString(),
        cache_hit: false,
        generation_time_ms: generationTime,
        data_quality: {
          home_matches: features.home_total_matches,
          away_matches: features.away_total_matches,
          h2h_matches: features.h2h_stats.total_matches,
        },
      },
    }

    // Save to cache
    await saveEnhancedPrediction(
      homeTeam,
      awayTeam,
      matchDate,
      response, // Pass the full response object
      features,
      "enhanced_stat_v1.1",
      confidence,
      generationTime,
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("Enhanced prediction error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ismeretlen hiba",
        code: "ENHANCED_PREDICTION_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

async function extractEnhancedFeatures(homeTeam: string, awayTeam: string): Promise<FeatureData> {
  // Get match data
  const homeMatches = await getRealMatchesData(homeTeam, undefined, 50)
  const awayMatches = await getRealMatchesData(awayTeam, undefined, 50)
  const h2hMatches = await getRealMatchesData(homeTeam, awayTeam, 20)

  // Calculate home team features
  const homeFeatures = calculateTeamFeatures(homeMatches, homeTeam)
  const awayFeatures = calculateTeamFeatures(awayMatches, awayTeam)
  const h2hFeatures = calculateH2HFeatures(h2hMatches, homeTeam, awayTeam)

  return {
    home_total_matches: homeMatches.length,
    home_avg_goals_scored: homeFeatures.avgGoalsScored,
    home_avg_goals_conceded: homeFeatures.avgGoalsConceded,
    home_btts_ratio: homeFeatures.bttsRate,
    home_over_2_5_ratio: homeFeatures.over25Rate,
    home_overall_form: homeFeatures.formIndex,
    home_comeback_win_ratio: homeFeatures.comebackWinRatio,
    home_comeback_count: homeFeatures.comebackCount,
    away_total_matches: awayMatches.length,
    away_avg_goals_scored: awayFeatures.avgGoalsScored,
    away_avg_goals_conceded: awayFeatures.avgGoalsConceded,
    away_btts_ratio: awayFeatures.bttsRate,
    away_over_2_5_ratio: awayFeatures.over25Rate,
    away_overall_form: awayFeatures.formIndex,
    away_comeback_win_ratio: awayFeatures.comebackWinRatio,
    away_comeback_count: awayFeatures.comebackCount,
    h2h_stats: h2hFeatures,
  }
}

function calculateTeamFeatures(matches: any[], teamName: string) {
  if (matches.length === 0) {
    return {
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.0,
      bttsRate: 0.5,
      over25Rate: 0.5,
      formIndex: 0.5,
      comebackWinRatio: 0.1,
      comebackCount: 0,
    }
  }

  let goalsScored = 0,
    goalsConceded = 0,
    bttsCount = 0,
    over25Count = 0,
    points = 0
  let comebackWins = 0

  matches.forEach((match) => {
    const isHome = match.home_team.toLowerCase().includes(teamName.toLowerCase())
    const teamGoals = isHome ? match.full_time_home_goals : match.full_time_away_goals
    const opponentGoals = isHome ? match.full_time_away_goals : match.full_time_home_goals
    const teamHalfGoals = isHome ? match.half_time_home_goals : match.half_time_away_goals
    const opponentHalfGoals = isHome ? match.half_time_away_goals : match.half_time_home_goals

    goalsScored += teamGoals
    goalsConceded += opponentGoals

    if (match.full_time_home_goals > 0 && match.full_time_away_goals > 0) bttsCount++
    if (match.full_time_home_goals + match.full_time_away_goals > 2.5) over25Count++

    // Check for comeback wins
    if (teamGoals > opponentGoals && teamHalfGoals <= opponentHalfGoals) {
      comebackWins++
    }

    if (teamGoals > opponentGoals) points += 3
    else if (teamGoals === opponentGoals) points += 1
  })

  return {
    avgGoalsScored: goalsScored / matches.length,
    avgGoalsConceded: goalsConceded / matches.length,
    bttsRate: bttsCount / matches.length,
    over25Rate: over25Count / matches.length,
    formIndex: points / (matches.length * 3),
    comebackWinRatio: comebackWins / matches.length,
    comebackCount: comebackWins,
  }
}

function calculateH2HFeatures(matches: any[], homeTeam: string, awayTeam: string) {
  if (matches.length === 0) {
    return {
      total_matches: 0,
      home_wins: 0,
      away_wins: 0,
      draws: 0,
      avg_goals: 0,
      comeback_count: 0,
    }
  }

  let homeWins = 0,
    awayWins = 0,
    draws = 0,
    totalGoals = 0,
    comebackCount = 0

  matches.forEach((match) => {
    const isHomeTeamHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase())
    const homeGoals = match.full_time_home_goals
    const awayGoals = match.full_time_away_goals
    const halfHomeGoals = match.half_time_home_goals
    const halfAwayGoals = match.half_time_away_goals

    totalGoals += homeGoals + awayGoals

    // Check for comebacks
    if (
      (homeGoals > awayGoals && halfHomeGoals <= halfAwayGoals) ||
      (awayGoals > homeGoals && halfAwayGoals <= halfHomeGoals)
    ) {
      comebackCount++
    }

    if (homeGoals > awayGoals) {
      if (isHomeTeamHome) homeWins++
      else awayWins++
    } else if (homeGoals < awayGoals) {
      if (isHomeTeamHome) awayWins++
      else homeWins++
    } else {
      draws++
    }
  })

  return {
    total_matches: matches.length,
    home_wins: homeWins,
    away_wins: awayWins,
    draws: draws,
    avg_goals: totalGoals / matches.length,
    comeback_count: comebackCount,
  }
}

async function calculateAllPredictions(features: FeatureData) {
  // Form-based prediction
  const formPred = calculateFormPrediction(features)

  // H2H-based prediction
  const h2hPred = calculateH2HPrediction(features)

  // Ensemble prediction (default 60% form, 40% h2h)
  const ensemblePred = blendPredictions(formPred, h2hPred, 0.6)

  return {
    form: formPred,
    h2h: h2hPred,
    ensemble: ensemblePred,
  }
}

function calculateFormPrediction(features: FeatureData) {
  const homeExpected = Math.max(0.1, features.home_avg_goals_scored * 1.1)
  const awayExpected = Math.max(0.1, features.away_avg_goals_scored * 0.9)

  const totalExpected = homeExpected + awayExpected
  let homeWin = homeExpected / totalExpected
  let awayWin = awayExpected / totalExpected
  let draw = Math.max(0.15, 1 - (homeWin + awayWin))

  // Normalize
  const total = homeWin + draw + awayWin
  homeWin /= total
  draw /= total
  awayWin /= total

  return {
    homeWin,
    draw,
    awayWin,
    btts: (features.home_btts_ratio + features.away_btts_ratio) / 2,
    over25: (features.home_over_2_5_ratio + features.away_over_2_5_ratio) / 2,
    expectedGoalsHome: homeExpected,
    expectedGoalsAway: awayExpected,
  }
}

function calculateH2HPrediction(features: FeatureData) {
  if (features.h2h_stats.total_matches === 0) {
    return {
      homeWin: 0.33,
      draw: 0.34,
      awayWin: 0.33,
      btts: 0.5,
      over25: 0.5,
      expectedGoalsHome: 1.0,
      expectedGoalsAway: 1.0,
    }
  }

  const total = features.h2h_stats.total_matches
  const avgGoals = features.h2h_stats.avg_goals

  return {
    homeWin: features.h2h_stats.home_wins / total,
    draw: features.h2h_stats.draws / total,
    awayWin: features.h2h_stats.away_wins / total,
    btts: Math.min(0.8, avgGoals / 3), // Estimate BTTS from avg goals
    over25: Math.min(0.9, avgGoals / 2.5), // Estimate over 2.5 from avg goals
    expectedGoalsHome: avgGoals / 2,
    expectedGoalsAway: avgGoals / 2,
  }
}

function blendPredictions(form: any, h2h: any, weight: number) {
  return {
    homeWin: weight * form.homeWin + (1 - weight) * h2h.homeWin,
    draw: weight * form.draw + (1 - weight) * h2h.draw,
    awayWin: weight * form.awayWin + (1 - weight) * h2h.awayWin,
    btts: weight * form.btts + (1 - weight) * h2h.btts,
    over25: weight * form.over25 + (1 - weight) * h2h.over25,
    expectedGoalsHome: weight * form.expectedGoalsHome + (1 - weight) * h2h.expectedGoalsHome,
    expectedGoalsAway: weight * form.expectedGoalsAway + (1 - weight) * h2h.expectedGoalsAway,
  }
}

function calculateConfidence(features: FeatureData, predictions: any): number {
  const baseConfidence = 0.5

  // Data quality boost
  const totalMatches = features.home_total_matches + features.away_total_matches
  const dataQuality = Math.min(1.0, totalMatches / 40)
  const h2hBonus = Math.min(0.2, features.h2h_stats.total_matches / 10)

  // Model agreement boost
  const homeAgreement = 1 - Math.abs(predictions.form.homeWin - predictions.h2h.homeWin)

  const confidence = baseConfidence + dataQuality * 0.3 + h2hBonus + homeAgreement * 0.2

  return Math.min(0.95, Math.max(0.1, confidence))
}
