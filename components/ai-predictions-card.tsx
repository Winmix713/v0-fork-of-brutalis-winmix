"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Target, Trophy, Calculator } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"

interface AIPredictionsCardProps {
  statistics: StatisticsResult
}

export default function AIPredictionsCard({ statistics }: AIPredictionsCardProps) {
  const { prediction, team_analysis } = statistics

  if (!prediction || !team_analysis) {
    return null
  }

  return (
    <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Brain className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">AI Predikciók</h3>
            <p className="text-sm text-slate-600">Gépi tanulás alapú előrejelzések</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Várható gólok */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Várható gólok</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <div className="text-sm text-green-700 mb-1">Hazai</div>
              <div className="text-3xl font-bold text-green-800">{prediction.homeExpectedGoals}</div>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center">
              <div className="text-sm text-red-700 mb-1">Vendég</div>
              <div className="text-3xl font-bold text-red-800">{prediction.awayExpectedGoals}</div>
            </div>
          </div>
        </div>

        {/* Előrejelzett eredmény */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Előrejelzett eredmény</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={
                prediction.predictedWinner === "home"
                  ? "default"
                  : prediction.predictedWinner === "away"
                    ? "destructive"
                    : "secondary"
              }
              className="text-sm px-4 py-2"
            >
              {prediction.predictedWinner === "home"
                ? "Hazai győzelem"
                : prediction.predictedWinner === "away"
                  ? "Vendég győzelem"
                  : prediction.predictedWinner === "draw"
                    ? "Döntetlen"
                    : "Ismeretlen"}
            </Badge>
            <span className="text-sm text-slate-600">Bizonyosság: {Math.round(prediction.confidence * 100)}%</span>
          </div>
        </div>

        {/* Modell előrejelzések */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Modell előrejelzések</span>
          </div>

          <div className="space-y-4">
            {/* ELO valószínűségek */}
            <div>
              <div className="text-sm text-slate-600 mb-3">ELO valószínűségek</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(prediction.modelPredictions.elo.homeWinProb * 100)}%
                  </div>
                  <div className="text-xs text-slate-600">Hazai</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-lg font-bold text-slate-600">
                    {Math.round(prediction.modelPredictions.elo.drawProb * 100)}%
                  </div>
                  <div className="text-xs text-slate-600">Döntetlen</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <div className="text-lg font-bold text-red-600">
                    {Math.round(prediction.modelPredictions.elo.awayWinProb * 100)}%
                  </div>
                  <div className="text-xs text-slate-600">Vendég</div>
                </div>
              </div>
            </div>

            {/* Poisson modell */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-sm font-medium text-slate-700 mb-2">Poisson modell</div>
              <div className="text-lg font-bold text-slate-800">
                Várható eredmény: {prediction.modelPredictions.poisson.homeGoals} -{" "}
                {prediction.modelPredictions.poisson.awayGoals}
              </div>
            </div>

            {/* Mindkét csapat gólja */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-sm font-medium text-slate-700 mb-2">Mindkét csapat gólja</div>
              <div className="text-2xl font-bold text-slate-800">{prediction.bothTeamsToScoreProb}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
