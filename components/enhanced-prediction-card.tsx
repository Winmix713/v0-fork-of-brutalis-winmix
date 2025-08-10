"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, BarChart3, TrendingUp, Users, RefreshCw, Info } from "lucide-react"
import { useEnsembleWeight, calculateModelDisagreement, getDisagreementLevel } from "@/hooks/use-ensemble-weight"
import { formatMatchDate } from "@/lib/date-utils"

interface PredictionCardProps {
  homeTeam: string
  awayTeam: string
  matchDate?: string
  className?: string
}

interface PredictionResponse {
  model_version: string
  features: {
    home: any
    away: any
    h2h_summary: any
  }
  predictions: {
    form: any
    h2h: any
    ensemble: any
  }
  confidence: number
  meta: {
    home_team: string
    away_team: string
    match_date: string
    generated_at: string
    cache_hit: boolean
    generation_time_ms: number
    data_quality: {
      home_matches: number
      away_matches: number
      h2h_matches: number
    }
  }
}

export default function EnhancedPredictionCard({ homeTeam, awayTeam, matchDate, className = "" }: PredictionCardProps) {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<"form" | "h2h" | "ensemble">("ensemble")

  const { weights, updateFormWeight, blendPredictions, getWeightDescription, getConfidenceAdjustment, isDefault } =
    useEnsembleWeight()

  const fetchPrediction = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        home_team: homeTeam,
        away_team: awayTeam,
        ...(matchDate && { match_date: matchDate }),
      })

      const response = await fetch(`/api/enhanced-prediction?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPrediction(data)
    } catch (err) {
      console.error("Prediction fetch error:", err)
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (homeTeam && awayTeam) {
      fetchPrediction()
    }
  }, [homeTeam, awayTeam, matchDate])

  // Calculate real-time ensemble prediction based on slider
  const realtimeEnsemble = prediction ? blendPredictions(prediction.predictions.form, prediction.predictions.h2h) : null

  // Calculate model disagreement
  const disagreement = prediction
    ? calculateModelDisagreement(prediction.predictions.form, prediction.predictions.h2h)
    : 0

  const disagreementInfo = getDisagreementLevel(disagreement)

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Predikció betöltése...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`w-full border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-red-700">Hiba történt</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <Button onClick={fetchPrediction} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Újrapróbálás
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!prediction) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Nincs elérhető predikció</div>
        </CardContent>
      </Card>
    )
  }

  const currentPrediction =
    selectedModel === "ensemble"
      ? realtimeEnsemble || prediction.predictions.ensemble
      : prediction.predictions[selectedModel]

  const adjustedConfidence = prediction.confidence + getConfidenceAdjustment()

  return (
    <TooltipProvider>
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {homeTeam} vs {awayTeam}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {/* Cache indicator */}
              <Badge variant={prediction.meta.cache_hit ? "secondary" : "outline"}>
                {prediction.meta.cache_hit ? "Cache" : "Friss"}
              </Badge>

              {/* Model disagreement warning */}
              {disagreementInfo.level === "high" && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="destructive" className="cursor-help">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Konfliktus
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{disagreementInfo.description}</p>
                    <p className="text-xs mt-1">Eltérés: {Math.round(disagreement * 100)}%</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {matchDate && <p className="text-sm text-gray-600">{formatMatchDate(matchDate)}</p>}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Model Selection */}
          <div className="flex space-x-2">
            <Button
              variant={selectedModel === "form" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModel("form")}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Forma
            </Button>
            <Button
              variant={selectedModel === "h2h" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModel("h2h")}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-1" />
              H2H
            </Button>
            <Button
              variant={selectedModel === "ensemble" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedModel("ensemble")}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Ensemble
            </Button>
          </div>

          {/* Ensemble Weight Slider */}
          {selectedModel === "ensemble" && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ensemble súlyozás</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Állítsd be, hogy mennyire bízz a forma vs H2H modellekben</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Slider
                value={[weights.form]}
                onValueChange={([value]) => updateFormWeight(value)}
                max={1}
                min={0}
                step={0.05}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-gray-600">
                <span>H2H ({Math.round(weights.h2h * 100)}%)</span>
                <span className="font-medium">{getWeightDescription()}</span>
                <span>Forma ({Math.round(weights.form * 100)}%)</span>
              </div>

              {!isDefault && (
                <Button variant="ghost" size="sm" onClick={() => updateFormWeight(0.6)} className="w-full text-xs">
                  Alapértelmezett visszaállítása
                </Button>
              )}
            </div>
          )}

          {/* Main Predictions */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(currentPrediction.home * 100)}%</div>
              <div className="text-sm text-gray-600">{homeTeam}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{Math.round(currentPrediction.draw * 100)}%</div>
              <div className="text-sm text-gray-600">Döntetlen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{Math.round(currentPrediction.away * 100)}%</div>
              <div className="text-sm text-gray-600">{awayTeam}</div>
            </div>
          </div>

          {/* Additional Predictions */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{Math.round(currentPrediction.btts * 100)}%</div>
              <div className="text-sm text-gray-600">BTTS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{Math.round(currentPrediction.over_25 * 100)}%</div>
              <div className="text-sm text-gray-600">Over 2.5</div>
            </div>
          </div>

          {/* Expected Goals */}
          {currentPrediction.expected_goals && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {currentPrediction.expected_goals.home.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">xG {homeTeam}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {currentPrediction.expected_goals.away.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">xG {awayTeam}</div>
              </div>
            </div>
          )}

          {/* Confidence and Quality Indicators */}
          <div className="flex items-center justify-between pt-4 border-t text-sm">
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline">Megbízhatóság: {Math.round(adjustedConfidence * 100)}%</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modell megbízhatósága a rendelkezésre álló adatok alapján</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary">
                    {prediction.meta.data_quality.home_matches + prediction.meta.data_quality.away_matches} meccs
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p>
                      {homeTeam}: {prediction.meta.data_quality.home_matches} meccs
                    </p>
                    <p>
                      {awayTeam}: {prediction.meta.data_quality.away_matches} meccs
                    </p>
                    <p>H2H: {prediction.meta.data_quality.h2h_matches} meccs</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="text-xs text-gray-500">
              {prediction.meta.generation_time_ms}ms • {prediction.model_version}
            </div>
          </div>

          {/* Model Disagreement Warning */}
          {disagreementInfo.level !== "low" && (
            <div
              className={`p-3 rounded-lg border ${
                disagreementInfo.level === "high" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`h-4 w-4 ${disagreementInfo.color}`} />
                <span className={`text-sm font-medium ${disagreementInfo.color}`}>{disagreementInfo.description}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                A forma és H2H modellek jelentősen eltérő eredményeket adnak. Érdemes óvatosan kezelni ezt a predikciót.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
