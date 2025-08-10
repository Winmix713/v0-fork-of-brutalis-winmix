// Futball statisztikai számítások a PHP API logikája alapján
export interface Match {
  id: number
  match_time: string
  home_team: string
  away_team: string
  half_time_home_goals: number
  half_time_away_goals: number
  full_time_home_goals: number
  full_time_away_goals: number
  created_at: string
}

export interface TeamAnalysis {
  home_team: string
  away_team: string
  matches_count: number
  both_teams_scored_percentage: number
  average_goals: {
    average_total_goals: number
    average_home_goals: number
    average_away_goals: number
  }
  home_form_index: number
  away_form_index: number
  head_to_head_stats: {
    home_wins: number
    away_wins: number
    draws: number
    home_win_percentage: number
    away_win_percentage: number
    draw_percentage: number
  }
}

export interface Prediction {
  homeExpectedGoals: number
  awayExpectedGoals: number
  bothTeamsToScoreProb: number
  predictedWinner: "home" | "away" | "draw" | "unknown"
  confidence: number
  modelPredictions: {
    randomForest: string
    poisson: {
      homeGoals: number
      awayGoals: number
    }
    elo: {
      homeWinProb: number
      drawProb: number
      awayWinProb: number
    }
  }
}

export interface StatisticsResult {
  total_matches: number
  team_analysis: TeamAnalysis | null
  prediction: Prediction | null
  general_stats: {
    both_teams_scored_percentage: number
    average_goals: {
      average_total_goals: number
      average_home_goals: number
      average_away_goals: number
    }
  }
}

/**
 * Kiszámítja, hogy a mérkőzések hány százalékában szereztek mindkét csapatok gólt
 */
export function calculateBothTeamsScoredPercentage(matches: Match[]): number {
  if (matches.length === 0) return 0

  const bothTeamsScoredCount = matches.reduce((count, match) => {
    return count + (match.full_time_home_goals > 0 && match.full_time_away_goals > 0 ? 1 : 0)
  }, 0)

  return Math.round((bothTeamsScoredCount / matches.length) * 100 * 100) / 100
}

/**
 * Kiszámítja az átlagos gólstatisztikákat
 */
export function calculateAverageGoals(matches: Match[]) {
  if (matches.length === 0) {
    return {
      average_total_goals: 0,
      average_home_goals: 0,
      average_away_goals: 0,
    }
  }

  const goals = matches.reduce(
    (acc, match) => ({
      total: acc.total + match.full_time_home_goals + match.full_time_away_goals,
      home: acc.home + match.full_time_home_goals,
      away: acc.away + match.full_time_away_goals,
    }),
    { total: 0, home: 0, away: 0 },
  )

  return {
    average_total_goals: Math.round((goals.total / matches.length) * 100) / 100,
    average_home_goals: Math.round((goals.home / matches.length) * 100) / 100,
    average_away_goals: Math.round((goals.away / matches.length) * 100) / 100,
  }
}

/**
 * Kiszámítja a csapat forma indexét az utolsó meccsek alapján
 */
export function calculateFormIndex(matches: Match[], team: string, recentGames = 5): number {
  if (!team) return 0

  const teamMatches = matches.filter(
    (match) =>
      match.home_team.toLowerCase() === team.toLowerCase() || match.away_team.toLowerCase() === team.toLowerCase(),
  )

  if (teamMatches.length === 0) return 0

  const recentMatches = teamMatches.slice(0, Math.min(teamMatches.length, recentGames))
  const points = recentMatches.reduce((sum, match) => {
    const isHomeTeam = match.home_team.toLowerCase() === team.toLowerCase()
    const homeScore = match.full_time_home_goals
    const awayScore = match.full_time_away_goals

    if (isHomeTeam) {
      if (homeScore > awayScore) return sum + 3
      if (homeScore === awayScore) return sum + 1
    } else {
      if (awayScore > homeScore) return sum + 3
      if (homeScore === awayScore) return sum + 1
    }

    return sum
  }, 0)

  const maxPossiblePoints = recentMatches.length * 3
  return maxPossiblePoints > 0 ? Math.round((points / maxPossiblePoints) * 100 * 100) / 100 : 0
}

