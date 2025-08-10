import fs from "fs"
import csv from "csv-parser"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const csvFilePath = "./data/football_matches_cleaned.csv"

async function importCSVData() {
  console.log("📥 Starting CSV data import...")

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`)
    console.log("💡 Run the clean-csv-data.js script first to generate the cleaned CSV file")
    return
  }

  const records = []
  let processedRows = 0
  let errorRows = 0

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          // Map CSV columns to database columns
          const record = {
            match_time: row.match_time || row.date || row.time,
            home_team: row.home_team || row.home,
            away_team: row.away_team || row.away,
            half_time_home_goals: Number.parseInt(row.half_time_home_goals || row.ht_home || 0),
            half_time_away_goals: Number.parseInt(row.half_time_away_goals || row.ht_away || 0),
            full_time_home_goals: Number.parseInt(row.full_time_home_goals || row.ft_home || 0),
            full_time_away_goals: Number.parseInt(row.full_time_away_goals || row.ft_away || 0),
          }

          // Validate required fields
          if (record.home_team && record.away_team && record.match_time) {
            records.push(record)
            processedRows++
          } else {
            errorRows++
            console.warn(`⚠️ Skipping invalid row: ${JSON.stringify(row)}`)
          }
        } catch (error) {
          errorRows++
          console.error(`❌ Error processing row: ${error.message}`)
        }
      })
      .on("end", async () => {
        console.log(`📊 Processing complete:`)
        console.log(`  ✅ Valid records: ${records.length}`)
        console.log(`  ❌ Error records: ${errorRows}`)

        if (records.length === 0) {
          console.log("❌ No valid records to import")
          resolve({ success: false, imported: 0 })
          return
        }

        try {
          // Import data in batches
          const batchSize = 100
          let totalImported = 0

          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize)

            console.log(
              `📤 Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}...`,
            )

            const { data, error } = await supabase.from("matches").insert(batch).select()

            if (error) {
              console.error(`❌ Error importing batch: ${error.message}`)

              // Try to import records one by one to identify problematic records
              for (const record of batch) {
                const { error: singleError } = await supabase.from("matches").insert([record])

                if (singleError) {
                  console.error(`❌ Failed to import record: ${JSON.stringify(record)}`)
                  console.error(`   Error: ${singleError.message}`)
                } else {
                  totalImported++
                }
              }
            } else {
              totalImported += batch.length
              console.log(`✅ Batch imported successfully: ${batch.length} records`)
            }
          }

          console.log(`🎉 Import complete!`)
          console.log(`  📊 Total imported: ${totalImported}`)
          console.log(`  ❌ Failed imports: ${records.length - totalImported}`)

          // Verify import
          const { count, error: countError } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })

          if (!countError) {
            console.log(`✅ Verification: ${count} total records in database`)
          }

          resolve({ success: true, imported: totalImported })
        } catch (error) {
          console.error("💥 Unexpected error during import:", error)
          reject(error)
        }
      })
      .on("error", (error) => {
        console.error("❌ Error reading CSV file:", error)
        reject(error)
      })
  })
}

importCSVData().catch(console.error)
