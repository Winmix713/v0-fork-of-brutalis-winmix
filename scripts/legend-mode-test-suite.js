// LEGEND MODE Comprehensive Test Suite
// Tests all aspects of the Legend Mode functionality

const LEGEND_TEST_SUITE = {
  // Test configuration
  config: {
    testTeams: [
      { home: "Barcelona", away: "Real Madrid" },
      { home: "Valencia", away: "Sevilla" },
      { home: "Bilbao", away: "Villarreal" },
      { home: "Las Palmas", away: "Getafe" },
      { home: "Girona", away: "Alaves" },
    ],
    iterations: 50,
    performanceThresholds: {
      maxResponseTime: 100, // ms
      minAccuracy: 0.75,
      maxErrorRate: 0.05,
    },
  },

  // Test results storage
  results: {
    functionality: [],
    performance: [],
    accuracy: [],
    reliability: [],
    integration: [],
  },
}

async function runLegendModeTestSuite() {
  console.log("🔥 LEGEND MODE COMPREHENSIVE TEST SUITE")
  console.log("=".repeat(60))
  console.log(`Testing ${LEGEND_TEST_SUITE.config.testTeams.length} team pairs`)
  console.log(`Performance iterations: ${LEGEND_TEST_SUITE.config.iterations}`)
  console.log("=".repeat(60))

  try {
    // 1. Functionality Tests
    await runFunctionalityTests()

    // 2. Performance Tests
    await runPerformanceTests()

    // 3. Accuracy Tests
    await runAccuracyTests()

    // 4. Reliability Tests
    await runReliabilityTests()

    // 5. Integration Tests
    await runIntegrationTests()

    // 6. Generate comprehensive report
    generateTestReport()
  } catch (error) {
    console.error("💥 Test suite failed:", error)
  }
}

async function runFunctionalityTests() {
  console.log("\n🧪 FUNCTIONALITY TESTS")
  console.log("-".repeat(30))

  for (const teamPair of LEGEND_TEST_SUITE.config.testTeams) {
    console.log(`Testing: ${teamPair.home} vs ${teamPair.away}`)

    const testResult = {
      teamPair,
      timestamp: new Date().toISOString(),
      tests: {},
    }

    // Test 1: Basic API Response
    testResult.tests.basicResponse = await testBasicAPIResponse(teamPair)

    // Test 2: Data Structure Validation
    testResult.tests.dataStructure = await testDataStructure(teamPair)

    // Test 3: Comeback Analysis
    testResult.tests.comebackAnalysis = await testComebackAnalysis(teamPair)

    // Test 4: Mental Strength Calculation
    testResult.tests.mentalStrength = await testMentalStrengthCalculation(teamPair)

    // Test 5: Legend Score Generation
    testResult.tests.legendScore = await testLegendScoreGeneration(teamPair)

    LEGEND_TEST_SUITE.results.functionality.push(testResult)

    const passedTests = Object.values(testResult.tests).filter((t) => t.passed).length
    const totalTests = Object.keys(testResult.tests).length
    console.log(`  ✅ ${passedTests}/${totalTests} tests passed`)
  }
}

async function testBasicAPIResponse(teamPair) {
  try {
    const startTime = Date.now()
    const response = await fetch(
      `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
    )
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return { passed: false, error: `HTTP ${response.status}`, responseTime }
    }

    const data = await response.json()

    return {
      passed: true,
      responseTime,
      dataSize: JSON.stringify(data).length,
      hasRequiredFields: !!(data.home && data.away && data.legend_mode_insights),
    }
  } catch (error) {
    return { passed: false, error: error.message }
  }
}

async function testDataStructure(teamPair) {
  try {
    const response = await fetch(
      `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
    )
    const data = await response.json()

    const requiredFields = [
      "home.comeback_breakdown",
      "away.comeback_breakdown",
      "home.mental_strength",
      "away.mental_strength",
      "legend_mode_insights.legend_score",
      "h2h_comeback_analysis",
    ]

    const missingFields = []

    for (const field of requiredFields) {
      const fieldPath = field.split(".")
      let current = data

      for (const part of fieldPath) {
        if (!current || typeof current[part] === "undefined") {
          missingFields.push(field)
          break
        }
        current = current[part]
      }
    }

    return {
      passed: missingFields.length === 0,
      missingFields,
      totalFields: requiredFields.length,
      validFields: requiredFields.length - missingFields.length,
    }
  } catch (error) {
    return { passed: false, error: error.message }
  }
}

