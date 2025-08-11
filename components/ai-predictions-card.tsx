import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { StatisticsResult } from "@/lib/football-statistics"
import { Brain, CheckCircle } from "lucide-react"

interface AIPredictionsCardProps {
  statistics: StatisticsResult
}

export default function AIPredictionsCard({ statistics }: AIPredictionsCardProps) {
  if (!statistics.aiPredictionAccuracy) {
    return null
  }

  const { overallAccuracy, homeWinAccuracy, drawAccuracy, awayWinAccuracy } = statistics.aiPredictionAccuracy

  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Predikció pontosság
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Összesített pontosság</span>
            <span className="font-semibold">{(overallAccuracy * 100).toFixed(2)}%</span>
          </div>
          <Progress value={overallAccuracy * 100} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Hazai győzelem pontosság</span>
            <span className="font-semibold">{(homeWinAccuracy * 100).toFixed(2)}%</span>
          </div>
          <Progress value={homeWinAccuracy * 100} className="h-2 bg-blue-200" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Döntetlen pontosság</span>
            <span className="font-semibold">{(drawAccuracy * 100).toFixed(2)}%</span>
          </div>
          <Progress value={drawAccuracy * 100} className="h-2 bg-yellow-200" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Vendég győzelem pontosság</span>
            <span className="font-semibold">{(awayWinAccuracy * 100).toFixed(2)}%</span>
          </div>
          <Progress value={awayWinAccuracy * 100} className="h-2 bg-green-200" />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>A pontosság a korábbi predikciók és valós eredmények alapján számítva.</span>
        </div>
      </CardContent>
    </Card>
  )
}
