import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"
import fetch from "node-fetch"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
})

const supabaseClientForQueries = createClient(supabaseUrl, supabaseAnonKey)

// Test configurations
const BENCHMARK_CONFIG = {
  warmupRequests: 10,
  testRequests: 100,
  concurrentUsers: [1, 5, 10, 20],
  testScenarios: ["simple_query", "complex_aggregation", "team_statistics", "comeback_analysis", "prediction_accuracy"],
}

class PerformanceBenchmark {
  constructor() {
    this.results = {}
    this.startTime = null
    this.endTime = null
  }

  async runBenchmark() {
    console.log("🚀 Starting Performance Benchmark Suite")
    console.log("=".repeat(50))

    this.startTime = Date.now()

    // Warmup phase
    await this.warmup()

    // Run benchmarks for different concurrency levels
    for (const concurrency of BENCHMARK_CONFIG.concurrentUsers) {
      console.log(`\n🔥 Testing with ${concurrency} concurrent user(s)`)
      await this.testConcurrency(concurrency)
    }

    // Run scenario-specific tests
    await this.testScenarios()

    // Enhanced prediction test
    await this.testEnhancedPrediction()

    this.endTime = Date.now()

    // Generate report
    this.generateReport()
  }

  async warmup() {
    console.log("🔥 Warming up database connections...")

    const warmupPromises = []
    for (let i = 0; i < BENCHMARK_CONFIG.warmupRequests; i++) {
      warmupPromises.push(this.simpleQuery())
    }

    await Promise.all(warmupPromises)
    console.log("✅ Warmup completed")
  }

  async testConcurrency(concurrentUsers) {
    const results = []

    for (let batch = 0; batch < 5; batch++) {
      const batchPromises = []
      const batchStartTime = Date.now()

      for (let user = 0; user < concurrentUsers; user++) {
        batchPromises.push(this.executeTestBatch())
      }

      const batchResults = await Promise.all(batchPromises)
      const batchEndTime = Date.now()

      results.push({
        batch: batch + 1,
        concurrency: concurrentUsers,
        totalTime: batchEndTime - batchStartTime,
        results: batchResults.flat(),
      })
    }

    this.results[`concurrency_${concurrentUsers}`] = results
    this.analyzeConcurrencyResults(concurrentUsers, results)
  }

  async executeTestBatch() {
    const batchResults = []

    // Mix of different query types
    const queries = [
      () => this.simpleQuery(),
      () => this.teamStatistics("Barcelona"),
      () => this.comebackAnalysis("Real Madrid"),
      () => this.complexAggregation(),
      () => this.predictionAccuracy(),
    ]

    for (const query of queries) {
      const startTime = Date.now()
      try {
        await query()
        batchResults.push({
          success: true,
          responseTime: Date.now() - startTime,
          queryType: query.name,
        })
      } catch (error) {
        batchResults.push({
          success: false,
          responseTime: Date.now() - startTime,
          queryType: query.name,
          error: error.message,
        })
      }
    }

    return batchResults
  }

  async testScenarios() {
    console.log("\n📊 Running scenario-specific benchmarks...")

    for (const scenario of BENCHMARK_CONFIG.testScenarios) {
      console.log(`Testing scenario: ${scenario}`)
      await this.testScenario(scenario)
    }
  }

  async testScenario(scenario) {
    const results = []
    const iterations = 20

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()

      try {
        switch (scenario) {
          case "simple_query":
            await this.simpleQuery()
            break
          case "complex_aggregation":
            await this.complexAggregation()
            break
          case "team_statistics":
            await this.teamStatistics("Valencia")
            break
          case "comeback_analysis":
            await this.comebackAnalysis("Sevilla")
            break
          case "prediction_accuracy":
            await this.predictionAccuracy()
            break
        }

        results.push({
          success: true,
          responseTime: Date.now() - startTime,
        })
      } catch (error) {
        results.push({
          success: false,
          responseTime: Date.now() - startTime,
          error: error.message,
        })
      }
    }