async function testComebackAnalysis(teamPair) {
  try {
    const response = await fetch(
      `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
    )
    const data = await response.json()

    const homeComeback = data.home?.comeback_breakdown
    const awayComeback = data.away?.comeback_breakdown

    const validations = [
      homeComeback?.comeback_frequency >= 0 && homeComeback?.comeback_frequency <= 1,
      awayComeback?.comeback_frequency >= 0 && awayComeback?.comeback_frequency <= 1,
      typeof homeComeback?.comeback_wins === "number",
      typeof awayComeback?.comeback_wins === "number",
      homeComeback?.comeback_success_rate >= 0 && homeComeback?.comeback_success_rate <= 1,
      awayComeback?.comeback_success_rate >= 0 && awayComeback?.comeback_success_rate <= 1,
    ]

    const passedValidations = validations.filter((v) => v).length

    return {
      passed: passedValidations === validations.length,
      passedValidations,
      totalValidations: validations.length,
      homeFrequency: homeComeback?.comeback_frequency,
      awayFrequency: awayComeback?.comeback_frequency,
    }
  } catch (error) {
    return { passed: false, error: error.message }
  }
}

async function testMentalStrengthCalculation(teamPair) {
  try {
    const response = await fetch(
      `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
    )
    const data = await response.json()

    const homeMental = data.home?.mental_strength
    const awayMental = data.away?.mental_strength

    const validations = [
      homeMental?.resilience_score >= 0 && homeMental?.resilience_score <= 1,
      awayMental?.resilience_score >= 0 && awayMental?.resilience_score <= 1,
      typeof homeMental?.avg_comeback_margin === "number",
      typeof awayMental?.avg_comeback_margin === "number",
    ]

    const passedValidations = validations.filter((v) => v).length

    return {
      passed: passedValidations === validations.length,
      passedValidations,
      totalValidations: validations.length,
      homeResilience: homeMental?.resilience_score,
      awayResilience: awayMental?.resilience_score,
    }
  } catch (error) {
    return { passed: false, error: error.message }
  }
}

async function testLegendScoreGeneration(teamPair) {
  try {
    const response = await fetch(
      `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
    )
    const data = await response.json()

    const legendScore = data.legend_mode_insights?.legend_score

    const validations = [
      typeof legendScore?.home === "number",
      typeof legendScore?.away === "number",
      legendScore?.home >= 0 && legendScore?.home <= 100,
      legendScore?.away >= 0 && legendScore?.away <= 100,
      Math.abs(legendScore?.home + legendScore?.away - 100) < 50, // Reasonable total
    ]

    const passedValidations = validations.filter((v) => v).length

    return {
      passed: passedValidations === validations.length,
      passedValidations,
      totalValidations: validations.length,
      homeScore: legendScore?.home,
      awayScore: legendScore?.away,
      scoreDifference: Math.abs(legendScore?.home - legendScore?.away),
    }
  } catch (error) {
    return { passed: false, error: error.message }
  }
}

async function runPerformanceTests() {
  console.log("\n⚡ PERFORMANCE TESTS")
  console.log("-".repeat(30))

  const performanceResults = []

  // Test response times under different loads
  for (let concurrency = 1; concurrency <= 10; concurrency += 3) {
    console.log(`Testing with ${concurrency} concurrent requests...`)

    const promises = []
    const startTime = Date.now()

    for (let i = 0; i < concurrency; i++) {
      const teamPair = LEGEND_TEST_SUITE.config.testTeams[i % LEGEND_TEST_SUITE.config.testTeams.length]
      promises.push(measureResponseTime(teamPair))
    }

    const results = await Promise.all(promises)
    const totalTime = Date.now() - startTime

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    const maxResponseTime = Math.max(...results.map((r) => r.responseTime))
    const minResponseTime = Math.min(...results.map((r) => r.responseTime))
    const successRate = results.filter((r) => r.success).length / results.length

    performanceResults.push({
      concurrency,
      totalTime,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      successRate,
      throughput: concurrency / (totalTime / 1000),
    })

    console.log(
      `  Avg: ${avgResponseTime.toFixed(2)}ms, Max: ${maxResponseTime}ms, Success: ${(successRate * 100).toFixed(1)}%`,
    )
  }

  LEGEND_TEST_SUITE.results.performance = performanceResults
}

async function measureResponseTime(teamPair) {
  const startTime = Date.now()

  try {
    const response = await fetch(
      `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
    )
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return { success: false, responseTime, error: `HTTP ${response.status}` }
    }

    await response.json() // Parse to ensure complete response

    return { success: true, responseTime }
  } catch (error) {
    return { success: false, responseTime: Date.now() - startTime, error: error.message }
  }
}