/**
 * Kiszámítja a head-to-head statisztikákat két csapat között
 */
export function calculateHeadToHeadStats(matches: Match[]) {
  if (matches.length === 0) {
    return {
      home_wins: 0,
      away_wins: 0,
      draws: 0,
      home_win_percentage: 0,
      away_win_percentage: 0,
      draw_percentage: 0,
    }
  }

  const stats = matches.reduce(
    (acc, match) => {
      const homeScore = match.full_time_home_goals
      const awayScore = match.full_time_away_goals

      if (homeScore > awayScore) {
        acc.home_wins++
      } else if (homeScore < awayScore) {
        acc.away_wins++
      } else {
        acc.draws++
      }
      return acc
    },
    { home_wins: 0, away_wins: 0, draws: 0 },
  )

  const totalMatches = matches.length

  return {
    home_wins: stats.home_wins,
    away_wins: stats.away_wins,
    draws: stats.draws,
    home_win_percentage: Math.round((stats.home_wins / totalMatches) * 100 * 100) / 100,
    away_win_percentage: Math.round((stats.away_wins / totalMatches) * 100 * 100) / 100,
    draw_percentage: Math.round((stats.draws / totalMatches) * 100 * 100) / 100,
  }
}

/**
 * Kiszámítja egy csapat várható gólszámát
 */
export function calculateExpectedGoals(team: string, matches: Match[]): number {
  if (!team || matches.length === 0) return 0

  const teamMatches = matches.filter(
    (match) =>
      match.home_team.toLowerCase() === team.toLowerCase() || match.away_team.toLowerCase() === team.toLowerCase(),
  )

  if (teamMatches.length === 0) return 0

  const totalGoals = teamMatches.reduce((sum, match) => {
    const isHomeTeam = match.home_team.toLowerCase() === team.toLowerCase()
    return sum + (isHomeTeam ? match.full_time_home_goals : match.full_time_away_goals)
  }, 0)

  return Math.round((totalGoals / teamMatches.length) * 100) / 100
}

/**
 * Kiszámítja annak valószínűségét, hogy mindkét csapat szerez gólt
 */
export function calculateBothTeamsToScoreProb(matches: Match[]): number {
  if (matches.length === 0) return 0

  const bothScoredCount = matches.filter(
    (match) => match.full_time_home_goals > 0 && match.full_time_away_goals > 0,
  ).length

  return Math.round((bothScoredCount / matches.length) * 100 * 100) / 100
}

/**
 * Előrejelzi a győztest a korábbi head-to-head meccsek alapján
 */
export function predictWinner(
  homeTeam: string,
  awayTeam: string,
  matches: Match[],
): { winner: "home" | "away" | "draw" | "unknown"; confidence: number } {
  if (!homeTeam || !awayTeam || matches.length === 0) {
    return { winner: "unknown", confidence: 0 }
  }

  const h2hMatches = matches.filter(
    (match) =>
      match.home_team.toLowerCase() === homeTeam.toLowerCase() &&
      match.away_team.toLowerCase() === awayTeam.toLowerCase(),
  )

  if (h2hMatches.length === 0) {
    return { winner: "unknown", confidence: 0 }
  }

  const stats = h2hMatches.reduce(
    (acc, match) => {
      const homeScore = match.full_time_home_goals
      const awayScore = match.full_time_away_goals

      if (homeScore > awayScore) {
        acc.home_wins++
      } else if (homeScore < awayScore) {
        acc.away_wins++
      } else {
        acc.draws++
      }
      return acc
    },
    { home_wins: 0, away_wins: 0, draws: 0 },
  )

  const totalMatches = h2hMatches.length

  if (stats.home_wins > stats.away_wins && stats.home_wins > stats.draws) {
    return { winner: "home", confidence: Math.round((stats.home_wins / totalMatches) * 100) / 100 }
  } else if (stats.away_wins > stats.home_wins && stats.away_wins > stats.draws) {
    return { winner: "away", confidence: Math.round((stats.away_wins / totalMatches) * 100) / 100 }
  } else {
    return { winner: "draw", confidence: Math.round((stats.draws / totalMatches) * 100) / 100 }
  }
}

