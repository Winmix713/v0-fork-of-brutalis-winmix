"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Target, Activity, Users, TrendingUp, Brain, Calculator } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface MiniStatsGridProps {
  statistics: StatisticsResult
}

export default function MiniStatsGrid({ statistics }: MiniStatsGridProps) {
  const { total_matches, team_analysis, prediction, general_stats } = statistics

  if (total_matches === 0) {
    return null
  }

  const statsCards = [
    {
      title: "Összes meccs",
      value: total_matches.toString(),
      icon: Activity,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Mindkét csapat gólja",
      value: `${general_stats.both_teams_scored_percentage}%`,
      icon: Target,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Átlag gólok",
      value: general_stats.average_goals.average_total_goals.toString(),
      icon: Users,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
  ]

  // Add team-specific stats if available
  if (team_analysis && prediction) {
    statsCards.push(
      {
        title: "Forma különbség",
        value: `${Math.abs(team_analysis.home_form_index - team_analysis.away_form_index).toFixed(1)}%`,
        icon: TrendingUp,
        color: "bg-orange-500",
        textColor: "text-orange-600",
      },
      {
        title: "Várható gólok",
        value: (prediction.homeExpectedGoals + prediction.awayExpectedGoals).toFixed(1),
        icon: Brain,
        color: "bg-pink-500",
        textColor: "text-pink-600",
      },
      {
        title: "Bizonyosság",
        value: `${Math.round(prediction.confidence * 100)}%`,
        icon: Calculator,
        color: "bg-indigo-500",
        textColor: "text-indigo-600",
      },
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="rounded-2xl border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 truncate">{stat.title}</div>
                  <div className={`text-lg font-bold ${stat.textColor} truncate`}>{stat.value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