async function runAccuracyTests() {
  console.log("\n🎯 ACCURACY TESTS")
  console.log("-".repeat(30))

  const accuracyResults = []

  // Test consistency of results
  for (const teamPair of LEGEND_TEST_SUITE.config.testTeams) {
    console.log(`Testing consistency: ${teamPair.home} vs ${teamPair.away}`)

    const results = []

    // Make multiple requests for the same team pair
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(
          `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}`,
        )
        const data = await response.json()

        results.push({
          homeScore: data.legend_mode_insights?.legend_score?.home,
          awayScore: data.legend_mode_insights?.legend_score?.away,
          homeResilience: data.home?.mental_strength?.resilience_score,
          awayResilience: data.away?.mental_strength?.resilience_score,
        })
      } catch (error) {
        console.error(`  Error in iteration ${i + 1}:`, error.message)
      }
    }

    // Calculate consistency metrics
    const consistency = calculateConsistency(results)
    accuracyResults.push({ teamPair, consistency, sampleSize: results.length })

    console.log(`  Consistency: ${(consistency.overall * 100).toFixed(1)}%`)
  }

  LEGEND_TEST_SUITE.results.accuracy = accuracyResults
}

function calculateConsistency(results) {
  if (results.length < 2) return { overall: 0 }

  const metrics = ["homeScore", "awayScore", "homeResilience", "awayResilience"]
  const consistencyScores = []

  for (const metric of metrics) {
    const values = results.map((r) => r[metric]).filter((v) => typeof v === "number")

    if (values.length < 2) continue

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / mean

    // Lower coefficient of variation = higher consistency
    const consistencyScore = Math.max(0, 1 - coefficientOfVariation)
    consistencyScores.push(consistencyScore)
  }

  return {
    overall: consistencyScores.reduce((sum, s) => sum + s, 0) / consistencyScores.length,
    byMetric: consistencyScores,
  }
}

async function runReliabilityTests() {
  console.log("\n🛡️ RELIABILITY TESTS")
  console.log("-".repeat(30))

  const reliabilityResults = {
    errorHandling: [],
    edgeCases: [],
    stressTest: null,
  }

  // Test error handling
  console.log("Testing error handling...")
  const errorTests = [
    { home: "", away: "Barcelona", expectedError: true },
    { home: "Barcelona", away: "", expectedError: true },
    { home: "NonExistentTeam", away: "Barcelona", expectedError: false }, // Should handle gracefully
    { home: "Barcelona", away: "Barcelona", expectedError: true }, // Same team
  ]

  for (const test of errorTests) {
    try {
      const response = await fetch(`/api/legend-mode-enterprise.php?home_team=${test.home}&away_team=${test.away}`)
      const isError = !response.ok

      reliabilityResults.errorHandling.push({
        test,
        handledCorrectly: isError === test.expectedError,
        actualStatus: response.status,
      })
    } catch (error) {
      reliabilityResults.errorHandling.push({
        test,
        handledCorrectly: test.expectedError,
        error: error.message,
      })
    }
  }

  // Stress test
  console.log("Running stress test...")
  reliabilityResults.stressTest = await runStressTest()

  LEGEND_TEST_SUITE.results.reliability = reliabilityResults
}

async function runStressTest() {
  const stressTestResults = {
    totalRequests: 100,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    errors: [],
  }

  const promises = []
  const startTime = Date.now()

  for (let i = 0; i < stressTestResults.totalRequests; i++) {
    const teamPair = LEGEND_TEST_SUITE.config.testTeams[i % LEGEND_TEST_SUITE.config.testTeams.length]
    promises.push(measureResponseTime(teamPair))
  }

  const results = await Promise.all(promises)
  const totalTime = Date.now() - startTime

  stressTestResults.successfulRequests = results.filter((r) => r.success).length
  stressTestResults.failedRequests = results.filter((r) => !r.success).length
  stressTestResults.avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  stressTestResults.errors = results.filter((r) => !r.success).map((r) => r.error)
  stressTestResults.totalTime = totalTime
  stressTestResults.requestsPerSecond = stressTestResults.totalRequests / (totalTime / 1000)

  console.log(
    `  Success rate: ${((stressTestResults.successfulRequests / stressTestResults.totalRequests) * 100).toFixed(1)}%`,
  )
  console.log(`  Avg response time: ${stressTestResults.avgResponseTime.toFixed(2)}ms`)
  console.log(`  Requests per second: ${stressTestResults.requestsPerSecond.toFixed(2)}`)

  return stressTestResults
}

