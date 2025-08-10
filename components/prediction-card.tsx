"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Target, Zap, AlertCircle, CheckCircle2, Clock, Trophy, Activity } from "lucide-react"
import { getRealMatchesData } from "@/lib/real-matches-data"
import { calculateStatistics } from "@/lib/football-statistics"
import type { Match } from "@/lib/supabase"

interface PredictionResult {
  homeWinProbability: number
  drawProbability: number
  awayWinProbability: number
  bothTeamsToScoreProb: number
  over25Probability: number
  expectedGoals: {
    home: number
    away: number
  }
  confidence: number
  dataQuality: {
    totalMatches: number
    h2hMatches: number
    recentMatches: number
  }
}

interface PredictionCardProps {
  homeTeam: string
  awayTeam: string
}

export default function PredictionCard({ homeTeam, awayTeam }: PredictionCardProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (homeTeam && awayTeam) {
      calculateRealPrediction()
    }
  }, [homeTeam, awayTeam])

  const calculateRealPrediction = async () => {
    setLoading(true)
    setError(null)

    try {
      // Valós adatok lekérdezése
      const allMatches = await getRealMatchesData(undefined, undefined, 500)
      const h2hMatches = await getRealMatchesData(homeTeam, awayTeam, 20)
      const homeTeamMatches = await getRealMatchesData(homeTeam, undefined, 50)
      const awayTeamMatches = await getRealMatchesData(awayTeam, undefined, 50)

      if (allMatches.length === 0) {
        throw new Error("Nincs elegendő adat a predikció számításához")
      }

      // Statisztikák számítása valós adatokból
      const stats = calculateStatistics(allMatches, homeTeam, awayTeam)

      // Predikció számítása
      const predictionResult = calculateAdvancedPrediction(
        allMatches,
        h2hMatches,
        homeTeamMatches,
        awayTeamMatches,
        homeTeam,
        awayTeam,
      )

      setPrediction(predictionResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba")
    } finally {
      setLoading(false)
    }
  }

  const calculateAdvancedPrediction = (
    allMatches: Match[],
    h2hMatches: Match[],
    homeMatches: Match[],
    awayMatches: Match[],
    homeTeam: string,
    awayTeam: string,
  ): PredictionResult => {
    // Alapstatisztikák
    const homeStats = calculateTeamStats(homeMatches, homeTeam)
    const awayStats = calculateTeamStats(awayMatches, awayTeam)
    const h2hStats = calculateH2HStats(h2hMatches, homeTeam, awayTeam)

    // Várható gólok számítása
    const homeExpectedGoals = Math.max(0.1, homeStats.avgGoalsScored * 1.1) // Hazai előny
    const awayExpectedGoals = Math.max(0.1, awayStats.avgGoalsScored * 0.9) // Idegen hátrány

    // Győzelmi valószínűségek (Poisson alapú)
    const totalExpected = homeExpectedGoals + awayExpectedGoals
    let homeWinProb = homeExpectedGoals / totalExpected
    let awayWinProb = awayExpectedGoals / totalExpected
    let drawProb = Math.max(0.15, 1 - (homeWinProb + awayWinProb))

    // Normalizálás
    const total = homeWinProb + drawProb + awayWinProb
    homeWinProb = homeWinProb / total
    drawProb = drawProb / total
    awayWinProb = awayWinProb / total

    // H2H kiigazítás
    if (h2hMatches.length >= 3) {
      const h2hHomeWinRate = h2hStats.homeWins / h2hMatches.length
      const h2hAwayWinRate = h2hStats.awayWins / h2hMatches.length

      homeWinProb = homeWinProb * 0.7 + h2hHomeWinRate * 0.3
      awayWinProb = awayWinProb * 0.7 + h2hAwayWinRate * 0.3
      drawProb = 1 - (homeWinProb + awayWinProb)
    }

    // BTTS valószínűség
    const homeBTTSRate = homeStats.bttsRate
    const awayBTTSRate = awayStats.bttsRate
    const bothTeamsToScoreProb = (homeBTTSRate + awayBTTSRate) / 2

    // Over 2.5 valószínűség
    const homeOver25Rate = homeStats.over25Rate
    const awayOver25Rate = awayStats.over25Rate
    const over25Probability = (homeOver25Rate + awayOver25Rate) / 2

    // Confidence számítása
    const confidence = calculateConfidence(allMatches.length, h2hMatches.length, homeMatches.length, awayMatches.length)

    return {
      homeWinProbability: Math.round(homeWinProb * 100) / 100,
      drawProbability: Math.round(drawProb * 100) / 100,
      awayWinProbability: Math.round(awayWinProb * 100) / 100,
      bothTeamsToScoreProb: Math.round(bothTeamsToScoreProb * 100) / 100,
      over25Probability: Math.round(over25Probability * 100) / 100,
      expectedGoals: {
        home: Math.round(homeExpectedGoals * 100) / 100,
        away: Math.round(awayExpectedGoals * 100) / 100,
      },
      confidence: Math.round(confidence * 100) / 100,
      dataQuality: {
        totalMatches: allMatches.length,
        h2hMatches: h2hMatches.length,
        recentMatches: Math.min(homeMatches.length, awayMatches.length),
      },
    }
  }

  const calculateTeamStats = (matches: Match[], teamName: string) => {
    if (matches.length === 0) {
      return {
        avgGoalsScored: 1.0,
        avgGoalsConceded: 1.0,
        bttsRate: 0.5,
        over25Rate: 0.5,
        formIndex: 0.5,
      }
    }

    let goalsScored = 0
    let goalsConceded = 0
    let bttsCount = 0
    let over25Count = 0
    let points = 0

    matches.forEach((match) => {
      const isHome = match.home_team.toLowerCase().includes(teamName.toLowerCase())
      const teamGoals = isHome ? match.full_time_home_goals : match.full_time_away_goals
      const opponentGoals = isHome ? match.full_time_away_goals : match.full_time_home_goals

      goalsScored += teamGoals
      goalsConceded += opponentGoals

      if (match.full_time_home_goals > 0 && match.full_time_away_goals > 0) bttsCount++
      if (match.full_time_home_goals + match.full_time_away_goals > 2.5) over25Count++

      if (teamGoals > opponentGoals) points += 3
      else if (teamGoals === opponentGoals) points += 1
    })

    return {
      avgGoalsScored: goalsScored / matches.length,
      avgGoalsConceded: goalsConceded / matches.length,
      bttsRate: bttsCount / matches.length,
      over25Rate: over25Count / matches.length,
      formIndex: points / (matches.length * 3),
    }
  }

  const calculateH2HStats = (matches: Match[], homeTeam: string, awayTeam: string) => {
    let homeWins = 0
    let awayWins = 0
    let draws = 0

    matches.forEach((match) => {
      const isHomeTeamHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase())
      const homeGoals = match.full_time_home_goals
      const awayGoals = match.full_time_away_goals

      if (homeGoals > awayGoals) {
        if (isHomeTeamHome) homeWins++
        else awayWins++
      } else if (homeGoals < awayGoals) {
        if (isHomeTeamHome) awayWins++
        else homeWins++
      } else {
        draws++
      }
    })

    return { homeWins, awayWins, draws }
  }

  const calculateConfidence = (totalMatches: number, h2hMatches: number, homeMatches: number, awayMatches: number) => {
    let confidence = 0.3 // Alapérték

    // Adatok mennyisége alapján
    confidence += Math.min(0.3, totalMatches / 1000)
    confidence += Math.min(0.2, h2hMatches / 10)
    confidence += Math.min(0.2, Math.min(homeMatches, awayMatches) / 50)

    return Math.min(0.95, confidence)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500"
    if (confidence >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Magas"
    if (confidence >= 0.6) return "Közepes"
    return "Alacsony"
  }

  if (loading) {
    return (
      <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">AI Predikció számítása</h3>
            <p className="text-slate-600 text-sm">Valós adatok elemzése folyamatban...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl shadow-sm border-0 bg-red-50/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Predikció hiba</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!prediction) {
    return null
  }

  return (
    <Card className="rounded-3xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Brain className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">AI Predikciók</h3>
              <p className="text-sm text-slate-600">Valós adatok alapján számítva</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${getConfidenceColor(prediction.confidence)} text-white`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {getConfidenceText(prediction.confidence)} ({Math.round(prediction.confidence * 100)}%)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Adatminőség */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Adatminőség</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-600">Összes meccs</div>
              <div className="font-bold text-blue-800">{prediction.dataQuality.totalMatches}</div>
            </div>
            <div>
              <div className="text-blue-600">H2H meccsek</div>
              <div className="font-bold text-blue-800">{prediction.dataQuality.h2hMatches}</div>
            </div>
            <div>
              <div className="text-blue-600">Legutóbbi</div>
              <div className="font-bold text-blue-800">{prediction.dataQuality.recentMatches}</div>
            </div>
          </div>
        </div>

        {/* Mérkőzés kimenetel valószínűségek */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Mérkőzés kimenetel
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">Hazai győzelem</span>
                <span className="text-sm font-bold text-green-800">
                  {Math.round(prediction.homeWinProbability * 100)}%
                </span>
              </div>
              <Progress value={prediction.homeWinProbability * 100} className="h-3 bg-slate-200">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${prediction.homeWinProbability * 100}%` }}
                />
              </Progress>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Döntetlen</span>
                <span className="text-sm font-bold text-slate-800">
                  {Math.round(prediction.drawProbability * 100)}%
                </span>
              </div>
              <Progress value={prediction.drawProbability * 100} className="h-3 bg-slate-200">
                <div
                  className="h-full bg-slate-500 rounded-full transition-all"
                  style={{ width: `${prediction.drawProbability * 100}%` }}
                />
              </Progress>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-700">Vendég győzelem</span>
                <span className="text-sm font-bold text-red-800">
                  {Math.round(prediction.awayWinProbability * 100)}%
                </span>
              </div>
              <Progress value={prediction.awayWinProbability * 100} className="h-3 bg-slate-200">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${prediction.awayWinProbability * 100}%` }}
                />
              </Progress>
            </div>
          </div>
        </div>

        {/* Expected Goals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Várható gólok (H)</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">{prediction.expectedGoals.home}</div>
          </div>

          <div className="bg-red-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Várható gólok (V)</span>
            </div>
            <div className="text-2xl font-bold text-red-800">{prediction.expectedGoals.away}</div>
          </div>
        </div>

        {/* Gól predikciók */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Mindkét csapat gólja</span>
            </div>
            <div className="text-2xl font-bold text-purple-800">
              {Math.round(prediction.bothTeamsToScoreProb * 100)}%
            </div>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Over 2.5 gól</span>
            </div>
            <div className="text-2xl font-bold text-orange-800">{Math.round(prediction.over25Probability * 100)}%</div>
          </div>
        </div>

        {/* Meta információk */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Frissítve: {new Date().toLocaleString("hu-HU")}</span>
            </div>
            <div>🚀 Valós adatok alapján</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
