import { createClient } from "@supabase/supabase-js"
import { parse } from "csv-parse/sync"
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

async function fetchAndProcessCsv(csvUrl) {
  try {
    console.log(`Fetching CSV from: ${csvUrl}`)
    const response = await fetch(csvUrl)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const csvContent = await response.text()
    console.log("CSV content fetched successfully.")

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    console.log(`Parsed ${records.length} records.`)

    // Example: Process records (e.g., log them, transform them, insert into DB)
    for (const record of records) {
      console.log(record) // Log each record
      // Here you would typically insert into your database
      // For example:
      // await supabase.from('your_table').insert(record);
    }

    console.log("CSV data fetched and processed successfully.")
  } catch (error) {
    console.error("Failed to fetch or process CSV data:", error.message)
  }
}

// Example usage:
// Replace with your actual CSV URL
// fetchAndProcessCsv("https://example.com/your-data.csv");

// Using the URL provided by the user
fetchAndProcessCsv("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ujak_11-oJ2ZxC4pxxk6lFP8KcD2qGtbzg6UPI.csv")