async function runIntegrationTests() {
  console.log("\n🔗 INTEGRATION TESTS")
  console.log("-".repeat(30))

  const integrationResults = {
    abTesting: null,
    monitoring: null,
    caching: null,
  }

  // Test A/B testing integration
  console.log("Testing A/B testing integration...")
  integrationResults.abTesting = await testABTestingIntegration()

  // Test monitoring integration
  console.log("Testing monitoring integration...")
  integrationResults.monitoring = await testMonitoringIntegration()

  // Test caching behavior
  console.log("Testing caching behavior...")
  integrationResults.caching = await testCachingBehavior()

  LEGEND_TEST_SUITE.results.integration = integrationResults
}

async function testABTestingIntegration() {
  const variants = new Set()
  const sessionIds = []

  // Generate different session IDs to test variant assignment
  for (let i = 0; i < 20; i++) {
    sessionIds.push(`test_session_${i}_${Date.now()}`)
  }

  for (const sessionId of sessionIds) {
    try {
      const response = await fetch(
        `/api/legend-mode-enterprise.php?home_team=Barcelona&away_team=Real Madrid&session_id=${sessionId}`,
      )
      const data = await response.json()

      if (data.meta?.ab_variant) {
        variants.add(data.meta.ab_variant)
      }
    } catch (error) {
      console.error("A/B testing error:", error.message)
    }
  }

  return {
    uniqueVariants: variants.size,
    variants: Array.from(variants),
    expectedVariants: 3, // legend_v1_purple_orange, legend_v1_blue_green, legend_v1_minimal
    working: variants.size >= 2, // At least 2 variants should be assigned
  }
}

async function testMonitoringIntegration() {
  try {
    // Test if monitoring data is being generated
    const response = await fetch(`/api/legend-mode-enterprise.php?home_team=Barcelona&away_team=Real Madrid`)
    const data = await response.json()

    return {
      hasExecutionTime: !!data.meta?.execution_time_ms,
      hasMonitoringFlag: !!data.meta?.monitoring_enabled,
      hasBaselineLogging: !!data.meta?.baseline_logged,
      executionTime: data.meta?.execution_time_ms,
    }
  } catch (error) {
    return { error: error.message, working: false }
  }
}

async function testCachingBehavior() {
  const teamPair = { home: "Barcelona", away: "Real Madrid" }

  // First request (should be uncached)
  const startTime1 = Date.now()
  const response1 = await fetch(
    `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}&cache=true`,
  )
  const responseTime1 = Date.now() - startTime1

  // Second request (should potentially be cached)
  const startTime2 = Date.now()
  const response2 = await fetch(
    `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}&cache=true`,
  )
  const responseTime2 = Date.now() - startTime2

  // Third request with cache disabled
  const startTime3 = Date.now()
  const response3 = await fetch(
    `/api/legend-mode-enterprise.php?home_team=${teamPair.home}&away_team=${teamPair.away}&cache=false`,
  )
  const responseTime3 = Date.now() - startTime3

  return {
    firstRequestTime: responseTime1,
    secondRequestTime: responseTime2,
    noCacheRequestTime: responseTime3,
    potentialCacheHit: responseTime2 < responseTime1 * 0.8, // 20% faster suggests caching
    cachingImplemented: responseTime3 > responseTime2, // No cache should be slower
  }
}

