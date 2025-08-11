import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { StatisticsResult } from "@/lib/football-statistics"

interface StatisticsPanelProps {
  statistics: StatisticsResult
}

export default function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mérkőzés statisztikák</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Összesített statisztikák</h3>
          <div className="space-y-1 text-sm">
            <p>Összes mérkőzés: {statistics.totalMatches}</p>
            <p>Hazai győzelmek: {statistics.homeWins}</p>
            <p>Vendég győzelmek: {statistics.awayWins}</p>
            <p>Döntetlenek: {statistics.draws}</p>
            <p>Összes gól: {statistics.totalGoals}</p>
            <p>Átlag gól/meccs: {statistics.avgTotalGoals.toFixed(2)}</p>
            <p>BTTS mérkőzések: {statistics.bttsMatches}</p>
          </div>
        </div>
        <Separator orientation="vertical" />
        <div>
          <h3 className="font-semibold mb-2">Csapat statisztikák</h3>
          {statistics.teamStats &&
            Object.entries(statistics.teamStats).map(([teamName, stats]) => (
              <div key={teamName} className="mb-4">
                <h4 className="font-medium text-md">{teamName}</h4>
                <div className="space-y-1 text-sm">
                  <p>Mérkőzések: {stats.totalMatches}</p>
                  <p>Győzelmek: {stats.wins}</p>
                  <p>Döntetlenek: {stats.draws}</p>
                  <p>Vereségek: {stats.losses}</p>
                  <p>Lőtt gólok: {stats.goalsFor}</p>
                  <p>Kapott gólok: {stats.goalsAgainst}</p>
                  <p>Átlag lőtt gól: {stats.avgGoalsFor.toFixed(2)}</p>
                  <p>Átlag kapott gól: {stats.avgGoalsAgainst.toFixed(2)}</p>
                  <p>Kapott gól nélkül: {stats.cleanSheets}</p>
                  <p>Gól nélkül: {stats.failedToScore}</p>
                </div>
              </div>
            ))}
        </div>
        {statistics.h2hStats && (
          <>
            <Separator className="col-span-2" />
            <div className="col-span-2">
              <h3 className="font-semibold mb-2">Head-to-Head statisztikák</h3>
              <div className="space-y-1 text-sm">
                <p>
                  {statistics.h2hStats.team1} vs {statistics.h2hStats.team2}
                </p>
                <p>Összes mérkőzés: {statistics.h2hStats.totalMatches}</p>
                <p>
                  {statistics.h2hStats.team1} győzelmek: {statistics.h2hStats.team1Wins}
                </p>
                <p>
                  {statistics.h2hStats.team2} győzelmek: {statistics.h2hStats.team2Wins}
                </p>
                <p>Döntetlenek: {statistics.h2hStats.draws}</p>
                <p>
                  {statistics.h2hStats.team1} gólok: {statistics.h2hStats.team1Goals}
                </p>
                <p>
                  {statistics.h2hStats.team2} gólok: {statistics.h2hStats.team2Goals}
                </p>
                <p>
                  Átlag {statistics.h2hStats.team1} gól: {statistics.h2hStats.avgTeam1Goals.toFixed(2)}
                </p>
                <p>
                  Átlag {statistics.h2hStats.team2} gól: {statistics.h2hStats.avgTeam2Goals.toFixed(2)}
                </p>
              </div>
            </div>
          </>
        )}
        {statistics.aiPredictionAccuracy && (
          <>
            <Separator className="col-span-2" />
            <div className="col-span-2">
              <h3 className="font-semibold mb-2">AI Predikció pontosság</h3>
              <div className="space-y-1 text-sm">
                <p>Összesített pontosság: {(statistics.aiPredictionAccuracy.overallAccuracy * 100).toFixed(2)}%</p>
                <p>Hazai győzelem pontosság: {(statistics.aiPredictionAccuracy.homeWinAccuracy * 100).toFixed(2)}%</p>
                <p>Döntetlen pontosság: {(statistics.aiPredictionAccuracy.drawAccuracy * 100).toFixed(2)}%</p>
                <p>Vendég győzelem pontosság: {(statistics.aiPredictionAccuracy.awayWinAccuracy * 100).toFixed(2)}%</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
