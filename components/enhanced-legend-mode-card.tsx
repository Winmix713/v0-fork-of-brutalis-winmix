"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Clock, Shield, Flame, Crown, Star, Award, Sparkles, TrendingUp } from "lucide-react"
import { getRealMatchesData, getHeadToHeadMatches } from "@/lib/real-matches-data"
import type { Match } from "@/lib/supabase"

interface LegendModeData {
  home: {
    basic_stats: {
      total_matches: number
      form_index: number
    }
    comeback_breakdown: {
      comeback_wins: number
      comeback_draws: number
      total_comebacks: number
      comeback_frequency: number
      comeback_success_rate: number
    }
    comeback_by_deficit: {
      from_1goal: number
      from_2goal: number
      from_3plus_goal: number
      max_deficit_overcome: number
    }
    blown_leads: {
      blown_lead_losses: number
      blown_lead_draws: number
      blown_lead_frequency: number
    }
    mental_strength: {
      avg_comeback_margin: number
      resilience_score: number
    }
  }
  away: {
    basic_stats: {
      total_matches: number
      form_index: number
    }
    comeback_breakdown: {
      comeback_wins: number
      comeback_draws: number
      total_comebacks: number
      comeback_frequency: number
      comeback_success_rate: number
    }
    comeback_by_deficit: {
      from_1goal: number
      from_2goal: number
      from_3plus_goal: number
      max_deficit_overcome: number
    }
    blown_leads: {
      blown_lead_losses: number
      blown_lead_draws: number
      blown_lead_frequency: number
    }
    mental_strength: {
      avg_comeback_margin: number
      resilience_score: number
    }
  }
  h2h_comeback_analysis: {
    total_matches: number
    home_team_comebacks: number
    away_team_comebacks: number
    comeback_advantage: number
    avg_intensity: number
  }
  legend_mode_insights: {
    comeback_kings: string
    mental_toughness_winner: string
    prediction_weight: {
      comeback_factor_importance: number
      mental_strength_bonus: number
      h2h_comeback_history: number
    }
    legend_score: {
      home: number
      away: number
    }
  }
  meta: {
    generated_at: string
    model_version: string
    league: string
    home_team: string
    away_team: string
    analysis_depth: string
    execution_time_ms: number
    data_source: string
  }
}

interface EnhancedLegendModeCardProps {
  homeTeam: string
  awayTeam: string
}