function generateTestReport() {
  console.log("\n" + "=".repeat(60))
  console.log("📋 LEGEND MODE TEST SUITE REPORT")
  console.log("=".repeat(60))

  // Functionality Report
  console.log("\n🧪 FUNCTIONALITY TEST RESULTS:")
  const functionalityResults = LEGEND_TEST_SUITE.results.functionality
  const totalFunctionalityTests = functionalityResults.reduce((sum, r) => sum + Object.keys(r.tests).length, 0)
  const passedFunctionalityTests = functionalityResults.reduce(
    (sum, r) => sum + Object.values(r.tests).filter((t) => t.passed).length,
    0,
  )

  console.log(
    `  Overall: ${passedFunctionalityTests}/${totalFunctionalityTests} tests passed (${((passedFunctionalityTests / totalFunctionalityTests) * 100).toFixed(1)}%)`,
  )

  // Performance Report
  console.log("\n⚡ PERFORMANCE TEST RESULTS:")
  const performanceResults = LEGEND_TEST_SUITE.results.performance
  if (performanceResults.length > 0) {
    const bestPerformance = performanceResults.reduce((best, current) =>
      current.avgResponseTime < best.avgResponseTime ? current : best,
    )

    console.log(
      `  Best Performance: ${bestPerformance.avgResponseTime.toFixed(2)}ms avg (${bestPerformance.concurrency} concurrent)`,
    )
    console.log(`  Max Throughput: ${Math.max(...performanceResults.map((r) => r.throughput)).toFixed(2)} req/sec`)

    const performanceIssues = performanceResults.filter(
      (r) => r.avgResponseTime > LEGEND_TEST_SUITE.config.performanceThresholds.maxResponseTime,
    )

    if (performanceIssues.length > 0) {
      console.log(
        `  ⚠️ Performance issues detected at ${performanceIssues.map((r) => r.concurrency).join(", ")} concurrent users`,
      )
    }
  }

  // Accuracy Report
  console.log("\n🎯 ACCURACY TEST RESULTS:")
  const accuracyResults = LEGEND_TEST_SUITE.results.accuracy
  if (accuracyResults.length > 0) {
    const avgConsistency = accuracyResults.reduce((sum, r) => sum + r.consistency.overall, 0) / accuracyResults.length
    console.log(`  Average Consistency: ${(avgConsistency * 100).toFixed(1)}%`)

    const lowConsistencyTests = accuracyResults.filter((r) => r.consistency.overall < 0.9)
    if (lowConsistencyTests.length > 0) {
      console.log(
        `  ⚠️ Low consistency detected for: ${lowConsistencyTests.map((r) => `${r.teamPair.home} vs ${r.teamPair.away}`).join(", ")}`,
      )
    }
  }

  // Reliability Report
  console.log("\n🛡️ RELIABILITY TEST RESULTS:")
  const reliabilityResults = LEGEND_TEST_SUITE.results.reliability
  const errorHandlingScore =
    reliabilityResults.errorHandling.filter((r) => r.handledCorrectly).length / reliabilityResults.errorHandling.length
  console.log(`  Error Handling: ${(errorHandlingScore * 100).toFixed(1)}% correct`)

  if (reliabilityResults.stressTest) {
    const stressTest = reliabilityResults.stressTest
    console.log(
      `  Stress Test: ${((stressTest.successfulRequests / stressTest.totalRequests) * 100).toFixed(1)}% success rate`,
    )
    console.log(`  Under Load: ${stressTest.avgResponseTime.toFixed(2)}ms avg response time`)
  }

  // Integration Report
  console.log("\n🔗 INTEGRATION TEST RESULTS:")
  const integrationResults = LEGEND_TEST_SUITE.results.integration

  if (integrationResults.abTesting) {
    console.log(
      `  A/B Testing: ${integrationResults.abTesting.working ? "✅" : "❌"} (${integrationResults.abTesting.uniqueVariants} variants)`,
    )
  }

  if (integrationResults.monitoring) {
    console.log(
      `  Monitoring: ${integrationResults.monitoring.hasExecutionTime ? "✅" : "❌"} (${integrationResults.monitoring.executionTime}ms tracked)`,
    )
  }

  if (integrationResults.caching) {
    console.log(
      `  Caching: ${integrationResults.caching.potentialCacheHit ? "✅" : "❌"} (${integrationResults.caching.secondRequestTime}ms cached)`,
    )
  }

  // Overall Assessment
  console.log("\n🏆 OVERALL ASSESSMENT:")
  const overallScore = calculateOverallScore()
  console.log(`  Legend Mode Health Score: ${overallScore.toFixed(1)}/100`)

  if (overallScore >= 90) {
    console.log("  Status: 🟢 EXCELLENT - Production ready")
  } else if (overallScore >= 75) {
    console.log("  Status: 🟡 GOOD - Minor optimizations needed")
  } else if (overallScore >= 60) {
    console.log("  Status: 🟠 FAIR - Significant improvements required")
  } else {
    console.log("  Status: 🔴 POOR - Major issues need addressing")
  }

  // Recommendations
  generateRecommendations()
}

