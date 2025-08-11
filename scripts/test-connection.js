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

async function testSupabaseConnection() {
  try {
    console.log("Attempting to connect to Supabase and fetch a row from 'matches' table...")
    const { data, error } = await supabase.from("matches").select("id").limit(1)

    if (error) {
      console.error("Connection test failed:", error)
      throw new Error(error.message)
    }

    if (data) {
      console.log("Successfully connected to Supabase! Matches table is accessible.")
      if (data.length > 0) {
        console.log("Found at least one row in 'matches' table.")
      } else {
        console.log("Matches table is empty.")
      }
    } else {
      console.log("Connection successful, but no data returned (table might be empty).")
    }
  } catch (err) {
    console.error("An error occurred during Supabase connection test:", err.message)
  }
}

// Run the connection test
testSupabaseConnection()
