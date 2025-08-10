"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface CompactStatisticsCardProps {
  statistics: StatisticsResult
}

export default function CompactStatisticsCard({ statistics }: CompactStatisticsCardProps) {
  const { total_matches, team_analysis, prediction, general_stats } = statistics

  if (total_matches === 0 || !team_analysis || !prediction) {
    return (
      <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm w-full">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-600">Nincs elegendő adat</h3>
            <p className="text-sm text-slate-500 mt-1">Válassz két csapatot az elemzéshez</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm w-full">
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-8">
          <h3 className="text-xl font-semibold text-slate-800">Head-to-Head Elemzés</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left Team */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mb-4 mx-auto">
              <span className="text-lg font-bold text-white">
                {team_analysis.home_team.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="text-lg font-medium text-slate-800">{team_analysis.home_team}</div>
          </div>

          {/* Center Stats */}
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-800 mb-2">{team_analysis.matches_count}</div>
            <div className="text-lg text-slate-600 mb-6">Meccsek</div>

            {/* Match Results */}
            <div className="bg-slate-800 rounded-2xl p-6 text-white mb-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{team_analysis.head_to_head_stats.home_wins}</div>
                  <div className="text-xs text-slate-300">Hazai győzelem</div>
                  <div className="text-xs text-green-400">{team_analysis.head_to_head_stats.home_win_percentage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{team_analysis.head_to_head_stats.draws}</div>
                  <div className="text-xs text-slate-300">Döntetlen</div>
                  <div className="text-xs text-yellow-400">{team_analysis.head_to_head_stats.draw_percentage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{team_analysis.head_to_head_stats.away_wins}</div>
                  <div className="text-xs text-slate-300">Vendég győzelem</div>
                  <div className="text-xs text-red-400">{team_analysis.head_to_head_stats.away_win_percentage}%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-700 pt-4">
                <div>
                  <div className="text-sm text-slate-300">Hazai</div>
                  <div className="text-xl font-bold text-blue-400">
                    {team_analysis.average_goals.average_home_goals}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Átlag gólok</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {team_analysis.average_goals.average_total_goals}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Vendég</div>
                  <div className="text-xl font-bold text-red-400">{team_analysis.average_goals.average_away_goals}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Team */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center mb-4 mx-auto">
              <span className="text-lg font-bold text-white">
                {team_analysis.away_team.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="text-lg font-medium text-slate-800">{team_analysis.away_team}</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-8 bg-slate-800 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-slate-300 mb-2">Mindkét csapat gólja</div>
              <div className="text-xl font-bold text-green-400 mb-2">{team_analysis.both_teams_scored_percentage}%</div>
            </div>
            <div>
              <div className="text-sm text-slate-300 mb-1">Hazai forma index</div>
              <div className="text-xl font-bold text-green-400">{team_analysis.home_form_index}%</div>
            </div>
            <div>
              <div className="text-sm text-slate-300 mb-1">Vendég forma index</div>
              <div className="text-xl font-bold text-yellow-400">{team_analysis.away_form_index}%</div>
            </div>
            <div className="text-right">
              <div className="bg-slate-700 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">Előrejelzés pontszám</div>
                <div className="text-xl font-bold text-yellow-400">
                  {((prediction.homeExpectedGoals + prediction.awayExpectedGoals) / 2).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-700">
            <div>
              <div className="text-sm text-slate-300 mb-1">Várható gólok (H)</div>
              <div className="text-xl font-bold text-blue-400">{prediction.homeExpectedGoals}</div>
            </div>
            <div>
              <div className="text-sm text-slate-300 mb-1">Várható gólok (V)</div>
              <div className="text-xl font-bold text-red-400">{prediction.awayExpectedGoals}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
