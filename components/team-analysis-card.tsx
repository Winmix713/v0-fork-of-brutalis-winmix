import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatisticsResult } from "@/lib/football-statistics"
import { Users, Shield, XCircle } from "lucide-react"

interface TeamAnalysisCardProps {
  statistics: StatisticsResult
}

export default function TeamAnalysisCard({ statistics }: TeamAnalysisCardProps) {
  if (!statistics.teamStats) {
    return null
  }

  const teams = Object.keys(statistics.teamStats)

  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Csapat elemzés
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 text-sm">
        {teams.map((teamName) => {
          const stats = statistics.teamStats![teamName]
          return (
            <div key={teamName} className="space-y-2 border-b pb-2 last:border-b-0 last:pb-0">
              <h3 className="font-semibold text-md">{teamName}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <span>Mérkőzések: {stats.totalMatches}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Győzelmek: {stats.wins}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Döntetlenek: {stats.draws}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Vereségek: {stats.losses}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Lőtt gólok: {stats.goalsFor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Kapott gólok: {stats.goalsAgainst}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Átlag lőtt gól: {stats.avgGoalsFor.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Átlag kapott gól: {stats.avgGoalsAgainst.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Kapott gól nélkül: {stats.cleanSheets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Gól nélkül: {stats.failedToScore}</span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
