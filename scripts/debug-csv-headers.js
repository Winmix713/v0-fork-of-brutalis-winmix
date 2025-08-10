const fs = require("fs")
const path = require("path")

// Configuration
const CSV_FILE_PATH = path.join(__dirname, "..", "data", "football_matches.csv")

function debugHeaders() {
  console.log("🔍 Debugging CSV headers...")

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`)
    return
  }

  try {
    const csvContent = fs.readFileSync(CSV_FILE_PATH, "utf-8")
    const lines = csvContent.split("\n")

    if (lines.length === 0) {
      console.error("❌ CSV file is empty")
      return
    }

    const headerLine = lines[0]
    console.log("📋 Raw header line:")
    console.log(`"${headerLine}"`)
    console.log(`\nLength: ${headerLine.length} characters`)

    // Show character codes for debugging
    console.log("\n🔤 Character analysis:")
    for (let i = 0; i < Math.min(headerLine.length, 100); i++) {
      const char = headerLine[i]
      const code = char.charCodeAt(0)
      console.log(`${i}: "${char}" (${code})`)
    }

    // Parse headers with different methods
    console.log("\n📊 Header parsing attempts:")

    // Method 1: Simple split
    const simpleHeaders = headerLine.split(",")
    console.log(`\n1. Simple comma split (${simpleHeaders.length} columns):`)
    simpleHeaders.forEach((header, index) => {
      console.log(`   ${index}: "${header.trim()}"`)
    })

    // Method 2: CSV-aware parsing
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

    const csvHeaders = parseCSVLine(headerLine)
    console.log(`\n2. CSV-aware parsing (${csvHeaders.length} columns):`)
    csvHeaders.forEach((header, index) => {
      console.log(`   ${index}: "${header}"`)
    })

    // Method 3: Check for common issues
    console.log("\n🔍 Common issues check:")

    // Check for BOM (Byte Order Mark)
    if (headerLine.charCodeAt(0) === 65279) {
      console.log("⚠️  BOM (Byte Order Mark) detected at start of file")
    }

    // Check for unusual characters
    const unusualChars = []
    for (let i = 0; i < headerLine.length; i++) {
      const code = headerLine.charCodeAt(i)
      if (code < 32 && code !== 10 && code !== 13) {
        unusualChars.push({ char: headerLine[i], code, position: i })
      }
    }

    if (unusualChars.length > 0) {
      console.log("⚠️  Unusual characters found:")
      unusualChars.forEach(({ char, code, position }) => {
        console.log(`   Position ${position}: code ${code}`)
      })
    }

    // Check for different line endings
    if (csvContent.includes("\r\n")) {
      console.log("ℹ️  Windows line endings (CRLF) detected")
    } else if (csvContent.includes("\r")) {
      console.log("ℹ️  Mac line endings (CR) detected")
    } else {
      console.log("ℹ️  Unix line endings (LF) detected")
    }

    // Suggest column mappings for database
    console.log("\n💡 Suggested database column mappings:")
    const suggestedMappings = csvHeaders.map((header) => {
      const cleaned = header
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")

      return {
        original: header,
        suggested: cleaned || "unnamed_column",
        type: guessDataType(header),
      }
    })

    suggestedMappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. "${mapping.original}" -> "${mapping.suggested}" (${mapping.type})`)
    })

    // Generate SQL for table creation
    console.log("\n📝 Generated SQL column definitions:")
    const sqlColumns = suggestedMappings
      .map((mapping) => {
        const sqlType = getSQLType(mapping.type)
        return `    ${mapping.suggested} ${sqlType}`
      })
      .join(",\n")

    console.log(sqlColumns)
  } catch (error) {
    console.error("❌ Error debugging headers:", error.message)
  }
}

function guessDataType(header) {
  const lower = header.toLowerCase()

  if (lower.includes("date") || lower.includes("time")) return "datetime"
  if (lower.includes("goal") || lower.includes("score")) return "integer"
  if (lower.includes("id")) return "integer"
  if (lower.includes("team") || lower.includes("league") || lower.includes("referee")) return "varchar"
  if (lower.includes("result")) return "varchar"

  return "varchar"
}

function getSQLType(dataType) {
  switch (dataType) {
    case "integer":
      return "INTEGER"
    case "datetime":
      return "TIMESTAMP WITH TIME ZONE"
    case "varchar":
      return "VARCHAR(255)"
    default:
      return "TEXT"
  }
}

// Run debugging
debugHeaders()