function calculateOverallScore() {
  let score = 0
  let maxScore = 0

  // Functionality score (40% weight)
  const functionalityResults = LEGEND_TEST_SUITE.results.functionality
  if (functionalityResults.length > 0) {
    const totalTests = functionalityResults.reduce((sum, r) => sum + Object.keys(r.tests).length, 0)
    const passedTests = functionalityResults.reduce(
      (sum, r) => sum + Object.values(r.tests).filter((t) => t.passed).length,
      0,
    )
    score += (passedTests / totalTests) * 40
  }
  maxScore += 40

  // Performance score (25% weight)
  const performanceResults = LEGEND_TEST_SUITE.results.performance
  if (performanceResults.length > 0) {
    const avgResponseTime =
      performanceResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / performanceResults.length
    const performanceScore = Math.max(0, Math.min(1, (200 - avgResponseTime) / 200)) // 200ms = 0, 0ms = 1
    score += performanceScore * 25
  }
  maxScore += 25

  // Reliability score (20% weight)
  const reliabilityResults = LEGEND_TEST_SUITE.results.reliability
  if (reliabilityResults.stressTest) {
    const reliabilityScore =
      reliabilityResults.stressTest.successfulRequests / reliabilityResults.stressTest.totalRequests
    score += reliabilityScore * 20
  }
  maxScore += 20

  // Integration score (15% weight)
  const integrationResults = LEGEND_TEST_SUITE.results.integration
  let integrationScore = 0
  let integrationTests = 0

  if (integrationResults.abTesting) {
    integrationScore += integrationResults.abTesting.working ? 1 : 0
    integrationTests++
  }
  if (integrationResults.monitoring) {
    integrationScore += integrationResults.monitoring.hasExecutionTime ? 1 : 0
    integrationTests++
  }
  if (integrationResults.caching) {
    integrationScore += integrationResults.caching.potentialCacheHit ? 1 : 0
    integrationTests++
  }

  if (integrationTests > 0) {
    score += (integrationScore / integrationTests) * 15
  }
  maxScore += 15

  return maxScore > 0 ? (score / maxScore) * 100 : 0
}

function generateRecommendations() {
  console.log("\n💡 RECOMMENDATIONS:")

  const recommendations = []

  // Analyze functionality issues
  const functionalityResults = LEGEND_TEST_SUITE.results.functionality
  const failedFunctionalityTests = functionalityResults.flatMap((r) =>
    Object.entries(r.tests).filter(([_, test]) => !test.passed),
  )

  if (failedFunctionalityTests.length > 0) {
    recommendations.push(
      "1. Fix functionality issues in: " + failedFunctionalityTests.map(([testName, _]) => testName).join(", "),
    )
  }

  // Analyze performance issues
  const performanceResults = LEGEND_TEST_SUITE.results.performance
  const slowPerformance = performanceResults.filter(
    (r) => r.avgResponseTime > LEGEND_TEST_SUITE.config.performanceThresholds.maxResponseTime,
  )

  if (slowPerformance.length > 0) {
    recommendations.push("2. Optimize performance for high concurrency scenarios")
    recommendations.push("   - Consider implementing response caching")
    recommendations.push("   - Optimize database queries")
    recommendations.push("   - Add connection pooling")
  }

  // Analyze reliability issues
  const reliabilityResults = LEGEND_TEST_SUITE.results.reliability
  if (
    reliabilityResults.stressTest &&
    reliabilityResults.stressTest.successfulRequests / reliabilityResults.stressTest.totalRequests < 0.95
  ) {
    recommendations.push("3. Improve system reliability under load")
    recommendations.push("   - Add better error handling")
    recommendations.push("   - Implement circuit breakers")
    recommendations.push("   - Add request rate limiting")
  }

  // Integration recommendations
  const integrationResults = LEGEND_TEST_SUITE.results.integration
  if (integrationResults.abTesting && !integrationResults.abTesting.working) {
    recommendations.push("4. Fix A/B testing integration")
  }
  if (integrationResults.monitoring && !integrationResults.monitoring.hasExecutionTime) {
    recommendations.push("5. Implement proper monitoring and metrics collection")
  }

  if (recommendations.length === 0) {
    console.log("  🎉 No major issues detected! System is performing well.")
    console.log("  💡 Consider minor optimizations:")
    console.log("    - Monitor performance trends over time")
    console.log("    - Add more comprehensive logging")
    console.log("    - Implement automated alerting")
  } else {
    recommendations.forEach((rec) => console.log(`  ${rec}`))
  }

  console.log("\n📊 Test completed at:", new Date().toISOString())
}

// Run the comprehensive test suite
runLegendModeTestSuite().catch(console.error)

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    runLegendModeTestSuite,
    LEGEND_TEST_SUITE,
  }
}
