import { createClient } from "@supabase/supabase-js"
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

async function verifyTableExistence(tableName) {
  try {
    console.log(`Verifying existence of table: ${tableName}`)
    const { data, error } = await supabase.from(tableName).select("id").limit(1)

    if (error) {
      if (error.code === "42P01") {
        // PostgreSQL error code for "undefined_table"
        console.error(`Table '${tableName}' does NOT exist. Error: ${error.message}`)
        return false
      } else {
        console.error(`Error checking table '${tableName}':`, error)
        return false
      }
    }

    if (data !== null) {
      console.log(`Table '${tableName}' exists.`)
      return true
    } else {
      // This case should ideally not be reached if there's no error and data is null
      console.log(`Table '${tableName}' exists but returned no data on select.`)
      return true
    }
  } catch (err) {
    console.error(`An unexpected error occurred while verifying table '${tableName}':`, err.message)
    return false
  }
}

// Example usage:
// verifyTableExistence("matches");
// verifyTableExistence("predictions");
// verifyTableExistence("system_logs");

// You can call this function for all tables you expect to exist
async function runVerification() {
  console.log("Running table existence verification...")
  await verifyTableExistence("matches")
  await verifyTableExistence("predictions")
  await verifyTableExistence("system_logs")
  // Add other tables as needed
}

runVerification()
