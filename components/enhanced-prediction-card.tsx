"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Info } from "lucide-react"
import type { StatisticsResult } from "@/lib/football-statistics"
import { useEnsembleWeight } from "@/hooks/use-ensemble-weight"

interface EnhancedPredictionCardProps {
  homeTeam: string
  awayTeam: string
  statistics: StatisticsResult | null
}

interface PredictionData {
  home_win_probability: number
  draw_probability: number
  away_win_probability: number
  predicted_home_goals: number
  predicted_away_goals: number
  predicted_total_goals: number
  confidence_score: number
  model_version: string
  prediction_type: string
  league: string
  comeback_probability_home?: number
  comeback_probability_away?: number
  resilience_factor_home?: number
  resilience_factor_away?: number
  mental_strength_home?: number
  mental_strength_away?: number
  legend_mode_features?: any // JSONB type
}

export default function EnhancedPredictionCard({ homeTeam, awayTeam, statistics }: EnhancedPredictionCardProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { weight, setWeight } = useEnsembleWeight(0.5) // Ensemble weight for blending models

  const fetchPrediction = async () => {
    setLoading(true)
    setError(null)
    setPrediction(null) // Clear previous prediction

    try {
      // Construct a mock match date for the API call (e.g., today's date)
      const today = new Date()
      const matchDate = today.toISOString().split("T")[0] // YYYY-MM-DD

      const response = await fetch(
        `/api/enhanced-prediction?home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(
          awayTeam,
        )}&match_date=${matchDate}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch prediction.")
      }

      const data: PredictionData = await response.json()
      setPrediction(data)
    } catch (err: any) {
      setError(err.message || "Ismeretlen hiba történt az előrejelzés lekérésekor.")
      console.error("Error fetching prediction:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (homeTeam && awayTeam) {
      fetchPrediction()
    }
  }, [homeTeam, awayTeam])

  // Mock blending logic for ensemble slider
  const blendedHomeWin = prediction
    ? prediction.home_win_probability * weight +
      ((statistics?.homeWins || 0) / (statistics?.totalMatches || 1)) * (1 - weight)
    : 0
  const blendedAwayWin = prediction
    ? prediction.away_win_probability * weight +
      ((statistics?.awayWins || 0) / (statistics?.totalMatches || 1)) * (1 - weight)
    : 0
  const blendedDraw = prediction
    ? prediction.draw_probability * weight + ((statistics?.draws || 0) / (statistics?.totalMatches || 1)) * (1 - weight)
    : 0

  const totalBlended = blendedHomeWin + blendedAwayWin + blendedDraw
  const normalizedBlendedHomeWin = totalBlended > 0 ? blendedHomeWin / totalBlended : 0
  const normalizedBlendedAwayWin = totalBlended > 0 ? blendedAwayWin / totalBlended : 0
  const normalizedBlendedDraw = totalBlended > 0 ? blendedDraw / totalBlended : 0

  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Továbbfejlesztett Predikció</CardTitle>
        <Button onClick={fetchPrediction} disabled={loading} variant="ghost" size="icon">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-600">Előrejelzés generálása...</span>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-center p-4">
            <p className="font-semibold">Hiba:</p>
            <p>{error}</p>
          </div>
        )}

        {prediction && !loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Label className="text-sm font-medium">Hazai győzelem</Label>
                <div className="text-3xl font-bold text-blue-600">{(normalizedBlendedHomeWin * 100).toFixed(1)}%</div>
                <Progress value={normalizedBlendedHomeWin * 100} className="h-2" />
              </div>
              <div>
                <Label className="text-sm font-medium">Döntetlen</Label>
                <div className="text-3xl font-bold text-yellow-600">{(normalizedBlendedDraw * 100).toFixed(1)}%</div>
                <Progress value={normalizedBlendedDraw * 100} className="h-2" />
              </div>
              <div>
                <Label className="text-sm font-medium">Vendég győzelem</Label>
                <div className="text-3xl font-bold text-green-600">{(normalizedBlendedAwayWin * 100).toFixed(1)}%</div>
                <Progress value={normalizedBlendedAwayWin * 100} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ensemble-slider" className="text-sm font-medium">
                  Ensemble súlyozás (AI vs. Statisztika)
                </Label>
                <span className="text-sm text-gray-600">
                  AI: {(weight * 100).toFixed(0)}% | Statisztika: {((1 - weight) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                id="ensemble-slider"
                min={0}
                max={1}
                step={0.01}
                value={[weight]}
                onValueChange={setWeight}
                className="w-full"
              />
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>
                  Állítsd be, mennyire befolyásolja az AI modell és a történelmi statisztikák az előrejelzést.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium">Prediktált hazai gólok</Label>
                <div className="text-xl font-bold">{prediction.predicted_home_goals}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Prediktált vendég gólok</Label>
                <div className="text-xl font-bold">{prediction.predicted_away_goals}</div>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">Prediktált összes gól</Label>
                <div className="text-xl font-bold">{prediction.predicted_total_goals}</div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>
                Modell verzió: {prediction.model_version} | Típus: {prediction.prediction_type}
              </p>
              <p>Konfidencia pontszám: {(prediction.confidence_score * 100).toFixed(2)}%</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
