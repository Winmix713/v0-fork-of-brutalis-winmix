"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp, Clock } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface TeamAnalysisCardProps {
  statistics: StatisticsResult
}

export default function TeamAnalysisCard({ statistics }: TeamAnalysisCardProps) {
  const { team_analysis } = statistics

  if (!team_analysis) {
    return null
  }

  return (
    <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Csapat elemzés</h3>
            <p className="text-sm text-slate-600">
              {team_analysis.home_team} vs {team_analysis.away_team}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Egymás elleni meccsek */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              Egymás elleni meccsek ({team_analysis.matches_count} db)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">{team_analysis.head_to_head_stats.home_wins}</div>
              <div className="text-sm text-slate-600 mb-1">Hazai győzelem</div>
              <div className="text-xs text-slate-500">{team_analysis.head_to_head_stats.home_win_percentage}%</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{team_analysis.head_to_head_stats.draws}</div>
              <div className="text-sm text-slate-600 mb-1">Döntetlen</div>
              <div className="text-xs text-slate-500">{team_analysis.head_to_head_stats.draw_percentage}%</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-1">{team_analysis.head_to_head_stats.away_wins}</div>
              <div className="text-sm text-slate-600 mb-1">Vendég győzelem</div>
              <div className="text-xs text-slate-500">{team_analysis.head_to_head_stats.away_win_percentage}%</div>
            </div>
          </div>
        </div>

        {/* Forma index */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Forma index (utolsó 5 meccs)</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">{team_analysis.home_team}</span>
                <span className="text-sm font-bold text-slate-800">{team_analysis.home_form_index}%</span>
              </div>
              <Progress value={team_analysis.home_form_index} className="h-3 bg-slate-200">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all"
                  style={{ width: `${team_analysis.home_form_index}%` }}
                />
              </Progress>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">{team_analysis.away_team}</span>
                <span className="text-sm font-bold text-slate-800">{team_analysis.away_form_index}%</span>
              </div>
              <Progress value={team_analysis.away_form_index} className="h-3 bg-slate-200">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all"
                  style={{ width: `${team_analysis.away_form_index}%` }}
                />
              </Progress>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
