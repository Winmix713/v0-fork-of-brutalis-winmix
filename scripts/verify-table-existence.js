import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyTableExistence() {
  try {
    console.log("🔍 Verifying table existence...")
    console.log("URL:", supabaseUrl)
    console.log("Key:", supabaseAnonKey ? "✓ Set" : "✗ Missing")

    // Try to query the matches table
    const { data, error, count } = await supabase.from("matches").select("*", { count: "exact", head: true })

    if (error) {
      console.error("❌ Error querying matches table:", error)

      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.log("📋 The 'matches' table does not exist yet.")
        console.log("💡 Run the following script to create it:")
        console.log("   scripts/01-create-matches-table.sql")
      } else if (error.message.includes("permission")) {
        console.log("🔒 Permission denied. Check your RLS policies.")
      }

      return false
    }

    console.log("✅ Matches table exists!")
    console.log(`📊 Total records: ${count || 0}`)

    // Check table structure
    const { data: sampleData, error: sampleError } = await supabase.from("matches").select("*").limit(1)

    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log("📋 Table structure (sample record):")
      console.log(Object.keys(sampleData[0]))
    }

    // Check for other tables
    const tables = ["predictions", "team_stats", "legend_baseline_logs"]

    for (const tableName of tables) {
      const { error: tableError } = await supabase.from(tableName).select("*", { count: "exact", head: true })

      if (tableError) {
        console.log(`❌ Table '${tableName}' does not exist`)
      } else {
        console.log(`✅ Table '${tableName}' exists`)
      }
    }

    return true
  } catch (error) {
    console.error("💥 Unexpected error:", error)
    return false
  }
}

verifyTableExistence()
