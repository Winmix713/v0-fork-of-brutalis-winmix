const { createClient } = require("@supabase/supabase-js")

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bgmoszrgfxsxwogvmqvh.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase configuration!")
  console.log("Required environment variables:")
  console.log("- NEXT_PUBLIC_SUPABASE_URL")
  console.log("- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log("🔄 Testing Supabase connection...")
  console.log(`📍 URL: ${supabaseUrl}`)
  console.log(`🔑 Using key: ${supabaseKey.substring(0, 20)}...`)

  try {
    // Test basic connection
    const { data, error } = await supabase.from("matches").select("count", { count: "exact", head: true })

    if (error) {
      console.error("❌ Connection failed:", error.message)

      // Try to get more specific error info
      if (error.code) {
        console.error(`Error code: ${error.code}`)
      }
      if (error.details) {
        console.error(`Details: ${error.details}`)
      }
      if (error.hint) {
        console.error(`Hint: ${error.hint}`)
      }

      return false
    }

    console.log("✅ Connection successful!")
    console.log(`📊 Matches table has ${data || 0} records`)

    // Test if we can run a simple query
    const { data: sampleData, error: queryError } = await supabase
      .from("matches")
      .select("id, home_team, away_team, league")
      .limit(3)

    if (queryError) {
      console.warn("⚠️  Basic connection works, but query failed:", queryError.message)
    } else {
      console.log("✅ Query test successful!")
      if (sampleData && sampleData.length > 0) {
        console.log("📋 Sample data:")
        sampleData.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.home_team} vs ${match.away_team} (${match.league})`)
        })
      }
    }

    // Test predictions table if it exists
    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select("count", { count: "exact", head: true })

    if (predictionsError) {
      console.log("ℹ️  Predictions table not found or not accessible:", predictionsError.message)
    } else {
      console.log(`📈 Predictions table has ${predictionsData || 0} records`)
    }

    return true
  } catch (err) {
    console.error("❌ Unexpected error:", err.message)
    return false
  }
}

async function testDatabaseHealth() {
  console.log("\n🏥 Running database health checks...")

  try {
    // Check if we can create a simple test table
    const { error: createError } = await supabase.rpc("version")

    if (createError) {
      console.log("⚠️  Cannot execute functions:", createError.message)
    } else {
      console.log("✅ Database functions are accessible")
    }

    // Test write permissions (if we have them)
    const testData = {
      home_team: "Test Team A",
      away_team: "Test Team B",
      prediction_type: "test",
      home_win_probability: 0.33,
      draw_probability: 0.34,
      away_win_probability: 0.33,
      confidence_score: 0.5,
      model_version: "test_v1.0",
    }

    const { data: insertData, error: insertError } = await supabase.from("predictions").insert([testData]).select()

    if (insertError) {
      console.log("ℹ️  Write test failed (this might be expected):", insertError.message)
    } else {
      console.log("✅ Write permissions confirmed")

      // Clean up test data
      if (insertData && insertData.length > 0) {
        await supabase.from("predictions").delete().eq("id", insertData[0].id)
        console.log("🧹 Test data cleaned up")
      }
    }
  } catch (err) {
    console.log("⚠️  Health check error:", err.message)
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Supabase connection test...\n")

  const connectionSuccess = await testConnection()

  if (connectionSuccess) {
    await testDatabaseHealth()
    console.log("\n✅ All tests completed successfully!")
    console.log("🎯 Your database is ready for the football analytics system!")
  } else {
    console.log("\n❌ Connection test failed!")
    console.log("🔧 Please check your environment variables and database setup.")
  }
}

// Run the test
main().catch(console.error)
