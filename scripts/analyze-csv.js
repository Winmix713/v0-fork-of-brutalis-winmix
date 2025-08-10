const fs = require("fs")
const path = require("path")

// Configuration
const CSV_FILE_PATH = path.join(__dirname, "..", "data", "football_matches.csv")
const OUTPUT_DIR = path.join(__dirname, "..", "analysis")

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

function analyzeCSV() {
  console.log("🔍 Starting CSV analysis...")

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`)
    console.log("📁 Please ensure your CSV file is located at: data/football_matches.csv")
    return
  }

  try {
    const csvContent = fs.readFileSync(CSV_FILE_PATH, "utf-8")
    const lines = csvContent.split("\n").filter((line) => line.trim())

    if (lines.length === 0) {
      console.error("❌ CSV file is empty")
      return
    }

    console.log(`📊 Total lines in CSV: ${lines.length}`)

    // Parse header
    const headers = parseCSVLine(lines[0])
    console.log(`📋 Number of columns: ${headers.length}`)
    console.log("📝 Column headers:")
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. "${header}"`)
    })

    // Analyze data rows
    const dataLines = lines.slice(1)
    console.log(`📈 Data rows: ${dataLines.length}`)

    // Sample data analysis
    const sampleSize = Math.min(10, dataLines.length)
    console.log(`\n🔬 Analyzing first ${sampleSize} data rows...`)

    const analysis = {
      columnStats: {},
      dataTypes: {},
      nullCounts: {},
      uniqueValues: {},
      sampleData: [],
    }

    // Initialize analysis objects
    headers.forEach((header) => {
      analysis.columnStats[header] = { min: null, max: null, avg: null }
      analysis.dataTypes[header] = new Set()
      analysis.nullCounts[header] = 0
      analysis.uniqueValues[header] = new Set()
    })

    // Analyze sample data
    for (let i = 0; i < sampleSize && i < dataLines.length; i++) {
      const row = parseCSVLine(dataLines[i])
      const rowData = {}

      headers.forEach((header, index) => {
        const value = row[index] || ""
        rowData[header] = value

        // Track unique values (limit to prevent memory issues)
        if (analysis.uniqueValues[header].size < 100) {
          analysis.uniqueValues[header].add(value)
        }

        // Count nulls/empty values
        if (!value || value.trim() === "") {
          analysis.nullCounts[header]++
        }

        // Determine data type
        if (value.trim() !== "") {
          if (!isNaN(value) && !isNaN(Number.parseFloat(value))) {
            analysis.dataTypes[header].add("number")
          } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            analysis.dataTypes[header].add("date")
          } else if (value.match(/^\d{2}:\d{2}$/)) {
            analysis.dataTypes[header].add("time")
          } else {
            analysis.dataTypes[header].add("string")
          }
        }
      })

      analysis.sampleData.push(rowData)
    }

    // Generate analysis report
    const report = {
      summary: {
        totalRows: dataLines.length,
        totalColumns: headers.length,
        fileSize: `${(csvContent.length / 1024).toFixed(2)} KB`,
        analyzedRows: sampleSize,
      },
      columns: headers.map((header) => ({
        name: header,
        dataTypes: Array.from(analysis.dataTypes[header]),
        uniqueValueCount: analysis.uniqueValues[header].size,
        nullCount: analysis.nullCounts[header],
        sampleValues: Array.from(analysis.uniqueValues[header]).slice(0, 5),
      })),
      sampleData: analysis.sampleData.slice(0, 3),
    }

    // Save analysis report
    const reportPath = path.join(OUTPUT_DIR, "csv_analysis_report.json")
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Display summary
    console.log("\n📊 ANALYSIS SUMMARY")
    console.log("===================")
    console.log(`📁 File size: ${report.summary.fileSize}`)
    console.log(`📊 Total rows: ${report.summary.totalRows}`)
    console.log(`📋 Total columns: ${report.summary.totalColumns}`)

    console.log("\n📋 COLUMN ANALYSIS")
    console.log("==================")
    report.columns.forEach((col) => {
      console.log(`\n📝 ${col.name}:`)
      console.log(`   Data types: ${col.dataTypes.join(", ") || "unknown"}`)
      console.log(`   Unique values: ${col.uniqueValueCount}`)
      console.log(`   Null/empty: ${col.nullCount}`)
      if (col.sampleValues.length > 0) {
        console.log(`   Sample values: ${col.sampleValues.join(", ")}`)
      }
    })

    console.log("\n📋 SAMPLE DATA")
    console.log("==============")
    report.sampleData.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`)
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}"`)
      })
    })

    console.log(`\n✅ Analysis complete! Report saved to: ${reportPath}`)

    // Generate recommendations
    console.log("\n💡 RECOMMENDATIONS")
    console.log("==================")

    const recommendations = []

    // Check for potential issues
    report.columns.forEach((col) => {
      if (col.nullCount > 0) {
        recommendations.push(`⚠️  Column "${col.name}" has ${col.nullCount} null/empty values`)
      }

      if (col.dataTypes.length > 1) {
        recommendations.push(`⚠️  Column "${col.name}" has mixed data types: ${col.dataTypes.join(", ")}`)
      }

      if (col.uniqueValueCount === 1) {
        recommendations.push(`ℹ️  Column "${col.name}" has only one unique value (might be constant)`)
      }
    })

    if (recommendations.length === 0) {
      console.log("✅ No issues detected in the analyzed sample!")
    } else {
      recommendations.forEach((rec) => console.log(rec))
    }

    console.log("\n🎯 Next steps:")
    console.log("1. Run scripts/debug-csv-headers.js to examine headers in detail")
    console.log("2. Run scripts/clean-csv-data.js to clean the data")
    console.log("3. Run scripts/01-create-matches-table.sql to create the database table")
  } catch (error) {
    console.error("❌ Error analyzing CSV:", error.message)
    console.error("Stack trace:", error.stack)
  }
}

// Run analysis
analyzeCSV()
