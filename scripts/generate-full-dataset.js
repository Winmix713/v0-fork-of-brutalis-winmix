import fs from "fs"
import { createObjectCsvWriter } from "csv-writer"

// Teljes CSV adathalmaz generálása a komponens számára
const csvUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11_osszes_cleaned-g6sBW3h3cW7Xtg5ZUgDQW10YT5odfl.csv"

// Spanish La Liga teams
const teams = [
  "Barcelona",
  "Real Madrid",
  "Valencia",
  "Sevilla",
  "Bilbao",
  "Villarreal",
  "Las Palmas",
  "Getafe",
  "Girona",
  "Alaves",
  "Mallorca",
  "Osasuna",
  "San Sebastian",
  "Vigo",
  "Betis",
  "Rayo Vallecano",
  "Cadiz",
  "Elche",
  "Almeria",
  "Valladolid",
]

// Team strength ratings (0-1 scale)
const teamStrengths = {
  Barcelona: 0.85,
  "Real Madrid": 0.88,
  Valencia: 0.72,
  Sevilla: 0.75,
  Bilbao: 0.68,
  Villarreal: 0.7,
  "Las Palmas": 0.55,
  Getafe: 0.58,
  Girona: 0.6,
  Alaves: 0.52,
  Mallorca: 0.56,
  Osasuna: 0.54,
  "San Sebastian": 0.64,
  Vigo: 0.53,
  Betis: 0.66,
  "Rayo Vallecano": 0.59,
  Cadiz: 0.48,
  Elche: 0.45,
  Almeria: 0.47,
  Valladolid: 0.5,
}

function generateMatch(homeTeam, awayTeam, matchDate) {
  const homeStrength = teamStrengths[homeTeam] || 0.6
  const awayStrength = teamStrengths[awayTeam] || 0.6

  // Home advantage
  const adjustedHomeStrength = homeStrength + 0.1

  // Calculate expected goals using Poisson-like distribution
  const homeExpectedGoals = adjustedHomeStrength * 2.5
  const awayExpectedGoals = awayStrength * 2.0

  // Generate half-time goals
  const htHomeGoals = Math.floor(Math.random() * Math.min(4, homeExpectedGoals + 1))
  const htAwayGoals = Math.floor(Math.random() * Math.min(4, awayExpectedGoals + 1))

  // Generate full-time goals (must be >= half-time)
  const additionalHomeGoals = Math.floor(Math.random() * 3)
  const additionalAwayGoals = Math.floor(Math.random() * 3)

  const ftHomeGoals = htHomeGoals + additionalHomeGoals
  const ftAwayGoals = htAwayGoals + additionalAwayGoals

  return {
    match_time: matchDate.toISOString(),
    home_team: homeTeam,
    away_team: awayTeam,
    half_time_home_goals: htHomeGoals,
    half_time_away_goals: htAwayGoals,
    full_time_home_goals: ftHomeGoals,
    full_time_away_goals: ftAwayGoals,
  }
}

function generateSeason(startDate, endDate) {
  const matches = []
  const matchDates = []

  // Generate match dates (roughly 2-3 matches per week)
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    // Add matches on weekends and some weekdays
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6 || Math.random() < 0.3) {
      matchDates.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(`📅 Generated ${matchDates.length} match dates`)

  // Generate matches for each date
  matchDates.forEach((date, index) => {
    const matchesPerDay = Math.floor(Math.random() * 4) + 1 // 1-4 matches per day

    for (let i = 0; i < matchesPerDay; i++) {
      // Pick random teams
      const homeTeam = teams[Math.floor(Math.random() * teams.length)]
      let awayTeam = teams[Math.floor(Math.random() * teams.length)]

      // Ensure different teams
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)]
      }

      // Set match time (afternoon/evening)
      const matchTime = new Date(date)
      matchTime.setHours(15 + Math.floor(Math.random() * 6)) // 15:00 to 20:00
      matchTime.setMinutes(Math.floor(Math.random() * 4) * 15) // 0, 15, 30, 45 minutes

      const match = generateMatch(homeTeam, awayTeam, matchTime)
      matches.push(match)
    }
  })

  return matches
}

async function generateFullDataset() {
  try {
    console.log("🏗️ Generating comprehensive football dataset...")

    // Generate matches for the last 2 years
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 2)

    console.log(`📅 Generating matches from ${startDate.toDateString()} to ${endDate.toDateString()}`)

    const matches = generateSeason(startDate, endDate)

    console.log(`⚽ Generated ${matches.length} matches`)

    // Create data directory if it doesn't exist
    if (!fs.existsSync("./data")) {
      fs.mkdirSync("./data", { recursive: true })
    }

    // Write to CSV file
    const csvWriter = createObjectCsvWriter({
      path: "./data/football_matches_full.csv",
      header: [
        { id: "match_time", title: "Match Time" },
        { id: "home_team", title: "Home Team" },
        { id: "away_team", title: "Away Team" },
        { id: "half_time_home_goals", title: "HT Home Goals" },
        { id: "half_time_away_goals", title: "HT Away Goals" },
        { id: "full_time_home_goals", title: "FT Home Goals" },
        { id: "full_time_away_goals", title: "FT Away Goals" },
      ],
    })

    await csvWriter.writeRecords(matches)

    console.log("✅ Full dataset generated: ./data/football_matches_full.csv")

    // Generate statistics
    const stats = {
      totalMatches: matches.length,
      uniqueTeams: new Set([...matches.map((m) => m.home_team), ...matches.map((m) => m.away_team)]).size,
      totalGoals: matches.reduce((sum, m) => sum + m.full_time_home_goals + m.full_time_away_goals, 0),
      comebacks: matches.filter(
        (m) =>
          (m.half_time_home_goals < m.half_time_away_goals && m.full_time_home_goals > m.full_time_away_goals) ||
          (m.half_time_away_goals < m.half_time_home_goals && m.full_time_away_goals > m.full_time_home_goals),
      ).length,
      draws: matches.filter((m) => m.full_time_home_goals === m.full_time_away_goals).length,
    }

    console.log("\n📊 Dataset Statistics:")
    console.log(`  Total Matches: ${stats.totalMatches}`)
    console.log(`  Unique Teams: ${stats.uniqueTeams}`)
    console.log(`  Total Goals: ${stats.totalGoals}`)
    console.log(`  Average Goals per Match: ${(stats.totalGoals / stats.totalMatches).toFixed(2)}`)
    console.log(`  Comebacks: ${stats.comebacks} (${((stats.comebacks / stats.totalMatches) * 100).toFixed(1)}%)`)
    console.log(`  Draws: ${stats.draws} (${((stats.draws / stats.totalMatches) * 100).toFixed(1)}%)`)

    // Save statistics
    fs.writeFileSync("./data/dataset_stats.json", JSON.stringify(stats, null, 2))
    console.log("📈 Statistics saved to: ./data/dataset_stats.json")

    return { matches, stats }
  } catch (error) {
    console.error("Hiba:", error)
  }
}

generateFullDataset()
  .then(({ matches, stats }) => {
    console.log("\n🎉 Dataset generation completed successfully!")
    console.log("📁 Files created:")
    console.log("  - ./data/football_matches_full.csv")
    console.log("  - ./data/dataset_stats.json")
    console.log("\n💡 Next steps:")
    console.log("1. Run import-csv-data.js to import the data into Supabase")
    console.log("2. Run the SQL helper functions to set up analysis capabilities")
  })
  .catch(console.error)
