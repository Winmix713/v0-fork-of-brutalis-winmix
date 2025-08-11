import { Card, CardContent } from "@/components/ui/card"
import type { StatisticsResult } from "@/lib/football-statistics"
import { Goal, Home, Users, TrendingUp, Percent } from "lucide-react"

interface MiniStatsGridProps {
  statistics: StatisticsResult
}

export default function MiniStatsGrid({ statistics }: MiniStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Home className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Hazai győzelmek</div>
            <div className="text-2xl font-bold">{statistics.homeWins}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-green-100 p-3 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Vendég győzelmek</div>
            <div className="text-2xl font-bold">{statistics.awayWins}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <Users className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Döntetlenek</div>
            <div className="text-2xl font-bold">{statistics.draws}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Goal className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Összes gól</div>
            <div className="text-2xl font-bold">{statistics.totalGoals}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Percent className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Átlag gól/meccs</div>
            <div className="text-2xl font-bold">{statistics.avgTotalGoals.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-teal-100 p-3 rounded-full">
            <Users className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">BTTS mérkőzések</div>
            <div className="text-2xl font-bold">{statistics.bttsMatches}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <Home className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Hazai kapott gól nélkül</div>
            <div className="text-2xl font-bold">{statistics.cleanSheetsHome}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-lime-100 p-3 rounded-full">
            <TrendingUp className="h-6 w-6 text-lime-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Vendég kapott gól nélkül</div>
            <div className="text-2xl font-bold">{statistics.cleanSheetsAway}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
