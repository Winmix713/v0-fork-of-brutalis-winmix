import fs from "fs"
import { createObjectCsvWriter } from "csv-writer"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
})

// Teljes CSV adathalmaz generálása a komponens számára
const csvUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11_osszes_cleaned-g6sBW3h3cW7Xtg5ZUgDQW10YT5odfl.csv"

// Spanish La Liga teams
const teams = [
  "Barcelona",
  "Madrid Fehér",
  "Sevilla Piros",
  "Valencia",
  "Bilbao",
  "Osasuna",
  "Villarreal",
  "Girona",
  "Madrid Piros",
  "Alaves",
  "Mallorca",
  "Las Palmas",
  "Vigo",
  "Getafe",
  "San Sebastian",
  "Sevilla Zöld",
]

// Team strength ratings (0-1 scale)
const teamStrengths = {
  Barcelona: 0.85,
  "Madrid Fehér": 0.88,
  "Sevilla Piros": 0.72,
  Valencia: 0.75,
  Bilbao: 0.68,
  Osasuna: 0.7,
  Villarreal: 0.55,
  Girona: 0.58,
  "Madrid Piros": 0.6,
  Alaves: 0.52,
  Mallorca: 0.56,
  "Las Palmas": 0.54,
  "San Sebastian": 0.64,
  Vigo: 0.53,
  "Sevilla Zöld": 0.66,
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
          (m.half_time_home_goals < m.half_time_away_goals && m.full_time_home_goals > m.half_time_away_goals) ||
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

    // Insert matches into Supabase
    const leagues = ["La Liga", "Premier League", "Bundesliga", "Serie A", "Ligue 1"]
    const matchesToInsert = matches.map((match) => ({
      ...match,
      league: leagues[Math.floor(Math.random() * leagues.length)],
    }))

    const { data, error } = await supabase.from("matches").insert(matchesToInsert)

    if (error) {
      console.error("Error inserting generated data:", error)
      throw new Error(error.message)
    }

    console.log(`Successfully inserted ${data?.length || 0} mock matches into Supabase.`)

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
