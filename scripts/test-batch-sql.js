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

async function testBatchSQL() {
  console.log("🧪 Testing batch SQL operations...")

  try {
    // Test 1: Batch team statistics calculation
    console.log("\n📊 Test 1: Batch team statistics")
    const { data: teamStats, error: teamStatsError } = await supabase.rpc("get_team_stats", { team_name: "Barcelona" })

    if (teamStatsError) {
      console.error("❌ Team stats error:", teamStatsError)
    } else {
      console.log("✅ Barcelona stats:", teamStats)
    }

    // Test 2: Batch comeback analysis
    console.log("\n🔄 Test 2: Comeback statistics")
    const { data: comebackStats, error: comebackError } = await supabase.rpc("calculate_comeback_stats", {
      team_name: "Real Madrid",
    })

    if (comebackError) {
      console.error("❌ Comeback stats error:", comebackError)
    } else {
      console.log("✅ Real Madrid comeback stats:", comebackStats)
    }

    // Test 3: Head-to-head analysis
    console.log("\n⚔️ Test 3: Head-to-head analysis")
    const { data: h2hStats, error: h2hError } = await supabase.rpc("get_h2h_record", {
      team1: "Barcelona",
      team2: "Real Madrid",
    })

    if (h2hError) {
      console.error("❌ H2H stats error:", h2hError)
    } else {
      console.log("✅ Barcelona vs Real Madrid H2H:", h2hStats)
    }

    // Test 4: Team form calculation
    console.log("\n📈 Test 4: Team form calculation")
    const { data: formData, error: formError } = await supabase.rpc("calculate_team_form", {
      team_name: "Valencia",
      num_matches: 5,
    })

    if (formError) {
      console.error("❌ Form calculation error:", formError)
    } else {
      console.log("✅ Valencia form (last 5 matches):", formData)
    }

    // Test 5: Batch prediction accuracy
    console.log("\n🎯 Test 5: Prediction accuracy statistics")
    const { data: accuracyStats, error: accuracyError } = await supabase.rpc("get_prediction_accuracy_stats")

    if (accuracyError) {
      console.error("❌ Accuracy stats error:", accuracyError)
    } else {
      console.log("✅ Prediction accuracy stats:", accuracyStats)
    }

    // Test 6: Complex query - matches with comeback potential
    console.log("\n🔥 Test 6: Complex analysis query")
    const { data: complexQuery, error: complexError } = await supabase
      .from("matches")
      .select(`
        *,
        home_team,
        away_team,
        full_time_home_goals,
        full_time_away_goals,
        half_time_home_goals,
        half_time_away_goals
      `)
      .or(
        "and(half_time_home_goals.lt.half_time_away_goals,full_time_home_goals.gt.full_time_away_goals),and(half_time_away_goals.lt.half_time_home_goals,full_time_away_goals.gt.full_time_home_goals)",
      )
      .limit(5)

    if (complexError) {
      console.error("❌ Complex query error:", complexError)
    } else {
      console.log("✅ Comeback matches found:", complexQuery?.length || 0)
      if (complexQuery && complexQuery.length > 0) {
        console.log("Sample comeback match:", complexQuery[0])
      }
    }

    // Test 7: Performance benchmark
    console.log("\n⚡ Test 7: Performance benchmark")
    const startTime = Date.now()

    const promises = [
      supabase.rpc("get_team_stats", { team_name: "Barcelona" }),
      supabase.rpc("get_team_stats", { team_name: "Real Madrid" }),
      supabase.rpc("get_team_stats", { team_name: "Valencia" }),
      supabase.rpc("calculate_comeback_stats", { team_name: "Sevilla" }),
      supabase.rpc("calculate_team_form", { team_name: "Bilbao", num_matches: 10 }),
    ]

    const results = await Promise.all(promises)
    const endTime = Date.now()

    console.log(`✅ Batch operations completed in ${endTime - startTime}ms`)
    console.log(`📊 Successful operations: ${results.filter((r) => !r.error).length}/${results.length}`)

    // Test 8: Data consistency check
    console.log("\n🔍 Test 8: Data consistency check")
    const { data: consistencyCheck, error: consistencyError } = await supabase
      .from("matches")
      .select("*")
      .or("full_time_home_goals.lt.half_time_home_goals,full_time_away_goals.lt.half_time_away_goals")

    if (consistencyError) {
      console.error("❌ Consistency check error:", consistencyError)
    } else {
      console.log(`✅ Data consistency: ${consistencyCheck?.length || 0} inconsistent records found`)
      if (consistencyCheck && consistencyCheck.length > 0) {
        console.log("⚠️ Inconsistent records:", consistencyCheck)
      }
    }

    // Test 9: Batch SQL function
    console.log("\n🔬 Test 9: Batch SQL function")
    await testBatchSqlFunction()

    console.log("\n🎉 All batch SQL tests completed!")
    return true
  } catch (error) {
    console.error("💥 Unexpected error during batch testing:", error)
    return false
  }
}

