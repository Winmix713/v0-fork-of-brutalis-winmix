"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

// Virtual team data with logos, sorted alphabetically by name
const virtualTeams: { name: string; logo: string; alt: string }[] = [
  { name: "Alaves", logo: "/images/team-logos/alaves.png", alt: "Alaves logo" },
  { name: "Barcelona", logo: "/images/team-logos/barcelona.png", alt: "Barcelona logo" },
  { name: "Bilbao", logo: "/images/team-logos/bilbao.png", alt: "Bilbao logo" },
  { name: "Getafe", logo: "/images/team-logos/getafe.png", alt: "Getafe logo" },
  { name: "Girona", logo: "/images/team-logos/girona.png", alt: "Girona logo" },
  { name: "Las Palmas", logo: "/images/team-logos/las-palmas.png", alt: "Las Palmas logo" },
  { name: "Madrid Fehér", logo: "/images/team-logos/madrid-feher.png", alt: "Madrid Fehér logo" },
  { name: "Madrid Piros", logo: "/images/team-logos/madrid-piros.png", alt: "Madrid Piros logo" },
  { name: "Mallorca", logo: "/images/team-logos/mallorca.png", alt: "Mallorca logo" },
  { name: "Osasuna", logo: "/images/team-logos/osasuna.png", alt: "Osasuna logo" },
  { name: "San Sebastian", logo: "/images/team-logos/san-sebastian.png", alt: "San Sebastian logo" },
  { name: "Sevilla Piros", logo: "/images/team-logos/sevilla-piros.png", alt: "Sevilla Piros logo" },
  { name: "Sevilla Zöld", logo: "/images/team-logos/sevilla-zold.png", alt: "Sevilla Zöld logo" },
  { name: "Valencia", logo: "/images/team-logos/valencia.png", alt: "Valencia logo" },
  { name: "Vigo", logo: "/images/team-logos/vigo.png", alt: "Vigo logo" },
  { name: "Villarreal", logo: "/images/team-logos/villarreal.png", alt: "Villarreal logo" },
].sort((a, b) => a.name.localeCompare(b.name))

interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string // ISO string date-time
  full_time_home_goals: number
  full_time_away_goals: number
  league: string
}

interface MatchesListProps {
  initialMatches?: Match[]
}

export default function MatchesList({ initialMatches = [] }: MatchesListProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [homeTeam, setHomeTeam] = useState<string>("")
  const [awayTeam, setAwayTeam] = useState<string>("")
  const [matchDate, setMatchDate] = useState<string>("") // Format YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState<string>("")

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real application, you'd fetch from your Next.js API route here
      // For demonstration, we'll use a mock or preloaded data
      // const response = await fetch('/api/matches');
      // if (!response.ok) throw new Error('Failed to fetch matches');
      // const data = await response.json();
      // setMatches(data);

      if (initialMatches.length === 0) {
        setMatches([
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
        ])
      } else {
        setMatches(initialMatches)
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch matches.")
      console.error("Error fetching matches:", err)
    } finally {
      setLoading(false)
    }
  }, [initialMatches])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const filteredMatches = useMemo(() => {
    let currentMatches = matches

    if (homeTeam) {
      currentMatches = currentMatches.filter((match) => match.home_team === homeTeam)
    }
    if (awayTeam) {
      currentMatches = currentMatches.filter((match) => match.away_team === awayTeam)
    }
    if (matchDate) {
      currentMatches = currentMatches.filter((match) => match.match_time.startsWith(matchDate))
    }
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      currentMatches = currentMatches.filter(
        (match) =>
          match.home_team.toLowerCase().includes(lowerCaseQuery) ||
          match.away_team.toLowerCase().includes(lowerCaseQuery) ||
          match.league.toLowerCase().includes(lowerCaseQuery),
      )
    }
    return currentMatches
  }, [matches, homeTeam, awayTeam, matchDate, searchQuery])

  const handleResetFilters = () => {
    setHomeTeam("")
    setAwayTeam("")
    setMatchDate("")
    setSearchQuery("")
    setError(null)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto">
      <Card className="w-full md:w-1/3 lg:w-1/4 sticky top-6 self-start">
        <CardHeader>
          <CardTitle className="text-xl">
            <SearchIcon className="inline-block mr-2 h-5 w-5" />
            {"Mérkőzések keresése"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="home-team">{"Hazai csapat"}</Label>
            <Select onValueChange={setHomeTeam} value={homeTeam}>
              <SelectTrigger id="home-team">
                <SelectValue placeholder="Válassz hazai csapatot" />
              </SelectTrigger>
              <SelectContent>
                {virtualTeams.map((team) => (
                  <SelectItem key={team.name} value={team.name}>
                    <div className="flex items-center gap-2">
                      <Image
                        src={team.logo || "/placeholder.svg"} // Helyi elérési út használata
                        alt={team.alt}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="away-team">{"Vendég csapat"}</Label>
            <Select onValueChange={setAwayTeam} value={awayTeam}>
              <SelectTrigger id="away-team">
                <SelectValue placeholder="Válassz vendég csapatot" />
              </SelectTrigger>
              <SelectContent>
                {virtualTeams.map((team) => (
                  <SelectItem key={team.name} value={team.name}>
                    <div className="flex items-center gap-2">
                      <Image
                        src={team.logo || "/placeholder.svg"} // Helyi elérési út használata
                        alt={team.alt}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="match-date">{"Dátum"}</Label>
            <Input
              id="match-date"
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              placeholder="ÉÉÉÉ-HH-NN"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="search">{"Általános keresés"}</Label>
            <Input
              id="search"
              type="text"
              placeholder="Mérkőzés, csapat vagy liga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleResetFilters}>
            {"Szűrők törlése"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex-1">
        {loading ? (
          <div className="grid gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-4 text-red-500">
              {"Hiba történt a mérkőzések betöltésekor: "}
              {error}
            </CardContent>
          </Card>
        ) : filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-gray-500">
              {"Nincs találat a megadott feltételek alapján."}
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="grid gap-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="w-full">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-lg">{match.league}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(match.match_time).toLocaleDateString("hu-HU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 items-center text-center gap-2">
                      <div className="font-medium text-right">{match.home_team}</div>
                      <div className="font-bold text-xl">
                        {match.full_time_home_goals} - {match.full_time_away_goals}
                      </div>
                      <div className="font-medium text-left">{match.away_team}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
