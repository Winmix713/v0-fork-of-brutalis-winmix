import fs from "fs"
import https from "https"

const CSV_URL = "https://raw.githubusercontent.com/your-repo/football-data/main/matches.csv"
const LOCAL_PATH = "./data/football_matches.csv"

async function fetchCSVData() {
  console.log("🌐 Fetching CSV data from remote source...")

  // Create data directory if it doesn't exist
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data", { recursive: true })
    console.log("📁 Created data directory")
  }

  try {
    // For demo purposes, we'll create a sample CSV file
    // In a real scenario, you would fetch from an actual URL
    const sampleCSVData = `Match Time,Home Team,Away Team,HT Home Goals,HT Away Goals,FT Home Goals,FT Away Goals
2024-01-15T15:00:00Z,Barcelona,Real Madrid,1,0,2,1
2024-01-14T18:30:00Z,Valencia,Sevilla,0,1,1,1
2024-01-13T20:00:00Z,Bilbao,Villarreal,2,0,3,1
2024-01-12T16:15:00Z,Las Palmas,Getafe,0,0,0,2
2024-01-11T19:45:00Z,Girona,Alaves,1,1,2,2
2024-01-10T17:30:00Z,Mallorca,Osasuna,1,0,1,0
2024-01-09T21:00:00Z,San Sebastian,Vigo,2,1,3,2
2024-01-08T16:00:00Z,Real Madrid,Valencia,0,1,2,1
2024-01-07T19:15:00Z,Sevilla,Barcelona,1,2,1,3
2024-01-06T18:45:00Z,Villarreal,Bilbao,0,0,1,2
2024-01-05T20:30:00Z,Getafe,Las Palmas,1,0,2,1
2024-01-04T15:30:00Z,Alaves,Girona,0,1,1,3
2024-01-03T17:00:00Z,Osasuna,Mallorca,2,0,2,0
2024-01-02T19:30:00Z,Vigo,San Sebastian,1,1,1,1
2024-01-01T16:30:00Z,Barcelona,Valencia,3,0,4,1`

    // Write sample data to file
    fs.writeFileSync(LOCAL_PATH, sampleCSVData)
    console.log(`✅ Sample CSV data created at: ${LOCAL_PATH}`)

    // Analyze the created file
    const stats = fs.statSync(LOCAL_PATH)
    console.log(`📊 File size: ${stats.size} bytes`)

    // Count lines
    const content = fs.readFileSync(LOCAL_PATH, "utf8")
    const lines = content.split("\n").length - 1 // Subtract 1 for header
    console.log(`📋 Records: ${lines} matches`)

    return {
      success: true,
      filePath: LOCAL_PATH,
      fileSize: stats.size,
      recordCount: lines,
    }
  } catch (error) {
    console.error("❌ Error fetching CSV data:", error)
    throw error
  }
}

// Alternative function to fetch from actual URL
async function fetchFromURL(url, localPath) {
  console.log(`🌐 Downloading from: ${url}`)

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath)

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
          return
        }

        response.pipe(file)

        file.on("finish", () => {
          file.close()
          console.log(`✅ Downloaded to: ${localPath}`)
          resolve(localPath)
        })

        file.on("error", (error) => {
          fs.unlink(localPath, () => {}) // Delete partial file
          reject(error)
        })
      })
      .on("error", (error) => {
        reject(error)
      })
  })
}

// Run the fetch
fetchCSVData()
  .then((result) => {
    console.log("🎉 CSV fetch completed successfully!")
    console.log("📁 File location:", result.filePath)
    console.log("📊 File size:", result.fileSize, "bytes")
    console.log("📋 Records:", result.recordCount)
    console.log("\n💡 Next steps:")
    console.log("1. Run analyze-csv.js to examine the data structure")
    console.log("2. Run clean-csv-data.js to clean and validate the data")
    console.log("3. Run import-csv-data.js to import into the database")
  })
  .catch((error) => {
    console.error("💥 Failed to fetch CSV data:", error)
    process.exit(1)
  })
