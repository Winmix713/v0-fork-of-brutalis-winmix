"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { safeFormatDate } from "@/lib/date-utils"

interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string // ISO string date-time
  full_time_home_goals: number
  full_time_away_goals: number
  league: string
}

export default function DemoMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDemoMatches = async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real application, you'd fetch from your Next.js API route here
      // For demonstration, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      const mockMatches: Match[] = [
        {
          id: 1,
          home_team: "Barcelona",
          away_team: "Madrid Fehér",
          match_time: "2023-10-28T16:15:00Z",
          full_time_home_goals: 1,
          full_time_away_goals: 2,
          league: "La Liga",
        },
        {
          id: 2,
          home_team: "Sevilla Piros",
          away_team: "Valencia",
          match_time: "2023-10-29T18:30:00Z",
          full_time_home_goals: 1,
          full_time_away_goals: 1,
          league: "La Liga",
        },
        {
          id: 3,
          home_team: "Bilbao",
          away_team: "Osasuna",
          match_time: "2023-11-04T14:00:00Z",
          full_time_home_goals: 2,
          full_time_away_goals: 0,
          league: "La Liga",
        },
        {
          id: 4,
          home_team: "Villarreal",
          away_team: "Girona",
          match_time: "2023-11-05T16:15:00Z",
          full_time_home_goals: 0,
          full_time_away_goals: 0,
          league: "La Liga",
        },
        {
          id: 5,
          home_team: "Madrid Piros",
          away_team: "Alaves",
          match_time: "2023-11-05T21:00:00Z",
          full_time_home_goals: 3,
          full_time_away_goals: 1,
          league: "La Liga",
        },
      ]
      setMatches(mockMatches)
    } catch (err: any) {
      setError(err.message || "Ismeretlen hiba történt a demo mérkőzések betöltésekor.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDemoMatches()
  }, [])

  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Demo Mérkőzések</CardTitle>
        <Button onClick={fetchDemoMatches} disabled={loading} variant="ghost" size="icon">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-600">Mérkőzések betöltése...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center p-4">
            <p className="font-semibold">Hiba:</p>
            <p>{error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-gray-500 text-center p-4">Nincs megjeleníthető demo mérkőzés.</div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600 min-w-[120px]">{safeFormatDate(match.match_time)}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{match.home_team}</span>
                    <span className="text-slate-600">vs</span>
                    <span className="font-medium">{match.away_team}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {match.full_time_home_goals} - {match.full_time_away_goals}
                    </div>
                    <div className="text-sm text-slate-600">FT</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