// Run performance stress test
async function performanceStressTest() {
  console.log("\n🚀 Running performance stress test...")

  const iterations = 50
  const startTime = Date.now()
  const results = []

  for (let i = 0; i < iterations; i++) {
    const iterationStart = Date.now()

    try {
      const { data, error } = await supabase.rpc("calculate_team_form", {
        team_name: "Barcelona",
        num_matches: 10,
      })

      const iterationTime = Date.now() - iterationStart
      results.push({
        iteration: i + 1,
        success: !error,
        time: iterationTime,
        error: error?.message,
      })

      if (i % 10 === 0) {
        console.log(`Progress: ${i + 1}/${iterations} iterations completed`)
      }
    } catch (error) {
      results.push({
        iteration: i + 1,
        success: false,
        time: Date.now() - iterationStart,
        error: error.message,
      })
    }
  }

  const totalTime = Date.now() - startTime
  const successfulRequests = results.filter((r) => r.success).length
  const avgResponseTime = results.reduce((sum, r) => sum + r.time, 0) / results.length
  const maxResponseTime = Math.max(...results.map((r) => r.time))
  const minResponseTime = Math.min(...results.map((r) => r.time))

  console.log("\n📈 Performance Test Results:")
  console.log(`  Total Time: ${totalTime}ms`)
  console.log(
    `  Successful Requests: ${successfulRequests}/${iterations} (${((successfulRequests / iterations) * 100).toFixed(1)}%)`,
  )
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
  console.log(`  Min Response Time: ${minResponseTime}ms`)
  console.log(`  Max Response Time: ${maxResponseTime}ms`)
  console.log(`  Requests per Second: ${(iterations / (totalTime / 1000)).toFixed(2)}`)

  return {
    totalTime,
    successfulRequests,
    avgResponseTime,
    maxResponseTime,
    minResponseTime,
    requestsPerSecond: iterations / (totalTime / 1000),
  }
}

// Run all tests
async function runAllTests() {
  console.log("🔬 Starting comprehensive batch SQL testing...")

  const basicTestResult = await testBatchSQL()

  if (basicTestResult) {
    const performanceResult = await performanceStressTest()

    console.log("\n✅ All tests completed successfully!")
    console.log("📊 Summary:")
    console.log(`  Basic functionality: ${basicTestResult ? "PASS" : "FAIL"}`)
    console.log(`  Performance: ${performanceResult.avgResponseTime.toFixed(2)}ms avg`)
    console.log(`  Reliability: ${performanceResult.successfulRequests}/50 requests successful`)
  } else {
    console.log("❌ Basic tests failed, skipping performance tests")
  }
}

async function testBatchSqlFunction() {
  try {
    console.log("Testing calculate_all_features_batch function...")

    // Call the PostgreSQL function using rpc
    // You might need to pass parameters if your function requires them
    const { data, error } = await supabase.rpc("calculate_all_features_batch", {
      // p_start_date: '2023-01-01',
      // p_end_date: '2023-12-31'
    })

    if (error) {
      console.error("Error calling calculate_all_features_batch:", error)
      throw new Error(error.message)
    }

    console.log("calculate_all_features_batch executed successfully.")
    console.log("Result (if any):", data)
  } catch (err) {
    console.error("Failed to test batch SQL function:", err.message)
  }
}

runAllTests().catch(console.error)
