import { parse } from "csv-parse/sync"
import { readFileSync } from "fs"
import path from "path"

async function analyzeCsv(filePath) {
  try {
    const csvFilePath = path.resolve(process.cwd(), filePath)
    console.log(`Analyzing CSV from: ${csvFilePath}`)

    const fileContent = readFileSync(csvFilePath, "utf8")

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    console.log(`Found ${records.length} records.`)

    if (records.length === 0) {
      console.log("CSV is empty.")
      return
    }

    const headers = Object.keys(records[0])
    console.log("\n--- CSV Headers ---")
    headers.forEach((header) => console.log(`- ${header}`))

    console.log("\n--- Sample Data (First 5 rows) ---")
    records.slice(0, 5).forEach((record, index) => {
      console.log(`Row ${index + 1}:`, record)
    })

    console.log("\n--- Data Types and Uniqueness (Sampled) ---")
    const analysis = {}

    headers.forEach((header) => {
      analysis[header] = { type: "unknown", uniqueValues: new Set(), hasNull: false }
    })

    records.forEach((record) => {
      headers.forEach((header) => {
        const value = record[header]
        if (value === null || value === undefined || value === "") {
          analysis[header].hasNull = true
        } else {
          analysis[header].uniqueValues.add(String(value))
          if (analysis[header].type === "unknown") {
            if (!isNaN(Number(value)) && !isNaN(Number.parseFloat(value))) {
              analysis[header].type = "number"
            } else if (new Date(value).toString() !== "Invalid Date" && !isNaN(new Date(value).getTime())) {
              analysis[header].type = "date/time"
            } else {
              analysis[header].type = "string"
            }
          }
        }
      })
    })

    headers.forEach((header) => {
      const colAnalysis = analysis[header]
      console.log(`\nColumn: '${header}'`)
      console.log(`  Inferred Type: ${colAnalysis.type}`)
      console.log(`  Has Null/Empty: ${colAnalysis.hasNull}`)
      console.log(`  Unique Values (first 10): ${Array.from(colAnalysis.uniqueValues).slice(0, 10).join(", ")}`)
      console.log(`  Total Unique Values: ${colAnalysis.uniqueValues.size}`)
    })

    console.log("\n--- Analysis Complete ---")
  } catch (err) {
    console.error("Failed to analyze CSV data:", err.message)
  }
}

// Example usage:
// Make sure your CSV file is in the project root or specify the correct path
// analyzeCsv("data/ujak_11.csv"); // Adjust path as needed

// For the purpose of v0 execution, we'll simulate fetching the CSV from the provided URL.
async function runAnalyzeFromUrl(url) {
  try {
    console.log(`Fetching CSV data from URL for analysis: ${url}`)
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

    console.log(`Found ${records.length} records from URL for analysis.`)

    if (records.length === 0) {
      console.log("CSV is empty.")
      return
    }

    const headers = Object.keys(records[0])
    console.log("\n--- CSV Headers ---")
    headers.forEach((header) => console.log(`- ${header}`))

    console.log("\n--- Sample Data (First 5 rows) ---")
    records.slice(0, 5).forEach((record, index) => {
      console.log(`Row ${index + 1}:`, record)
    })

    console.log("\n--- Data Types and Uniqueness (Sampled) ---")
    const analysis = {}

    headers.forEach((header) => {
      analysis[header] = { type: "unknown", uniqueValues: new Set(), hasNull: false }
    })

    records.forEach((record) => {
      headers.forEach((header) => {
        const value = record[header]
        if (value === null || value === undefined || value === "") {
          analysis[header].hasNull = true
        } else {
          analysis[header].uniqueValues.add(String(value))
          if (analysis[header].type === "unknown") {
            if (!isNaN(Number(value)) && !isNaN(Number.parseFloat(value))) {
              analysis[header].type = "number"
            } else if (new Date(value).toString() !== "Invalid Date" && !isNaN(new Date(value).getTime())) {
              analysis[header].type = "date/time"
            } else {
              analysis[header].type = "string"
            }
          }
        }
      })
    })

    headers.forEach((header) => {
      const colAnalysis = analysis[header]
      console.log(`\nColumn: '${header}'`)
      console.log(`  Inferred Type: ${colAnalysis.type}`)
      console.log(`  Has Null/Empty: ${colAnalysis.hasNull}`)
      console.log(`  Unique Values (first 10): ${Array.from(colAnalysis.uniqueValues).slice(0, 10).join(", ")}`)
      console.log(`  Total Unique Values: ${colAnalysis.uniqueValues.size}`)
    })

    console.log("\n--- Analysis Complete ---")
  } catch (err) {
    console.error("Failed to analyze CSV data from URL:", err.message)
  }
}

runAnalyzeFromUrl("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ujak_11-oJ2ZxC4pxxk6lFP8KcD2qGtbzg6UPI.csv")