export default function EnhancedLegendModeCard({ homeTeam, awayTeam }: EnhancedLegendModeCardProps) {
  const [legendData, setLegendData] = useState<LegendModeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (homeTeam && awayTeam) {
      calculateRealLegendMode()
    }
  }, [homeTeam, awayTeam])

  const calculateRealLegendMode = async () => {
    setLoading(true)
    setError(null)

    try {
      const startTime = performance.now()

      // Valós adatok lekérdezése
      const homeMatches = await getRealMatchesData(homeTeam, undefined, 50)
      const awayMatches = await getRealMatchesData(awayTeam, undefined, 50)
      const h2hMatches = await getHeadToHeadMatches(homeTeam, awayTeam)

      if (homeMatches.length === 0 || awayMatches.length === 0) {
        throw new Error("Nincs elegendő adat a LEGEND MODE elemzéshez")
      }

      // LEGEND MODE számítások
      const homeAnalysis = calculateTeamLegendStats(homeMatches, homeTeam)
      const awayAnalysis = calculateTeamLegendStats(awayMatches, awayTeam)
      const h2hAnalysis = calculateH2HLegendStats(h2hMatches, homeTeam, awayTeam)

      const executionTime = performance.now() - startTime

      const legendResult: LegendModeData = {
        home: homeAnalysis,
        away: awayAnalysis,
        h2h_comeback_analysis: h2hAnalysis,
        legend_mode_insights: calculateLegendInsights(homeAnalysis, awayAnalysis, homeTeam, awayTeam),
        meta: {
          generated_at: new Date().toISOString(),
          model_version: "legend_real_data_v1",
          league: "spain",
          home_team: homeTeam,
          away_team: awayTeam,
          analysis_depth: "real_data_comeback_analysis",
          execution_time_ms: Math.round(executionTime),
          data_source: "supabase_real_matches",
        },
      }

      setLegendData(legendResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba")
    } finally {
      setLoading(false)
    }
  }

  const calculateTeamLegendStats = (matches: Match[], teamName: string) => {
    let comebackWins = 0
    let comebackDraws = 0
    let blownLeadLosses = 0
    let blownLeadDraws = 0
    let from1goal = 0
    let from2goal = 0
    let from3plusGoal = 0
    let maxDeficitOvercome = 0
    let totalComebackMargin = 0
    let points = 0

    matches.forEach((match) => {
      const isHome = match.home_team.toLowerCase().includes(teamName.toLowerCase())
      const htTeamGoals = isHome ? match.half_time_home_goals : match.half_time_away_goals
      const htOpponentGoals = isHome ? match.half_time_away_goals : match.half_time_home_goals
      const ftTeamGoals = isHome ? match.full_time_home_goals : match.full_time_away_goals
      const ftOpponentGoals = isHome ? match.full_time_away_goals : match.full_time_home_goals

      // Forma index számítás
      if (ftTeamGoals > ftOpponentGoals) points += 3
      else if (ftTeamGoals === ftOpponentGoals) points += 1

      // Comeback elemzés
      if (htTeamGoals < htOpponentGoals) {
        const deficit = htOpponentGoals - htTeamGoals

        if (ftTeamGoals > ftOpponentGoals) {
          comebackWins++
          totalComebackMargin += ftTeamGoals - ftOpponentGoals

          if (deficit === 1) from1goal++
          else if (deficit === 2) from2goal++
          else if (deficit >= 3) from3plusGoal++

          maxDeficitOvercome = Math.max(maxDeficitOvercome, deficit)
        } else if (ftTeamGoals === ftOpponentGoals) {
          comebackDraws++
        }
      }

      // Blown leads elemzés
      if (htTeamGoals > htOpponentGoals) {
        if (ftTeamGoals < ftOpponentGoals) {
          blownLeadLosses++
        } else if (ftTeamGoals === ftOpponentGoals) {
          blownLeadDraws++
        }
      }
    })

    const totalComebacks = comebackWins + comebackDraws
    const comebackFrequency = matches.length > 0 ? totalComebacks / matches.length : 0
    const comebackSuccessRate = totalComebacks > 0 ? comebackWins / totalComebacks : 0
    const blownLeadFrequency = matches.length > 0 ? (blownLeadLosses + blownLeadDraws) / matches.length : 0
    const formIndex = matches.length > 0 ? points / (matches.length * 3) : 0
    const avgComebackMargin = comebackWins > 0 ? totalComebackMargin / comebackWins : 0
    const resilienceScore = Math.max(0, comebackFrequency * 0.6 + comebackSuccessRate * 0.4 - blownLeadFrequency * 0.2)

    return {
      basic_stats: {
        total_matches: matches.length,
        form_index: formIndex,
      },
      comeback_breakdown: {
        comeback_wins: comebackWins,
        comeback_draws: comebackDraws,
        total_comebacks: totalComebacks,
        comeback_frequency: comebackFrequency,
        comeback_success_rate: comebackSuccessRate,
      },
      comeback_by_deficit: {
        from_1goal: from1goal,
        from_2goal: from2goal,
        from_3plus_goal: from3plusGoal,
        max_deficit_overcome: maxDeficitOvercome,
      },
      blown_leads: {
        blown_lead_losses: blownLeadLosses,
        blown_lead_draws: blownLeadDraws,
        blown_lead_frequency: blownLeadFrequency,
      },
      mental_strength: {
        avg_comeback_margin: avgComebackMargin,
        resilience_score: resilienceScore,
      },
    }
  }

  const calculateH2HLegendStats = (matches: Match[], homeTeam: string, awayTeam: string) => {
    let homeTeamComebacks = 0
    let awayTeamComebacks = 0
    let totalIntensity = 0

    matches.forEach((match) => {
      const isHomeTeamHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase())
      const htHomeGoals = match.half_time_home_goals
      const htAwayGoals = match.half_time_away_goals
      const ftHomeGoals = match.full_time_home_goals
      const ftAwayGoals = match.full_time_away_goals

      // Intenzitás számítás (gólok + fordulatok)
      totalIntensity +=
        ftHomeGoals + ftAwayGoals + Math.abs(ftHomeGoals - htHomeGoals) + Math.abs(ftAwayGoals - htAwayGoals)

      // Comeback elemzés
      if (htHomeGoals < htAwayGoals && ftHomeGoals >= ftAwayGoals) {
        if (isHomeTeamHome) homeTeamComebacks++
        else awayTeamComebacks++
      } else if (htAwayGoals < htHomeGoals && ftAwayGoals >= ftHomeGoals) {
        if (isHomeTeamHome) awayTeamComebacks++
        else homeTeamComebacks++
      }
    })

    const avgIntensity = matches.length > 0 ? totalIntensity / matches.length : 0
    const comebackAdvantage = matches.length > 0 ? (homeTeamComebacks - awayTeamComebacks) / matches.length : 0

    return {
      total_matches: matches.length,
      home_team_comebacks: homeTeamComebacks,
      away_team_comebacks: awayTeamComebacks,
      comeback_advantage: comebackAdvantage,
      avg_intensity: Math.round(avgIntensity * 100) / 100,
    }
  }

  const calculateLegendInsights = (homeAnalysis: any, awayAnalysis: any, homeTeam: string, awayTeam: string) => {
    const homeFreq = homeAnalysis.comeback_breakdown.comeback_frequency
    const awayFreq = awayAnalysis.comeback_breakdown.comeback_frequency
    const homeResilience = homeAnalysis.mental_strength.resilience_score
    const awayResilience = awayAnalysis.mental_strength.resilience_score

    return {
      comeback_kings: homeFreq > awayFreq ? homeTeam : awayTeam,
      mental_toughness_winner: homeResilience > awayResilience ? homeTeam : awayTeam,
      prediction_weight: {
        comeback_factor_importance: 0.25,
        mental_strength_bonus: 0.15,
        h2h_comeback_history: 0.1,
      },
      legend_score: {
        home: Math.round((homeFreq * 0.4 + homeResilience * 0.6) * 100),
        away: Math.round((awayFreq * 0.4 + awayResilience * 0.6) * 100),
      },
    }
  }

  const getResilienceColor = (score: number) => {
    if (score >= 0.4) return "text-purple-600"
    if (score >= 0.3) return "text-green-600"
    if (score >= 0.2) return "text-blue-600"
    if (score >= 0.1) return "text-yellow-600"
    return "text-red-600"
  }

  const getResilienceBadge = (score: number) => {
    if (score >= 0.4) return { text: "LEGEND", color: "bg-gradient-to-r from-purple-500 to-pink-500" }
    if (score >= 0.3) return { text: "BEAST", color: "bg-gradient-to-r from-orange-500 to-red-500" }
    if (score >= 0.2) return { text: "STRONG", color: "bg-gradient-to-r from-blue-500 to-cyan-500" }
    if (score >= 0.1) return { text: "AVERAGE", color: "bg-gradient-to-r from-gray-500 to-slate-500" }
    return { text: "WEAK", color: "bg-gradient-to-r from-red-500 to-pink-500" }
  }

  const scaleResilienceScore = (score: number) => {
    return Math.max(0, Math.min(100, score * 100))
  }

  if (loading) {
    return (
      <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
              LEGEND MODE AKTIVÁLÁS
            </h3>
            <p className="text-slate-600 text-sm">Valós adatok elemzése - Comeback breakdown számítása...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl shadow-sm border-0 bg-red-50/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">LEGEND MODE Hiba</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!legendData) return null

  const homeBadge = getResilienceBadge(legendData.home.mental_strength.resilience_score)
  const awayBadge = getResilienceBadge(legendData.away.mental_strength.resilience_score)

  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                LEGEND MODE ANALYSIS
              </h3>
              <p className="text-sm text-slate-600">Valós adatok • {legendData.meta.data_source}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              REAL DATA
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Performance Metrics */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Valós adatok elemzése</span>
            </div>
            <div className="text-sm font-bold text-green-800">{legendData.meta.execution_time_ms}ms</div>
          </div>
        </div>

        {/* LEGEND MODE Insights */}
        <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-3xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            LEGEND MODE Insights
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">👑 COMEBACK KINGS</div>
              <div className="text-2xl font-bold text-purple-600">{legendData.legend_mode_insights.comeback_kings}</div>
              <div className="text-xs text-slate-500 mt-1">Legmagasabb comeback gyakoriság</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">🛡️ MENTAL TOUGHNESS</div>
              <div className="text-2xl font-bold text-orange-600">
                {legendData.legend_mode_insights.mental_toughness_winner}
              </div>
              <div className="text-xs text-slate-500 mt-1">Magasabb mentális ellenálló képesség</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">🏆 LEGEND SCORES</div>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {legendData.legend_mode_insights.legend_score.home}
                  </div>
                  <div className="text-xs text-slate-500">{legendData.meta.home_team}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {legendData.legend_mode_insights.legend_score.away}
                  </div>
                  <div className="text-xs text-slate-500">{legendData.meta.away_team}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Team */}
          <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-slate-800">{legendData.meta.home_team}</h5>
                <Badge className={`${homeBadge.color} text-white`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {homeBadge.text}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Frequency</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.home.comeback_breakdown.comeback_frequency * 100}
                      className="flex-1 h-3"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.home.comeback_breakdown.comeback_frequency * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {legendData.home.comeback_breakdown.total_comebacks} comeback{" "}
                    {legendData.home.basic_stats.total_matches} meccsből
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Success Rate</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.home.comeback_breakdown.comeback_success_rate * 100}
                      className="flex-1 h-3"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.home.comeback_breakdown.comeback_success_rate * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-600 mb-2">Mental Resilience</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={scaleResilienceScore(legendData.home.mental_strength.resilience_score)}
                      className="flex-1 h-3"
                    />
                    <span
                      className={`text-sm font-bold ${getResilienceColor(legendData.home.mental_strength.resilience_score)}`}
                    >
                      {Math.round(scaleResilienceScore(legendData.home.mental_strength.resilience_score))}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-600 mb-2">Comeback by Deficit</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-green-600">{legendData.home.comeback_by_deficit.from_1goal}</div>
                      <div className="text-slate-500">1 gól</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{legendData.home.comeback_by_deficit.from_2goal}</div>
                      <div className="text-slate-500">2 gól</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">
                        {legendData.home.comeback_by_deficit.from_3plus_goal}
                      </div>
                      <div className="text-slate-500">3+ gól</div>
                    </div>
                  </div>
                  <div className="text-center mt-2 text-xs text-slate-600">
                    Max hátrány:{" "}
                    <span className="font-bold">{legendData.home.comeback_by_deficit.max_deficit_overcome}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Away Team */}
          <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-slate-800">{legendData.meta.away_team}</h5>
                <Badge className={`${awayBadge.color} text-white`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {awayBadge.text}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Frequency</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.away.comeback_breakdown.comeback_frequency * 100}
                      className="flex-1 h-3"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.away.comeback_breakdown.comeback_frequency * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {legendData.away.comeback_breakdown.total_comebacks} comeback{" "}
                    {legendData.away.basic_stats.total_matches} meccsből
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Success Rate</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.away.comeback_breakdown.comeback_success_rate * 100}
                      className="flex-1 h-3"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.away.comeback_breakdown.comeback_success_rate * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-600 mb-2">Mental Resilience</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={scaleResilienceScore(legendData.away.mental_strength.resilience_score)}
                      className="flex-1 h-3"
                    />
                    <span
                      className={`text-sm font-bold ${getResilienceColor(legendData.away.mental_strength.resilience_score)}`}
                    >
                      {Math.round(scaleResilienceScore(legendData.away.mental_strength.resilience_score))}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-600 mb-2">Comeback by Deficit</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-green-600">{legendData.away.comeback_by_deficit.from_1goal}</div>
                      <div className="text-slate-500">1 gól</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{legendData.away.comeback_by_deficit.from_2goal}</div>
                      <div className="text-slate-500">2 gól</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">
                        {legendData.away.comeback_by_deficit.from_3plus_goal}
                      </div>
                      <div className="text-slate-500">3+ gól</div>
                    </div>
                  </div>
                  <div className="text-center mt-2 text-xs text-slate-600">
                    Max hátrány:{" "}
                    <span className="font-bold">{legendData.away.comeback_by_deficit.max_deficit_overcome}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* H2H Analysis */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-blue-600" />
            Head-to-Head Comeback History
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {legendData.h2h_comeback_analysis.home_team_comebacks}
              </div>
              <div className="text-sm text-slate-600">{legendData.meta.home_team} comebacks</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {legendData.h2h_comeback_analysis.away_team_comebacks}
              </div>
              <div className="text-sm text-slate-600">{legendData.meta.away_team} comebacks</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{legendData.h2h_comeback_analysis.avg_intensity}</div>
              <div className="text-sm text-slate-600">Átlag intenzitás</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{legendData.h2h_comeback_analysis.total_matches}</div>
              <div className="text-sm text-slate-600">H2H meccsek</div>
            </div>
          </div>
        </div>

        {/* Meta információk */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Frissítve: {new Date(legendData.meta.generated_at).toLocaleString("hu-HU")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>LEGEND MODE • {legendData.meta.execution_time_ms}ms • Valós adatok</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