/**
 * Kiszámítja a győzelmi valószínűségeket
 */
function calculateWinProbability(
  winnerPrediction: { winner: string; confidence: number },
  outcomeType: string,
): number {
  if (winnerPrediction.winner === "unknown") {
    return Math.round((1 / 3) * 100) / 100
  }

  if (winnerPrediction.winner === outcomeType) {
    return winnerPrediction.confidence
  }

  const remainingProb = 1 - winnerPrediction.confidence
  return Math.round((remainingProb / 2) * 100) / 100
}

/**
 * Futtatja a teljes predikciós elemzést
 */
export function runPrediction(homeTeam: string, awayTeam: string, matches: Match[]): Prediction {
  const homeExpectedGoals = calculateExpectedGoals(homeTeam, matches)
  const awayExpectedGoals = calculateExpectedGoals(awayTeam, matches)
  const bothTeamsToScoreProb = calculateBothTeamsToScoreProb(matches)
  const winnerPrediction = predictWinner(homeTeam, awayTeam, matches)

  return {
    homeExpectedGoals,
    awayExpectedGoals,
    bothTeamsToScoreProb,
    predictedWinner: winnerPrediction.winner,
    confidence: winnerPrediction.confidence,
    modelPredictions: {
      randomForest: winnerPrediction.winner === "unknown" ? "insufficient_data" : `${winnerPrediction.winner}_win`,
      poisson: {
        homeGoals: Math.round(homeExpectedGoals),
        awayGoals: Math.round(awayExpectedGoals),
      },
      elo: {
        homeWinProb: calculateWinProbability(winnerPrediction, "home"),
        drawProb: calculateWinProbability(winnerPrediction, "draw"),
        awayWinProb: calculateWinProbability(winnerPrediction, "away"),
      },
    },
  }
}

/**
 * Kiszámítja a csapat elemzést két csapat között
 */
export function calculateTeamAnalysis(homeTeam: string, awayTeam: string, allMatches: Match[]): TeamAnalysis | null {
  if (!homeTeam || !awayTeam) return null

  // Head-to-head meccsek keresése
  const teamAnalysisMatches = allMatches.filter(
    (match) =>
      (match.home_team.toLowerCase() === homeTeam.toLowerCase() &&
        match.away_team.toLowerCase() === awayTeam.toLowerCase()) ||
      (match.home_team.toLowerCase() === awayTeam.toLowerCase() &&
        match.away_team.toLowerCase() === homeTeam.toLowerCase()),
  )

  return {
    home_team: homeTeam,
    away_team: awayTeam,
    matches_count: teamAnalysisMatches.length,
    both_teams_scored_percentage: calculateBothTeamsScoredPercentage(teamAnalysisMatches),
    average_goals: calculateAverageGoals(teamAnalysisMatches),
    home_form_index: calculateFormIndex(allMatches, homeTeam),
    away_form_index: calculateFormIndex(allMatches, awayTeam),
    head_to_head_stats: calculateHeadToHeadStats(teamAnalysisMatches),
  }
}

/**
 * Kiszámítja a teljes statisztikai eredményt
 */
export function calculateStatistics(matches: Match[], homeTeam?: string, awayTeam?: string): StatisticsResult {
  const generalStats = {
    both_teams_scored_percentage: calculateBothTeamsScoredPercentage(matches),
    average_goals: calculateAverageGoals(matches),
  }

  let teamAnalysis: TeamAnalysis | null = null
  let prediction: Prediction | null = null

  if (homeTeam && awayTeam) {
    teamAnalysis = calculateTeamAnalysis(homeTeam, awayTeam, matches)
    prediction = runPrediction(homeTeam, awayTeam, matches)
  }

  return {
    total_matches: matches.length,
    team_analysis: teamAnalysis,
    prediction,
    general_stats: generalStats,
  }
}
