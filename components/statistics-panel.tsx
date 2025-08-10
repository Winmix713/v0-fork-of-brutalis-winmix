"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Target, TrendingUp, Trophy, Users, Zap, Activity, PieChart, Calculator, Brain } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface StatisticsPanelProps {
  statistics: StatisticsResult
}

export default function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  const { total_matches, team_analysis, prediction, general_stats } = statistics

  if (total_matches === 0) {
    return (
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nincs adat</h3>
            <p className="text-slate-600">Válassz csapatokat a statisztikák megtekintéséhez.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Általános statisztikák */}
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Általános statisztikák</CardTitle>
              <p className="text-sm text-slate-600">{total_matches} mérkőzés alapján</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Mindkét csapat gólja</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{general_stats.both_teams_scored_percentage}%</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Átlag gólok</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{general_stats.average_goals.average_total_goals}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Hazai átlag</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{general_stats.average_goals.average_home_goals}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Csapat elemzés */}
      {team_analysis && (
        <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Csapat elemzés</CardTitle>
                <p className="text-sm text-slate-600">
                  {team_analysis.home_team} vs {team_analysis.away_team}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Head-to-head statisztikák */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Egymás elleni meccsek ({team_analysis.matches_count} db)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{team_analysis.head_to_head_stats.home_wins}</div>
                  <div className="text-sm text-slate-600">Hazai győzelem</div>
                  <div className="text-xs text-slate-500">{team_analysis.head_to_head_stats.home_win_percentage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-600">{team_analysis.head_to_head_stats.draws}</div>
                  <div className="text-sm text-slate-600">Döntetlen</div>
                  <div className="text-xs text-slate-500">{team_analysis.head_to_head_stats.draw_percentage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{team_analysis.head_to_head_stats.away_wins}</div>
                  <div className="text-sm text-slate-600">Vendég győzelem</div>
                  <div className="text-xs text-slate-500">{team_analysis.head_to_head_stats.away_win_percentage}%</div>
                </div>
              </div>
            </div>

            {/* Forma index */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Forma index (utolsó 5 meccs)
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{team_analysis.home_team}</span>
                    <span className="text-sm font-bold">{team_analysis.home_form_index}%</span>
                  </div>
                  <Progress value={team_analysis.home_form_index} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{team_analysis.away_team}</span>
                    <span className="text-sm font-bold">{team_analysis.away_form_index}%</span>
                  </div>
                  <Progress value={team_analysis.away_form_index} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predikciók */}
      {prediction && (
        <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Brain className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Predikciók</CardTitle>
                <p className="text-sm text-slate-600">Gépi tanulás alapú előrejelzések</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Várható gólok */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Várható gólok
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-2xl p-4">
                  <div className="text-sm text-green-700 mb-1">Hazai</div>
                  <div className="text-2xl font-bold text-green-800">{prediction.homeExpectedGoals}</div>
                </div>
                <div className="bg-red-50 rounded-2xl p-4">
                  <div className="text-sm text-red-700 mb-1">Vendég</div>
                  <div className="text-2xl font-bold text-red-800">{prediction.awayExpectedGoals}</div>
                </div>
              </div>
            </div>

            {/* Előrejelzett győztes */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Előrejelzett eredmény
              </h4>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    prediction.predictedWinner === "home"
                      ? "default"
                      : prediction.predictedWinner === "away"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-sm px-3 py-1"
                >
                  {prediction.predictedWinner === "home"
                    ? "Hazai győzelem"
                    : prediction.predictedWinner === "away"
                      ? "Vendég győzelem"
                      : prediction.predictedWinner === "draw"
                        ? "Döntetlen"
                        : "Ismeretlen"}
                </Badge>
                <span className="text-sm text-slate-600">Bizonyosság: {Math.round(prediction.confidence * 100)}%</span>
              </div>
            </div>

            {/* Modell előrejelzések */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Modell előrejelzések
              </h4>
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-sm font-medium text-slate-700 mb-2">ELO valószínűségek</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-green-600">
                        {Math.round(prediction.modelPredictions.elo.homeWinProb * 100)}%
                      </div>
                      <div className="text-slate-600">Hazai</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-600">
                        {Math.round(prediction.modelPredictions.elo.drawProb * 100)}%
                      </div>
                      <div className="text-slate-600">Döntetlen</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">
                        {Math.round(prediction.modelPredictions.elo.awayWinProb * 100)}%
                      </div>
                      <div className="text-slate-600">Vendég</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-sm font-medium text-slate-700 mb-2">Poisson modell</div>
                  <div className="text-sm text-slate-600">
                    Várható eredmény: {prediction.modelPredictions.poisson.homeGoals} -{" "}
                    {prediction.modelPredictions.poisson.awayGoals}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-sm font-medium text-slate-700 mb-2">Mindkét csapat gólja</div>
                  <div className="text-lg font-bold text-slate-800">{prediction.bothTeamsToScoreProb}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