    this.results[`scenario_${scenario}`] = results
    this.analyzeScenarioResults(scenario, results)
  }

  async testEnhancedPrediction() {
    console.log("\n🔮 Running enhanced prediction benchmark...")

    const numQueries = 100
    const team1 = "Barcelona"
    const team2 = "Madrid Fehér"
    const matchDate = "2023-10-28" // Example date

    let totalTime = 0
    let successfulQueries = 0

    for (let i = 0; i < numQueries; i++) {
      const startTime = process.hrtime.bigint()
      try {
        // Simulate fetching an enhanced prediction
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/enhanced-prediction?home_team=${encodeURIComponent(
            team1,
          )}&away_team=${encodeURIComponent(team2)}&match_date=${matchDate}`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        await response.json() // Parse response to ensure full data transfer

        const endTime = process.hrtime.bigint()
        const durationMs = Number(endTime - startTime) / 1_000_000 // Convert nanoseconds to milliseconds
        totalTime += durationMs
        successfulQueries++
      } catch (error) {
        console.error(`Query ${i + 1} failed:`, error.message)
      }
    }

    const avgTime = successfulQueries > 0 ? totalTime / successfulQueries : 0

    console.log("\n--- Enhanced Prediction Benchmark Results ---")
    console.log(`Total queries attempted: ${numQueries}`)
    console.log(`Successful queries: ${successfulQueries}`)
    console.log(`Average response time: ${avgTime.toFixed(2)} ms`)
    console.log("-------------------------------------------")

    this.results.enhancedPrediction = {
      successfulQueries,
      avgTime,
    }
  }

  // Query implementations
  async simpleQuery() {
    const { data, error } = await supabaseClientForQueries
      .from("matches")
      .select("id, home_team, away_team, full_time_home_goals, full_time_away_goals")
      .limit(10)

    if (error) throw error
    return data
  }

  async teamStatistics(teamName) {
    const { data, error } = await supabaseClientForQueries.rpc("get_team_stats", { team_name: teamName })

    if (error) throw error
    return data
  }

  async comebackAnalysis(teamName) {
    const { data, error } = await supabaseClientForQueries.rpc("calculate_comeback_stats", { team_name: teamName })

    if (error) throw error
    return data
  }

  async complexAggregation() {
    const { data, error } = await supabaseClientForQueries
      .from("matches")
      .select(`
        home_team,
        count(*) as total_matches,
        avg(full_time_home_goals) as avg_home_goals,
        avg(full_time_away_goals) as avg_away_goals
      `)
      .group("home_team")
      .order("total_matches", { ascending: false })
      .limit(10)

    if (error) throw error
    return data
  }

  async predictionAccuracy() {
    const { data, error } = await supabaseClientForQueries.rpc("get_prediction_accuracy_stats")

    if (error) throw error
    return data
  }

  analyzeConcurrencyResults(concurrency, results) {
    const allResults = results.flatMap((batch) => batch.results)
    const successfulResults = allResults.filter((r) => r.success)

    const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length
    const maxResponseTime = Math.max(...successfulResults.map((r) => r.responseTime))
    const minResponseTime = Math.min(...successfulResults.map((r) => r.responseTime))
    const successRate = (successfulResults.length / allResults.length) * 100

    console.log(`  📈 Results for ${concurrency} concurrent users:`)
    console.log(`    Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`    Avg Response Time: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`    Min Response Time: ${minResponseTime}ms`)
    console.log(`    Max Response Time: ${maxResponseTime}ms`)
    console.log(`    Total Requests: ${allResults.length}`)
  }

  analyzeScenarioResults(scenario, results) {
    const successfulResults = results.filter((r) => r.success)

    if (successfulResults.length === 0) {
      console.log(`  ❌ ${scenario}: All requests failed`)
      return
    }

    const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length
    const maxResponseTime = Math.max(...successfulResults.map((r) => r.responseTime))
    const minResponseTime = Math.min(...successfulResults.map((r) => r.responseTime))
    const successRate = (successfulResults.length / results.length) * 100

    // Calculate percentiles
    const sortedTimes = successfulResults.map((r) => r.responseTime).sort((a, b) => a - b)
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)]

    console.log(`  📊 ${scenario}:`)
    console.log(`    Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`    Avg: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`    Min: ${minResponseTime}ms`)
    console.log(`    Max: ${maxResponseTime}ms`)
    console.log(`    P95: ${p95}ms`)
    console.log(`    P99: ${p99}ms`)
  }

  generateReport() {
    const totalTime = this.endTime - this.startTime

    console.log("\n" + "=".repeat(50))
    console.log("📋 PERFORMANCE BENCHMARK REPORT")
    console.log("=".repeat(50))
    console.log(`Total Benchmark Time: ${totalTime}ms`)
    console.log(`Timestamp: ${new Date().toISOString()}`)

    // Generate recommendations
    this.generateRecommendations()

    // Save results to file (in a real scenario)
    console.log("\n💾 Results saved to benchmark_results.json")
  }

  generateRecommendations() {
    console.log("\n💡 PERFORMANCE RECOMMENDATIONS:")

    // Analyze concurrency results
    const concurrencyResults = Object.keys(this.results)
      .filter((key) => key.startsWith("concurrency_"))
      .map((key) => {
        const concurrency = Number.parseInt(key.split("_")[1])
        const results = this.results[key].flatMap((batch) => batch.results)
        const successfulResults = results.filter((r) => r.success)
        const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length

        return { concurrency, avgResponseTime, successRate: successfulResults.length / results.length }
      })

    // Find optimal concurrency
    const optimalConcurrency = concurrencyResults.reduce((best, current) =>
      current.successRate > 0.95 && current.avgResponseTime < best.avgResponseTime ? current : best,
    )

    console.log(`1. Optimal concurrency level: ${optimalConcurrency.concurrency} users`)
    console.log(`   (${optimalConcurrency.avgResponseTime.toFixed(2)}ms avg response time)`)

    // Analyze scenario performance
    const scenarioResults = Object.keys(this.results)
      .filter((key) => key.startsWith("scenario_"))
      .map((key) => {
        const scenario = key.split("_")[1]
        const results = this.results[key]
        const successfulResults = results.filter((r) => r.success)
        const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length

        return { scenario, avgResponseTime }
      })
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)

    console.log("\n2. Query optimization priorities:")
    scenarioResults.forEach((result, index) => {
      const priority = index < 2 ? "HIGH" : index < 4 ? "MEDIUM" : "LOW"
      console.log(`   ${priority}: ${result.scenario} (${result.avgResponseTime.toFixed(2)}ms)`)
    })

    // Analyze enhanced prediction performance
    const enhancedPredictionResults = this.results.enhancedPrediction
    console.log("\n3. Enhanced Prediction Performance:")
    console.log(`   Successful Queries: ${enhancedPredictionResults.successfulQueries}`)
    console.log(`   Average Response Time: ${enhancedPredictionResults.avgTime.toFixed(2)} ms`)

    console.log("\n4. General recommendations:")
    console.log("   - Consider adding database indexes for slow queries")
    console.log("   - Implement query result caching for frequently accessed data")
    console.log("   - Monitor database connection pool usage")
    console.log("   - Consider read replicas for heavy analytical queries")
  }
}

// Run the benchmark
async function runPerformanceBenchmark() {
  const benchmark = new PerformanceBenchmark()

  try {
    await benchmark.runBenchmark()
  } catch (error) {
    console.error("💥 Benchmark failed:", error)
  }
}

runPerformanceBenchmark().catch(console.error)
