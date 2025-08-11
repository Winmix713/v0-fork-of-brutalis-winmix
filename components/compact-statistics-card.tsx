"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Trophy } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface CompactStatisticsCardProps {
  statistics: StatisticsResult
}

export default function CompactStatisticsCard({ statistics }: CompactStatisticsCardProps) {
  const { totalMatches, teamAnalysis, prediction, generalStats } = statistics

  if (totalMatches === 0 || !teamAnalysis || !prediction) {
    return (
      <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm w-full">
        <CardHeader>
          <CardTitle>Nincs elegendő adat</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mt-1">Válassz két csapatot az elemzéshez</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Összesített statisztikák</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p>Összes mérkőzés: {totalMatches}</p>
          <p>Hazai győzelmek: {teamAnalysis.headToHeadStats.homeWins}</p>
          <p>Vendég győzelmek: {teamAnalysis.headToHeadStats.awayWins}</p>
          <p>Döntetlenek: {teamAnalysis.headToHeadStats.draws}</p>
        </div>
        <Separator orientation="vertical" />
        <div className="space-y-1">
          <p>Összes gól: {teamAnalysis.averageGoals.averageTotalGoals * teamAnalysis.matchesCount}</p>
          <p>Átlag gól/meccs: {teamAnalysis.averageGoals.averageTotalGoals.toFixed(2)}</p>
          <p>BTTS mérkőzések: {teamAnalysis.bothTeamsScoredPercentage}%</p>
        </div>
      </CardContent>
    </Card>
  )
}
