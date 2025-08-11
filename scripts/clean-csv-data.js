const fs = require("fs")
const path = require("path")
const { parse } = require("csv-parse/sync")
const { createObjectCsvWriter } = require("csv-writer")
const fetch = require("node-fetch")

// Configuration
const INPUT_CSV = path.join(__dirname, "..", "data", "football_matches.csv")
const OUTPUT_CSV = path.join(__dirname, "..", "data", "football_matches_cleaned.csv")
const OUTPUT_DIR = path.dirname(OUTPUT_CSV)

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function parseCSVLine(line) {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function cleanValue(value, columnType = "string") {
  if (!value || value.trim() === "") {
    return null
  }

  let cleaned = value.trim()

  // Remove quotes if they wrap the entire value
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }

  // Clean based on column type
  switch (columnType) {
    case "integer":
      const num = Number.parseInt(cleaned)
      return isNaN(num) ? null : num

    case "decimal":
      const dec = Number.parseFloat(cleaned)
      return isNaN(dec) ? null : dec

    case "date":
      // Try to parse various date formats
      if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleaned // Already in YYYY-MM-DD format
      }
      if (cleaned.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = cleaned.split("/")
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }
      return cleaned

    case "time":
      if (cleaned.match(/^\d{1,2}:\d{2}$/)) {
        const [hours, minutes] = cleaned.split(":")
        return `${hours.padStart(2, "0")}:${minutes}`
      }
      return cleaned

    default:
      // String cleaning
      cleaned = cleaned.replace(/\s+/g, " ") // Normalize whitespace
      cleaned = cleaned.replace(/[^\x20-\x7E]/g, "") // Remove non-printable characters
      return cleaned || null
  }
}

async function cleanCSVData(inputFilePath, outputFilePath) {
  try {
    const inputCsvPath = path.resolve(process.cwd(), inputFilePath)
    const outputCsvPath = path.resolve(process.cwd(), outputFilePath)
    console.log(`Reading CSV from: ${inputCsvPath}`)

    const fileContent = fs.readFileSync(inputCsvPath, "utf8")

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    console.log(`Found ${records.length} records.`)

    const cleanedRecords = records.map((record) => {
      // Example cleaning:
      // 1. Ensure match_time is in a valid format (e.g., add a default date)
      let cleanedMatchTime = record.match_time
      if (cleanedMatchTime && !cleanedMatchTime.includes("-")) {
        // If only time is present, prepend a default date
        cleanedMatchTime = `2023-01-01 ${cleanedMatchTime}:00` // Add seconds
      } else if (cleanedMatchTime && !cleanedMatchTime.includes(":")) {
        // If only date is present, append a default time
        cleanedMatchTime = `${cleanedMatchTime} 00:00:00`
      }
      // Convert to ISO string if it's a valid date/time
      try {
        cleanedMatchTime = new Date(cleanedMatchTime).toISOString()
      } catch (e) {
        console.warn(`Could not parse match_time '${record.match_time}', setting to null.`)
        cleanedMatchTime = null // Set to null if invalid
      }

      // 2. Convert goal fields to numbers, default to 0 if invalid
      const parseGoal = (value) => {
        const num = Number.parseInt(value, 10)
        return isNaN(num) ? 0 : num
      }

      return {
        ...record, // Keep all other fields
        match_time: cleanedMatchTime,
        full_time_home_goals: parseGoal(record.full_time_home_goals),
        full_time_away_goals: parseGoal(record.full_time_away_goals),
        half_time_home_goals: parseGoal(record.half_time_home_goals),
        half_time_away_goals: parseGoal(record.half_time_away_goals),
        // Add more cleaning rules as needed for other columns
      }
    })

    // Convert cleaned records back to CSV string
    const csvString = [
      Object.keys(cleanedRecords[0]).join(","), // Headers
      ...cleanedRecords.map((row) => Object.values(row).join(",")), // Data rows
    ].join("\n")

    fs.writeFileSync(outputCsvPath, csvString, "utf8")
    console.log(`Cleaned data written to: ${outputCsvPath}`)
  } catch (err) {
    console.error("Failed to clean CSV data:", err.message)
  }
}

// Example usage:
// cleanCsvData("data/input.csv", "data/output_cleaned.csv"); // Adjust paths as needed

// For the purpose of v0 execution, we'll simulate fetching the CSV from the provided URL.
async function runCleanFromUrl(url) {
  try {
    console.log(`Fetching CSV data from URL for cleaning: ${url}`)
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

    console.log(`Found ${records.length} records from URL for cleaning.`)

    const cleanedRecords = records.map((record) => {
      let cleanedMatchTime = record.match_time
      if (cleanedMatchTime && !cleanedMatchTime.includes("-")) {
        cleanedMatchTime = `2023-01-01 ${cleanedMatchTime}:00`
      } else if (cleanedMatchTime && !cleanedMatchTime.includes(":")) {
        cleanedMatchTime = `${cleanedMatchTime} 00:00:00`
      }
      try {
        cleanedMatchTime = new Date(cleanedMatchTime).toISOString()
      } catch (e) {
        console.warn(`Could not parse match_time '${record.match_time}', setting to null.`)
        cleanedMatchTime = null
      }

      const parseGoal = (value) => {
        const num = Number.parseInt(value, 10)
        return isNaN(num) ? 0 : num
      }

      return {
        ...record,
        match_time: cleanedMatchTime,
        full_time_home_goals: parseGoal(record.full_time_home_goals),
        full_time_away_goals: parseGoal(record.full_time_away_goals),
        half_time_home_goals: parseGoal(record.half_time_home_goals),
        half_time_away_goals: parseGoal(record.half_time_away_goals),
      }
    })

    console.log("Cleaned data (first 5 records):", cleanedRecords.slice(0, 5))
    console.log("Data cleaning process completed.")
  } catch (err) {
    console.error("Failed to clean CSV data from URL:", err.message)
  }
}

async function cleanCSV() {
  console.log("🧹 Starting CSV cleaning process...")

  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`❌ Input CSV file not found: ${INPUT_CSV}`)
    return
  }

  try {
    await cleanCSVData(INPUT_CSV, OUTPUT_CSV)
  } catch (error) {
    console.error("❌ Error cleaning CSV:", error.message)
    console.error("Stack trace:", error.stack)
  }
}

// Run cleaning
cleanCSV()
