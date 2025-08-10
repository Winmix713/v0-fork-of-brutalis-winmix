const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")
const { createObjectCsvWriter } = require("csv-writer")

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

async function cleanCSVData() {
  console.log("🧹 Cleaning CSV data...")

  const cleanedData = []
  let processedRows = 0
  let skippedRows = 0

  return new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv())
      .on("data", (row) => {
        processedRows++

        // Clean and validate row data
        const cleanedRow = {}
        let isValidRow = true

        // Clean each field
        Object.keys(row).forEach((key) => {
          const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_")
          let value = row[key]

          // Clean value
          if (typeof value === "string") {
            value = value.trim()

            // Convert empty strings to null
            if (value === "" || value === "N/A" || value === "null") {
              value = null
            }

            // Try to convert numbers
            if (value && !isNaN(value) && !isNaN(Number.parseFloat(value))) {
              value = Number.parseFloat(value)
            }
          }

          cleanedRow[cleanKey] = value
        })

        // Validate required fields
        const requiredFields = ["home_team", "away_team", "match_time"]
        for (const field of requiredFields) {
          if (!cleanedRow[field]) {
            isValidRow = false
            break
          }
        }

        if (isValidRow) {
          cleanedData.push(cleanedRow)
        } else {
          skippedRows++
        }
      })
      .on("end", async () => {
        console.log(`✅ Processing complete:`)
        console.log(`  📊 Total rows processed: ${processedRows}`)
        console.log(`  ✅ Valid rows: ${cleanedData.length}`)
        console.log(`  ❌ Skipped rows: ${skippedRows}`)

        if (cleanedData.length > 0) {
          // Write cleaned data to new file
          const csvWriter = createObjectCsvWriter({
            path: OUTPUT_CSV,
            header: Object.keys(cleanedData[0]).map((key) => ({
              id: key,
              title: key,
            })),
          })

          await csvWriter.writeRecords(cleanedData)
          console.log(`💾 Cleaned data saved to: ${OUTPUT_CSV}`)
        }

        resolve({ cleanedData, processedRows, skippedRows })
      })
      .on("error", (error) => {
        console.error("❌ Error cleaning CSV:", error)
        reject(error)
      })
  })
}

function cleanCSV() {
  console.log("🧹 Starting CSV cleaning process...")

  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`❌ Input CSV file not found: ${INPUT_CSV}`)
    return
  }

  try {
    const csvContent = fs.readFileSync(INPUT_CSV, "utf-8")
    const lines = csvContent.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      console.error("❌ CSV file is empty")
      return
    }

    console.log(`📊 Processing ${lines.length} lines...`)

    // Remove BOM if present
    if (lines[0].charCodeAt(0) === 65279) {
      lines[0] = lines[0].substring(1)
      console.log("✅ Removed BOM from first line")
    }

    // Parse and clean headers
    const originalHeaders = parseCSVLine(lines[0])
    const cleanedHeaders = originalHeaders.map((header) => {
      return (
        header
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "") || "unnamed_column"
      )
    })

    console.log("📋 Header mapping:")
    originalHeaders.forEach((original, index) => {
      if (original !== cleanedHeaders[index]) {
        console.log(`   "${original}" -> "${cleanedHeaders[index]}"`)
      }
    })

    // Define column types for cleaning
    const columnTypes = cleanedHeaders.map((header) => {
      if (header.includes("goal") || header.includes("score")) return "integer"
      if (header.includes("date")) return "date"
      if (header.includes("time")) return "time"
      if (header.includes("id")) return "integer"
      return "string"
    })

    // Process data lines
    const cleanedLines = [cleanedHeaders.join(",")]
    const dataLines = lines.slice(1)
    let processedRows = 0
    let skippedRows = 0

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const row = parseCSVLine(dataLines[i])

        // Skip rows with wrong number of columns
        if (row.length !== cleanedHeaders.length) {
          console.warn(`⚠️  Row ${i + 2}: Expected ${cleanedHeaders.length} columns, got ${row.length}. Skipping.`)
          skippedRows++
          continue
        }

        // Clean each value
        const cleanedRow = row.map((value, colIndex) => {
          const cleaned = cleanValue(value, columnTypes[colIndex])
          return cleaned === null ? "" : cleaned.toString()
        })

        // Add quotes around values that contain commas or quotes
        const quotedRow = cleanedRow.map((value) => {
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })

        cleanedLines.push(quotedRow.join(","))
        processedRows++

        if (processedRows % 1000 === 0) {
          console.log(`📈 Processed ${processedRows} rows...`)
        }
      } catch (error) {
        console.warn(`⚠️  Error processing row ${i + 2}: ${error.message}. Skipping.`)
        skippedRows++
      }
    }

    // Write cleaned CSV
    fs.writeFileSync(OUTPUT_CSV, cleanedLines.join("\n"))

    console.log("\n✅ CSV cleaning completed!")
    console.log(`📊 Summary:`)
    console.log(`   Input file: ${INPUT_CSV}`)
    console.log(`   Output file: ${OUTPUT_CSV}`)
    console.log(`   Original rows: ${dataLines.length}`)
    console.log(`   Processed rows: ${processedRows}`)
    console.log(`   Skipped rows: ${skippedRows}`)
    console.log(`   Success rate: ${((processedRows / dataLines.length) * 100).toFixed(2)}%`)

    // Generate column mapping file for reference
    const mappingFile = path.join(OUTPUT_DIR, "column_mapping.json")
    const mapping = {
      originalHeaders,
      cleanedHeaders,
      columnTypes,
      mapping: originalHeaders.map((original, index) => ({
        original,
        cleaned: cleanedHeaders[index],
        type: columnTypes[index],
      })),
    }

    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2))
    console.log(`📋 Column mapping saved to: ${mappingFile}`)

    console.log("\n🎯 Next steps:")
    console.log("1. Review the cleaned CSV file")
    console.log("2. Run scripts/01-create-matches-table.sql to create the database table")
    console.log("3. Run scripts/import-csv-data.js to import the cleaned data")
  } catch (error) {
    console.error("❌ Error cleaning CSV:", error.message)
    console.error("Stack trace:", error.stack)
  }
}

// Run cleaning
cleanCSV()
