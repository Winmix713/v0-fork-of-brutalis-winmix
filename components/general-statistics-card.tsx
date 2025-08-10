"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BarChart3, Target, Activity, Home } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface GeneralStatisticsCardProps {
  statistics: StatisticsResult
}

export default function GeneralStatisticsCard({ statistics }: GeneralStatisticsCardProps) {
  const { total_matches, general_stats } = statistics

  if (total_matches === 0) {
    return null
  }

  return (
    <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Általános statisztikák</h3>
            <p className="text-sm text-slate-600">{total_matches} mérkőzés alapján</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mindkét csapat gólja */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Target className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Mindkét csapat gólja</div>
              <div className="text-2xl font-bold text-slate-800">{general_stats.both_teams_scored_percentage}%</div>
            </div>
          </div>

          {/* Átlag gólok */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Átlag gólok</div>
              <div className="text-2xl font-bold text-slate-800">{general_stats.average_goals.average_total_goals}</div>
            </div>
          </div>

          {/* Hazai átlag */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Home className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Hazai átlag</div>
              <div className="text-2xl font-bold text-slate-800">{general_stats.average_goals.average_home_goals}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
