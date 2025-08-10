"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Clock, Shield, Flame, Crown, Star, Award, Sparkles } from "lucide-react"

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
  }
  meta: {
    generated_at: string
    model_version: string
    league: string
    home_team: string
    away_team: string
    analysis_depth: string
  }
}

interface LegendModePredictionCardProps {
  homeTeam: string
  awayTeam: string
}

export default function LegendModePredictionCard({ homeTeam, awayTeam }: LegendModePredictionCardProps) {
  const [legendData, setLegendData] = useState<LegendModeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (homeTeam && awayTeam) {
      fetchLegendModeData()
    }
  }, [homeTeam, awayTeam])

  const fetchLegendModeData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock LEGEND MODE data for demonstration
      const mockData: LegendModeData = {
        home: {
          basic_stats: { total_matches: 28, form_index: 0.643 },
          comeback_breakdown: {
            comeback_wins: 4,
            comeback_draws: 2,
            total_comebacks: 6,
            comeback_frequency: 0.214,
            comeback_success_rate: 0.667,
          },
          comeback_by_deficit: {
            from_1goal: 4,
            from_2goal: 2,
            from_3plus_goal: 0,
            max_deficit_overcome: 2,
          },
          blown_leads: {
            blown_lead_losses: 2,
            blown_lead_draws: 1,
            blown_lead_frequency: 0.107,
          },
          mental_strength: {
            avg_comeback_margin: 1.25,
            resilience_score: 0.321,
          },
        },
        away: {
          basic_stats: { total_matches: 26, form_index: 0.731 },
          comeback_breakdown: {
            comeback_wins: 5,
            comeback_draws: 1,
            total_comebacks: 6,
            comeback_frequency: 0.231,
            comeback_success_rate: 0.833,
          },
          comeback_by_deficit: {
            from_1goal: 3,
            from_2goal: 2,
            from_3plus_goal: 1,
            max_deficit_overcome: 3,
          },
          blown_leads: {
            blown_lead_losses: 1,
            blown_lead_draws: 2,
            blown_lead_frequency: 0.115,
          },
          mental_strength: {
            avg_comeback_margin: 1.6,
            resilience_score: 0.385,
          },
        },
        h2h_comeback_analysis: {
          total_matches: 8,
          home_team_comebacks: 2,
          away_team_comebacks: 3,
          comeback_advantage: -0.125,
          avg_intensity: 2.75,
        },
        legend_mode_insights: {
          comeback_kings: awayTeam,
          mental_toughness_winner: awayTeam,
          prediction_weight: {
            comeback_factor_importance: 0.25,
            mental_strength_bonus: 0.15,
            h2h_comeback_history: 0.1,
          },
        },
        meta: {
          generated_at: new Date().toISOString(),
          model_version: "legend_mode_v1",
          league: "spain",
          home_team: homeTeam,
          away_team: awayTeam,
          analysis_depth: "legend_mode_comeback_breakdown",
        },
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))
      setLegendData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba")
    } finally {
      setLoading(false)
    }
  }

  const getResilienceColor = (score: number) => {
    if (score >= 0.3) return "text-green-600"
    if (score >= 0.1) return "text-yellow-600"
    return "text-red-600"
  }

  const getResilienceBadge = (score: number) => {
    if (score >= 0.4) return { text: "LEGEND", color: "bg-purple-500" }
    if (score >= 0.3) return { text: "BEAST", color: "bg-orange-500" }
    if (score >= 0.2) return { text: "STRONG", color: "bg-blue-500" }
    if (score >= 0.1) return { text: "AVERAGE", color: "bg-gray-500" }
    return { text: "WEAK", color: "bg-red-500" }
  }

  if (loading) {
    return (
      <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-purple-50 to-orange-50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent mb-2">
              LEGEND MODE AKTIVÁLÁS
            </h3>
            <p className="text-slate-600 text-sm">Comeback frequency breakdown számítása...</p>
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
    <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-purple-50 to-orange-50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                LEGEND MODE ANALYSIS
              </h3>
              <p className="text-sm text-slate-600">Comeback Frequency Breakdown</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-purple-500 to-orange-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              LEGEND v1
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* LEGEND MODE Insights */}
        <div className="bg-gradient-to-r from-purple-100 to-orange-100 rounded-3xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            LEGEND MODE Insights
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">👑 COMEBACK KINGS</div>
              <div className="text-2xl font-bold text-purple-600">{legendData.legend_mode_insights.comeback_kings}</div>
              <div className="text-xs text-slate-500 mt-1">Highest comeback frequency</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">🛡️ MENTAL TOUGHNESS</div>
              <div className="text-2xl font-bold text-orange-600">
                {legendData.legend_mode_insights.mental_toughness_winner}
              </div>
              <div className="text-xs text-slate-500 mt-1">Superior resilience score</div>
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
                {/* Comeback Stats */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Frequency</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.home.comeback_breakdown.comeback_frequency * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.home.comeback_breakdown.comeback_frequency * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {legendData.home.comeback_breakdown.total_comebacks} comebacks in{" "}
                    {legendData.home.basic_stats.total_matches} matches
                  </div>
                </div>

                {/* Success Rate */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Success Rate</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.home.comeback_breakdown.comeback_success_rate * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.home.comeback_breakdown.comeback_success_rate * 100)}%
                    </span>
                  </div>
                </div>

                {/* Resilience Score */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">Mental Resilience</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={Math.max(0, legendData.home.mental_strength.resilience_score * 100)}
                      className="flex-1 h-2"
                    />
                    <span
                      className={`text-sm font-bold ${getResilienceColor(legendData.home.mental_strength.resilience_score)}`}
                    >
                      {legendData.home.mental_strength.resilience_score.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Comeback by Deficit */}
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-600 mb-2">Comeback by Deficit</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-green-600">{legendData.home.comeback_by_deficit.from_1goal}</div>
                      <div className="text-slate-500">1 goal</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{legendData.home.comeback_by_deficit.from_2goal}</div>
                      <div className="text-slate-500">2 goals</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">
                        {legendData.home.comeback_by_deficit.from_3plus_goal}
                      </div>
                      <div className="text-slate-500">3+ goals</div>
                    </div>
                  </div>
                  <div className="text-center mt-2 text-xs text-slate-600">
                    Max deficit:{" "}
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
                {/* Comeback Stats */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Frequency</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.away.comeback_breakdown.comeback_frequency * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.away.comeback_breakdown.comeback_frequency * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {legendData.away.comeback_breakdown.total_comebacks} comebacks in{" "}
                    {legendData.away.basic_stats.total_matches} matches
                  </div>
                </div>

                {/* Success Rate */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">Comeback Success Rate</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={legendData.away.comeback_breakdown.comeback_success_rate * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-bold">
                      {Math.round(legendData.away.comeback_breakdown.comeback_success_rate * 100)}%
                    </span>
                  </div>
                </div>

                {/* Resilience Score */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">Mental Resilience</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={Math.max(0, legendData.away.mental_strength.resilience_score * 100)}
                      className="flex-1 h-2"
                    />
                    <span
                      className={`text-sm font-bold ${getResilienceColor(legendData.away.mental_strength.resilience_score)}`}
                    >
                      {legendData.away.mental_strength.resilience_score.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Comeback by Deficit */}
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-600 mb-2">Comeback by Deficit</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-green-600">{legendData.away.comeback_by_deficit.from_1goal}</div>
                      <div className="text-slate-500">1 goal</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{legendData.away.comeback_by_deficit.from_2goal}</div>
                      <div className="text-slate-500">2 goals</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">
                        {legendData.away.comeback_by_deficit.from_3plus_goal}
                      </div>
                      <div className="text-slate-500">3+ goals</div>
                    </div>
                  </div>
                  <div className="text-center mt-2 text-xs text-slate-600">
                    Max deficit:{" "}
                    <span className="font-bold">{legendData.away.comeback_by_deficit.max_deficit_overcome}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* H2H Comeback Analysis */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-blue-600" />
            Head-to-Head Comeback History
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {legendData.h2h_comeback_analysis.home_team_comebacks}
              </div>
              <div className="text-sm text-slate-600">{legendData.meta.home_team} comebacks</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{legendData.h2h_comeback_analysis.avg_intensity}</div>
              <div className="text-sm text-slate-600">Avg match intensity</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {legendData.h2h_comeback_analysis.away_team_comebacks}
              </div>
              <div className="text-sm text-slate-600">{legendData.meta.away_team} comebacks</div>
            </div>
          </div>
        </div>

        {/* Meta információk */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Generated: {new Date(legendData.meta.generated_at).toLocaleString("hu-HU")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>LEGEND MODE v1 • Comeback Breakdown</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
