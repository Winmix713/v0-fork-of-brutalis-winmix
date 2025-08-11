import type { Match } from "./supabase"

export interface StatisticsResult {
  totalMatches: number
  homeWins: number
  awayWins: number
  draws: number
  homeGoals: number
  awayGoals: number
  avgHomeGoals: number
  avgAwayGoals: number
  totalGoals: number
  avgTotalGoals: number
  bttsMatches: number
  cleanSheetsHome: number
  cleanSheetsAway: number
  failedToScoreHome: number
  failedToScoreAway: number
  // Team-specific stats
  teamStats?: {
    [teamName: string]: {
      totalMatches: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      avgGoalsFor: number
      avgGoalsAgainst: number
      cleanSheets: number
      failedToScore: number
    }
  }
  // Head-to-head stats
  h2hStats?: {
    team1: string
    team2: string
    totalMatches: number
    team1Wins: number
    team2Wins: number
    draws: number
    team1Goals: number
    team2Goals: number
    avgTeam1Goals: number
    avgTeam2Goals: number
  }
  // AI Prediction related stats (mocked for now)
  aiPredictionAccuracy?: {
    overallAccuracy: number
    homeWinAccuracy: number
    drawAccuracy: number
    awayWinAccuracy: number
  }
}

export function calculateStatistics(
  matches: Match[],
  homeTeamFilter?: string,
  awayTeamFilter?: string,
): StatisticsResult {
  let totalMatches = 0
  let homeWins = 0
  let awayWins = 0
  let draws = 0
  let homeGoals = 0
  let awayGoals = 0
  let bttsMatches = 0
  let cleanSheetsHome = 0
  let cleanSheetsAway = 0
  let failedToScoreHome = 0
  let failedToScoreAway = 0

  const teamStats: {
    [teamName: string]: {
      totalMatches: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      cleanSheets: number
      failedToScore: number
    }
  } = {}

  // Initialize team stats
  const allTeams = new Set<string>()
  matches.forEach((match) => {
    allTeams.add(match.home_team)
    allTeams.add(match.away_team)
  })
  Array.from(allTeams).forEach((teamName) => {
    teamStats[teamName] = {
      totalMatches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      failedToScore: 0,
    }
  })

  matches.forEach((match) => {
    totalMatches++
    homeGoals += match.full_time_home_goals
    awayGoals += match.full_time_away_goals

    // Overall match outcomes
    if (match.full_time_home_goals > match.full_time_away_goals) {
      homeWins++
    } else if (match.full_time_away_goals > match.full_time_home_goals) {
      awayWins++
    } else {
      draws++
    }

    // Both Teams To Score (BTTS)
    if (match.full_time_home_goals > 0 && match.full_time_away_goals > 0) {
      bttsMatches++
    }

    // Clean Sheets and Failed to Score
    if (match.full_time_away_goals === 0) {
      cleanSheetsHome++
    }
    if (match.full_time_home_goals === 0) {
      cleanSheetsAway++
    }
    if (match.full_time_home_goals === 0) {
      failedToScoreHome++
    }
    if (match.full_time_away_goals === 0) {
      failedToScoreAway++
    }

    // Team-specific stats
    // Home team
    teamStats[match.home_team].totalMatches++
    teamStats[match.home_team].goalsFor += match.full_time_home_goals
    teamStats[match.home_team].goalsAgainst += match.full_time_away_goals
    if (match.full_time_home_goals > match.full_time_away_goals) {
      teamStats[match.home_team].wins++
    } else if (match.full_time_home_goals < match.full_time_away_goals) {
      teamStats[match.home_team].losses++
    } else {
      teamStats[match.home_team].draws++
    }
    if (match.full_time_away_goals === 0) {
      teamStats[match.home_team].cleanSheets++
    }
    if (match.full_time_home_goals === 0) {
      teamStats[match.home_team].failedToScore++
    }

    // Away team
    teamStats[match.away_team].totalMatches++
    teamStats[match.away_team].goalsFor += match.full_time_away_goals
    teamStats[match.away_team].goalsAgainst += match.full_time_home_goals
    if (match.full_time_away_goals > match.full_time_home_goals) {
      teamStats[match.away_team].wins++
    } else if (match.full_time_away_goals < match.full_time_home_goals) {
      teamStats[match.away_team].losses++
    } else {
      teamStats[match.away_team].draws++
    }
    if (match.full_time_home_goals === 0) {
      teamStats[match.away_team].cleanSheets++
    }
    if (match.full_time_away_goals === 0) {
      teamStats[match.away_team].failedToScore++
    }
  })

  // Calculate averages for team stats
  for (const teamName in teamStats) {
    const stats = teamStats[teamName]
    stats.avgGoalsFor = stats.totalMatches > 0 ? stats.goalsFor / stats.totalMatches : 0
    stats.avgGoalsAgainst = stats.totalMatches > 0 ? stats.goalsAgainst / stats.totalMatches : 0
  }

  let h2hStats = undefined
  if (homeTeamFilter && awayTeamFilter) {
    const h2hMatches = matches.filter(
      (match) =>
        (match.home_team === homeTeamFilter && match.away_team === awayTeamFilter) ||
        (match.home_team === awayTeamFilter && match.away_team === homeTeamFilter),
    )

    let team1Wins = 0
    let team2Wins = 0
    let h2hDraws = 0
    let team1Goals = 0
    let team2Goals = 0

    h2hMatches.forEach((match) => {
      if (match.home_team === homeTeamFilter) {
        team1Goals += match.full_time_home_goals
        team2Goals += match.full_time_away_goals
        if (match.full_time_home_goals > match.full_time_away_goals) {
          team1Wins++
        } else if (match.full_time_home_goals < match.full_time_away_goals) {
          team2Wins++
        } else {
          h2hDraws++
        }
      } else {
        // awayTeamFilter is home team in this match
        team1Goals += match.full_time_away_goals
        team2Goals += match.full_time_home_goals
        if (match.full_time_away_goals > match.full_time_home_goals) {
          team1Wins++
        } else if (match.full_time_away_goals < match.full_time_home_goals) {
          team2Wins++
        } else {
          h2hDraws++
        }
      }
    })

    h2hStats = {
      team1: homeTeamFilter,
      team2: awayTeamFilter,
      totalMatches: h2hMatches.length,
      team1Wins: team1Wins,
      team2Wins: team2Wins,
      draws: h2hDraws,
      team1Goals: team1Goals,
      team2Goals: team2Goals,
      avgTeam1Goals: h2hMatches.length > 0 ? team1Goals / h2hMatches.length : 0,
      avgTeam2Goals: h2hMatches.length > 0 ? team2Goals / h2hMatches.length : 0,
    }
  }

  return {
    totalMatches,
    homeWins,
    awayWins,
    draws,
    homeGoals,
    awayGoals,
    avgHomeGoals: totalMatches > 0 ? homeGoals / totalMatches : 0,
    avgAwayGoals: totalMatches > 0 ? awayGoals / totalMatches : 0,
    totalGoals: homeGoals + awayGoals,
    avgTotalGoals: totalMatches > 0 ? (homeGoals + awayGoals) / totalMatches : 0,
    bttsMatches,
    cleanSheetsHome,
    cleanSheetsAway,
    failedToScoreHome,
    failedToScoreAway,
    teamStats,
    h2hStats,
    // Mock AI prediction accuracy for demonstration
    aiPredictionAccuracy: {
      overallAccuracy: 0.75,
      homeWinAccuracy: 0.78,
      drawAccuracy: 0.65,
      awayWinAccuracy: 0.72,
    },
  }
}
