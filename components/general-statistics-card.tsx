import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatisticsResult } from "@/lib/football-statistics"
import { Goal, Home, Users, TrendingUp } from "lucide-react"

interface GeneralStatisticsCardProps {
  statistics: StatisticsResult
}

export default function GeneralStatisticsCard({ statistics }: GeneralStatisticsCardProps) {
  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Goal className="h-5 w-5" />
          Általános statisztikák
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-blue-500" />
            <span>Hazai győzelmek: {statistics.homeWins}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Vendég győzelmek: {statistics.awayWins}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-yellow-500" />
            <span>Döntetlenek: {statistics.draws}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Goal className="h-4 w-4 text-purple-500" />
            <span>Összes gól: {statistics.totalGoals}</span>
          </div>
          <div className="flex items-center gap-2">
            <Goal className="h-4 w-4 text-indigo-500" />
            <span>Átlag gól/meccs: {statistics.avgTotalGoals.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-500" />
            <span>BTTS mérkőzések: {statistics.bttsMatches}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
