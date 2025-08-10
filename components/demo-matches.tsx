"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Calendar } from "lucide-react"

interface Match {
  id: number
  match_time: string
  home_team: string
  away_team: string
  half_time_home_goals: number
  half_time_away_goals: number
  full_time_home_goals: number
  full_time_away_goals: number
  created_at: string
}

interface FormattedMatch extends Match {
  formatted_result: string
}

export default function DemoMatches() {
  const [matches, setMatches] = useState<FormattedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const matchesPerPage = 10

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data for demonstration
      const mockMatches: FormattedMatch[] = [
        {
          id: 1,
          match_time: "2024-01-15T15:00:00Z",
          home_team: "Barcelona",
          away_team: "Real Madrid",
          half_time_home_goals: 1,
          half_time_away_goals: 0,
          full_time_home_goals: 2,
          full_time_away_goals: 1,
          created_at: "2024-01-15T17:00:00Z",
          formatted_result: "2-1",
        },
        {
          id: 2,
          match_time: "2024-01-14T18:30:00Z",
          home_team: "Valencia",
          away_team: "Sevilla",
          half_time_home_goals: 0,
          half_time_away_goals: 1,
          full_time_home_goals: 1,
          full_time_away_goals: 1,
          created_at: "2024-01-14T20:30:00Z",
          formatted_result: "1-1",
        },
        {
          id: 3,
          match_time: "2024-01-13T20:00:00Z",
          home_team: "Bilbao",
          away_team: "Villarreal",
          half_time_home_goals: 2,
          half_time_away_goals: 0,
          full_time_home_goals: 3,
          full_time_away_goals: 1,
          created_at: "2024-01-13T22:00:00Z",
          formatted_result: "3-1",
        },
        {
          id: 4,
          match_time: "2024-01-12T16:15:00Z",
          home_team: "Las Palmas",
          away_team: "Getafe",
          half_time_home_goals: 0,
          half_time_away_goals: 0,
          full_time_home_goals: 0,
          full_time_away_goals: 2,
          created_at: "2024-01-12T18:15:00Z",
          formatted_result: "0-2",
        },
        {
          id: 5,
          match_time: "2024-01-11T19:45:00Z",
          home_team: "Girona",
          away_team: "Alaves",
          half_time_home_goals: 1,
          half_time_away_goals: 1,
          full_time_home_goals: 2,
          full_time_away_goals: 2,
          created_at: "2024-01-11T21:45:00Z",
          formatted_result: "2-2",
        },
      ]

      setMatches(mockMatches)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch matches")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getResultBadgeColor = (homeGoals: number, awayGoals: number) => {
    if (homeGoals > awayGoals) return "bg-green-500"
    if (homeGoals < awayGoals) return "bg-red-500"
    return "bg-yellow-500"
  }

  const isComeback = (match: Match) => {
    const homeComeback =
      match.half_time_home_goals < match.half_time_away_goals && match.full_time_home_goals > match.full_time_away_goals
    const awayComeback =
      match.half_time_away_goals < match.half_time_home_goals && match.full_time_away_goals > match.full_time_home_goals
    return homeComeback || awayComeback
  }

  // Pagination
  const indexOfLastMatch = currentPage * matchesPerPage
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage
  const currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch)
  const totalPages = Math.ceil(matches.length / matchesPerPage)

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading matches...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={fetchMatches} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Recent Football Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMatches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formatDate(match.match_time)}</span>
                    </div>
                    {isComeback(match) && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Comeback
                      </Badge>
                    )}
                  </div>
                  <Badge
                    className={`${getResultBadgeColor(match.full_time_home_goals, match.full_time_away_goals)} text-white`}
                  >
                    {match.formatted_result}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{match.home_team}</div>
                      <div className="text-sm text-gray-500">Home</div>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-2xl font-bold">
                        {match.full_time_home_goals} - {match.full_time_away_goals}
                      </div>
                      <div className="text-xs text-gray-500">
                        HT: {match.half_time_home_goals}-{match.half_time_away_goals}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{match.away_team}</div>
                      <div className="text-sm text-gray-500">Away</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {indexOfFirstMatch + 1}-{Math.min(indexOfLastMatch, matches.length)} of {matches.length} matches
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
