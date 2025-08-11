import fs from "fs"
import { parse } from "csv-parse/sync"
import { createClient } from "@supabase/supabase-js"
import path from "path"
import dotenv from "dotenv"

// Load environment variables
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

function normalizeMatchTime(rawValue, fallbackDate = "2023-01-01") {
  const raw = (rawValue || "").trim()
  if (!raw) return null

  const timeOnly = /^\d{1,2}:\d{2}$/.test(raw)
  const hasDate = /\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes("T")
  const hasTime = /:\d{2}/.test(raw)

  let candidate
  if (timeOnly) {
    candidate = `${fallbackDate} ${raw}:00`
  } else if (hasDate && !hasTime) {
    candidate = `${raw} 00:00:00`
  } else {
    candidate = raw
  }

  const d = new Date(candidate)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

async function importCsvData(filePath) {
  try {
    const csvFilePath = path.resolve(process.cwd(), filePath)
    console.log(`Attempting to read CSV from: ${csvFilePath}`)

    const fileContent = fs.readFileSync(csvFilePath, "utf8")

    const records = parse(fileContent, {
      columns: true, // Treat the first row as column headers
      skip_empty_lines: true,
      trim: true,
    })

    console.log(`Found ${records.length} records in CSV.`)

    const matchesToInsert = records
      .map((record) => {
        const isoMatchTime = normalizeMatchTime(record.match_time, record.match_date || "2023-01-01")

        return {
          match_time: isoMatchTime, // Convert to ISO string for TIMESTAMPTZ
          league: record.league || "Unknown League", // Default if not present
          home_team: record.home_team,
          away_team: record.away_team,
          full_time_home_goals: Number.parseInt(record.full_time_home_goals, 10) || 0,
          full_time_away_goals: Number.parseInt(record.full_time_away_goals, 10) || 0,
          half_time_home_goals: Number.parseInt(record.half_time_home_goals, 10) || 0,
          half_time_away_goals: Number.parseInt(record.half_time_away_goals, 10) || 0,
          // Add other fields as necessary, ensuring correct type conversion
          // For example, if you have 'home_shots' as string, convert it:
          // home_shots: parseInt(record.home_shots, 10) || 0,
        }
      })
      .filter((r) => r.match_time)

    console.log(`Inserting ${matchesToInsert.length} matches into 'matches' table...`)

    const { data, error } = await supabase.from("matches").insert(matchesToInsert)

    if (error) {
      console.error("Error inserting data:", error)
      throw new Error(error.message)
    }

    console.log("Data imported successfully:", data)
  } catch (err) {
    console.error("Failed to import CSV data:", err.message)
  }
}

async function runImportFromUrl(url) {
  try {
    console.log(`Fetching CSV data from URL: ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const csvContent = await response.text()

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    console.log(`Found ${records.length} records from URL.`)

    const matchesToInsert = records
      .map((record) => {
        const isoMatchTime = normalizeMatchTime(record.match_time, record.match_date || "2023-01-01")
        return {
          match_time: isoMatchTime,
          league: record.league || "Unknown League",
          home_team: record.home_team,
          away_team: record.away_team,
          full_time_home_goals: Number.parseInt(record.full_time_home_goals, 10) || 0,
          full_time_away_goals: Number.parseInt(record.full_time_away_goals, 10) || 0,
          half_time_home_goals: Number.parseInt(record.half_time_home_goals, 10) || 0,
          half_time_away_goals: Number.parseInt(record.half_time_away_goals, 10) || 0,
        }
      })
      .filter((r) => r.match_time)

    console.log(`Inserting ${matchesToInsert.length} matches into 'matches' table...`)

    const { data, error } = await supabase.from("matches").insert(matchesToInsert)

    if (error) {
      console.error("Error inserting data from URL:", error)
      throw new Error(error.message)
    }

    console.log("Data imported successfully from URL:", data)
  } catch (err) {
    console.error("Failed to import CSV data from URL:", err.message)
  }
}

// Call the function with the provided CSV URL
runImportFromUrl("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ujak_11-oJ2ZxC4pxxk6lFP8KcD2qGtbzg6UPI.csv")
