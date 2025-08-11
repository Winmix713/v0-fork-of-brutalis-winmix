import { parse } from "csv-parse/sync"
import { readFileSync } from "fs"
import path from "path"

async function debugCsvHeaders(filePath) {
  try {
    const csvFilePath = path.resolve(process.cwd(), filePath)
    console.log(`Reading CSV from: ${csvFilePath} to debug headers.`)

    const fileContent = readFileSync(csvFilePath, "utf8")

    // Parse only the first row to get headers
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      to_line: 1, // Only read up to the first line
      trim: true,
    })

    if (records.length === 0) {
      console.log("CSV file is empty or has no headers.")
      return
    }

    const headers = Object.keys(records[0])
    console.log("\n--- Detected CSV Headers ---")
    headers.forEach((header, index) => {
      console.log(`Header ${index + 1}: '${header}'`)
    })
    console.log("----------------------------")
    console.log("Ensure these headers match your database column names exactly (case-sensitive if applicable).")
  } catch (err) {
    console.error("Failed to debug CSV headers:", err.message)
  }
}

// Example usage:
// debugCsvHeaders("data/ujak_11.csv"); // Adjust path as needed

// For the purpose of v0 execution, we'll simulate fetching the CSV from the provided URL.
async function runDebugHeadersFromUrl(url) {
  try {
    console.log(`Fetching CSV data from URL for header debugging: ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const csvContent = await response.text()

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      to_line: 1,
      trim: true,
    })

    if (records.length === 0) {
      console.log("CSV file is empty or has no headers.")
      return
    }

    const headers = Object.keys(records[0])
    console.log("\n--- Detected CSV Headers ---")
    headers.forEach((header, index) => {
      console.log(`Header ${index + 1}: '${header}'`)
    })
    console.log("----------------------------")
    console.log("Ensure these headers match your database column names exactly (case-sensitive if applicable).")
  } catch (err) {
    console.error("Failed to debug CSV headers from URL:", err.message)
  }
}

runDebugHeadersFromUrl(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ujak_11-oJ2ZxC4pxxk6lFP8KcD2qGtbzg6UPI.csv",
)
