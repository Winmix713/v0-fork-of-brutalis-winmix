"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Users, Target, Loader2 } from "lucide-react"
import { searchMatches, getTeamNames, searchMatchesByTeam } from "@/lib/matches"
import { calculateStatistics } from "@/lib/football-statistics"
import { safeFormatDate } from "@/lib/date-utils"
import type { Match } from "@/lib/supabase"
import type { StatisticsResult } from "@/lib/football-statistics"
import MiniStatsGrid from "./mini-stats-grid"
import GeneralStatisticsCard from "./general-statistics-card"
import TeamAnalysisCard from "./team-analysis-card"
import AIPredictionsCard from "./ai-predictions-card"
import EnhancedPredictionCard from "./enhanced-prediction-card"
import EnhancedLegendModeCard from "./enhanced-legend-mode-card"

export default function MatchesList() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [statistics, setStatistics] = useState<StatisticsResult | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Csapat nevek betöltése
  useEffect(() => {
    const loadTeamNames = async () => {
      try {
        const names = await getTeamNames()
        setTeamNames(names)
      } catch (err) {
        console.error("Hiba a csapat nevek betöltése során:", err)
      }
    }
    loadTeamNames()
  }, [])

  // Keresés végrehajtása
  const handleSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      let searchResults: Match[] = []

      if (homeTeam.trim() || awayTeam.trim()) {
        // Specifikus csapat keresés
        searchResults = await searchMatches(homeTeam.trim() || undefined, awayTeam.trim() || undefined, 100)
      } else if (searchQuery.trim()) {
        // Általános keresés
        searchResults = await searchMatchesByTeam(searchQuery.trim(), 100)
      } else {
        // Ha nincs keresési feltétel, ne töltsünk be semmit
        searchResults = []
      }

      setMatches(searchResults)

      // Statisztikák számítása
      if (searchResults.length > 0) {
        const stats = calculateStatistics(searchResults, homeTeam.trim() || undefined, awayTeam.trim() || undefined)
        setStatistics(stats)
      } else {
        setStatistics(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt")
      setMatches([])
      setStatistics(null)
    } finally {
      setLoading(false)
    }
  }

  // Keresés törlése
  const handleClearSearch = () => {
    setHomeTeam("")
    setAwayTeam("")
    setSearchQuery("")
    setMatches([])
    setStatistics(null)
    setError(null)
  }

  // Csapat név szűrés autocomplete-hez
  const getFilteredTeamNames = (query: string) => {
    if (!query.trim()) return []
    return teamNames.filter((name) => name.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
  }

  return (
    <div className="space-y-8">
      {/* Keresési panel */}
      <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Meccsek keresése
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Csapat specifikus keresés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hazai csapat</label>
              <div className="relative">
                <Input
                  placeholder="pl. Barcelona"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="rounded-2xl"
                />
                {homeTeam && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {getFilteredTeamNames(homeTeam).map((name, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => setHomeTeam(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vendég csapat</label>
              <div className="relative">
                <Input
                  placeholder="pl. Real Madrid"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="rounded-2xl"
                />
                {awayTeam && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {getFilteredTeamNames(awayTeam).map((name, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => setAwayTeam(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Általános keresés */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vagy keresés csapat név alapján</label>
            <Input
              placeholder="Csapat neve..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl"
            />
          </div>

          {/* Keresési gombok */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="rounded-2xl">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Keresés...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Keresés
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClearSearch} className="rounded-2xl bg-transparent">
              Törlés
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hiba megjelenítése */}
      {error && (
        <Card className="rounded-3xl shadow-lg border-0 bg-red-50/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-red-600 text-center">
              <p className="font-semibold">Hiba történt:</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini statisztikák */}
      {statistics && <MiniStatsGrid statistics={statistics} />}

      {/* Statisztikai kártyák */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GeneralStatisticsCard statistics={statistics} />
          <TeamAnalysisCard statistics={statistics} />
          <AIPredictionsCard statistics={statistics} />
        </div>
      )}

      {/* Enhanced Predikciók és LEGEND MODE */}
      {homeTeam.trim() && awayTeam.trim() && (
        <div className="space-y-6">
          <EnhancedLegendModeCard homeTeam={homeTeam.trim()} awayTeam={awayTeam.trim()} />
          <EnhancedPredictionCard homeTeam={homeTeam.trim()} awayTeam={awayTeam.trim()} statistics={statistics} />
        </div>
      )}

      {/* Meccsek listája */}
      {matches.length > 0 && (
        <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Találatok ({matches.length} meccs)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      <div className="text-sm text-slate-600">
                        FT ({match.half_time_home_goals} - {match.half_time_away_goals} HT)
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {match.full_time_home_goals + match.full_time_away_goals} gól
                      </Badge>
                      {match.full_time_home_goals > 0 && match.full_time_away_goals > 0 && (
                        <Badge variant="default" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          BTTS
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Üres állapot */}
      {!loading && matches.length === 0 && !error && (homeTeam.trim() || awayTeam.trim() || searchQuery.trim()) && (
        <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Nincs találat</h3>
              <p className="text-slate-600">Próbálj meg más keresési feltételeket.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
