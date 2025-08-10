import fetch from "node-fetch" // node-fetch is needed for older Node.js versions or if not using Next.js built-in fetch

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

async function runCheck(name, checkFunction) {
  console.log(`\n--- Running check: ${name} ---`)
  try {
    await checkFunction()
    console.log(`✅ ${name} PASSED`)
    return true
  } catch (error) {
    console.error(`❌ ${name} FAILED: ${error.message}`)
    return false
  }
}

// 1. Alap API elérhetőség - Health Endpoint
async function checkHealthEndpoint() {
  console.log(`Checking /api/health at: ${BASE_URL}/api/health`)
  const res = await fetch(`${BASE_URL}/api/health`)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Health endpoint failed with status ${res.status}: ${errorText}`)
  }
  const data = await res.json()
  if (data.status !== "ok") {
    throw new Error(`Health endpoint returned unexpected status: ${JSON.stringify(data)}`)
  }
  console.log(`   Health status: ${data.status}, Timestamp: ${data.timestamp}`)
}

// 2. Meccsadatok - Lista lekérdezése
async function checkMatchesList() {
  console.log(`Checking /api/matches list at: ${BASE_URL}/api/matches`)
  const res = await fetch(`${BASE_URL}/api/matches`)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Matches list endpoint failed with status ${res.status}: ${errorText}`)
  }
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Matches list returned empty or not an array: ${JSON.stringify(data)}`)
  }
  const firstMatch = data[0]
  const requiredFields = [
    "id",
    "match_date",
    "home_team_name", // Updated field name
    "away_team_name", // Updated field name
    "home_score", // Assuming score_home is now home_score
    "away_score", // Assuming score_away is now away_score
  ]
  for (const field of requiredFields) {
    if (typeof firstMatch[field] === "undefined") {
      throw new Error(`First match in list missing required field '${field}': ${JSON.stringify(firstMatch)}`)
    }
  }
  // Check for consistency of team name fields
  if (typeof firstMatch.home_team_name !== "string" || typeof firstMatch.away_team_name !== "string") {
    throw new Error(`home_team_name or away_team_name is not a string in matches list: ${JSON.stringify(firstMatch)}`)
  }

  console.log(
    `   Found ${data.length} matches. First match example: ${JSON.stringify(firstMatch).substring(0, 200)}...`,
  )
}

// 2. Meccsadatok - Egyedi meccs lekérdezése
async function checkSingleMatch() {
  console.log(`Checking /api/matches/:id. Attempting to fetch a known ID (e.g., '1').`)
  // You might need to adjust this ID based on your actual database content
  // Or fetch a list first and pick an ID from there
  const exampleMatchId = "1" // Placeholder, replace with an actual ID from your DB if needed

  // First, try to get a valid ID if '1' doesn't exist
  let actualMatchId = exampleMatchId
  try {
    const matchesRes = await fetch(`${BASE_URL}/api/matches?limit=1`)
    const matchesData = await matchesRes.json()
    if (matchesData && matchesData.length > 0 && matchesData[0].id) {
      actualMatchId = matchesData[0].id
      console.log(`   Using actual match ID from list: ${actualMatchId}`)
    } else {
      console.warn(`   Could not fetch an actual match ID. Using placeholder: ${exampleMatchId}`)
    }
  } catch (e) {
    console.warn(`   Failed to fetch matches list to get an ID: ${e.message}. Using placeholder: ${exampleMatchId}`)
  }

  const res = await fetch(`${BASE_URL}/api/matches/${actualMatchId}`)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Single match endpoint failed with status ${res.status}: ${errorText}`)
  }
  const data = await res.json()
  if (!data.id || data.id !== actualMatchId) {
    throw new Error(`Single match returned unexpected ID or structure: ${JSON.stringify(data)}`)
  }
  // Check for consistency of team name fields
  if (typeof data.home_team_name !== "string" || typeof data.away_team_name !== "string") {
    throw new Error(`home_team_name or away_team_name is not a string in single match: ${JSON.stringify(data)}`)
  }
  console.log(`   Single match details for ID ${actualMatchId}: ${JSON.stringify(data).substring(0, 200)}...`)
}

// 2. Meccsadatok - Nem létező ID
async function checkNonExistentMatch() {
  console.log(`Checking /api/matches/:id for non-existent ID at: ${BASE_URL}/api/matches/nonexistentid123`)
  const res = await fetch(`${BASE_URL}/api/matches/nonexistentid123`)
  if (res.status !== 404) {
    const errorText = await res.text()
    throw new Error(`Expected 404 Not Found for non-existent match, got ${res.status}: ${errorText}`)
  }
  const data = await res.json()
  if (!data.error || !data.error.includes("nem található")) {
    throw new Error(`Unexpected error response for non-existent match: ${JSON.stringify(data)}`)
  }
  console.log("   Non-existent match returned 404 as expected.")
}

// 3. Prediction API
async function checkPredictionEndpoint() {
  console.log(`Checking Prediction endpoint at: ${BASE_URL}/api/enhanced-prediction`)
  const testParams = {
    home_team: "Real Madrid",
    away_team: "Barcelona",
    league: "spain",
    match_date: "2025-08-15", // Example date
  }
  const queryString = new URLSearchParams(testParams).toString()
  const url = `${BASE_URL}/api/enhanced-prediction?${queryString}`

  const res = await fetch(url)
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Prediction endpoint failed with status ${res.status}: ${errorText}`)
  }
  const data = await res.json()

  // Validate response structure
  const requiredFields = ["predictions", "confidence", "features", "model_version", "meta"]
  for (const field of requiredFields) {
    if (typeof data[field] === "undefined") {
      throw new Error(`Missing required field '${field}' in prediction response: ${JSON.stringify(data)}`)
    }
  }

  // Validate meta fields
  if (typeof data.meta.generated_at === "undefined" || isNaN(new Date(data.meta.generated_at).getTime())) {
    throw new Error(`Invalid or missing 'generated_at' in meta: ${data.meta.generated_at}`)
  }
  if (typeof data.meta.generation_time_ms === "undefined" || typeof data.meta.generation_time_ms !== "number") {
    throw new Error(`Invalid or missing 'generation_time_ms' in meta: ${data.meta.generation_time_ms}`)
  }
  if (typeof data.meta.cache_hit === "undefined" || typeof data.meta.cache_hit !== "boolean") {
    throw new Error(`Invalid or missing 'cache_hit' in meta: ${data.meta.cache_hit}`)
  }

  console.log("   Response example:", JSON.stringify(data, null, 2).substring(0, 500) + "...") // Log first 500 chars
  console.log(`   Generation Time: ${data.meta.generation_time_ms}ms, Cache Hit: ${data.meta.cache_hit}`)

  // Performance check
  if (data.meta.generation_time_ms > 2000 && !data.meta.cache_hit) {
    console.warn(`   ⚠️ Warning: Fresh prediction took ${data.meta.generation_time_ms}ms, which is > 2s.`)
  }
  if (data.meta.generation_time_ms > 200 && data.meta.cache_hit) {
    console.warn(`   ⚠️ Warning: Cached prediction took ${data.meta.generation_time_ms}ms, which is > 200ms.`)
  }
}

// 3. Prediction API - Hiányzó paraméter
async function checkPredictionEndpointMissingParams() {
  console.log(`Checking Prediction endpoint with missing parameters at: ${BASE_URL}/api/enhanced-prediction`)
  const url = `${BASE_URL}/api/enhanced-prediction?home_team=Real Madrid` // Missing away_team and league

  const res = await fetch(url)
  if (res.status !== 400) {
    // Expecting Bad Request
    const errorText = await res.text()
    throw new Error(`Expected 400 Bad Request for missing params, got ${res.status}: ${errorText}`)
  }
  const data = await res.json()
  if (!data.error || !data.error.includes("paraméterek szükségesek")) {
    // Hungarian error message expected
    throw new Error(`Unexpected error response for missing params: ${JSON.stringify(data)}`)
  }
  console.log("   Response example (missing params):", JSON.stringify(data, null, 2))
}

// 4. Supabase integráció - Cache Hit ellenőrzés
async function checkCacheHitBehavior() {
  console.log(`Checking Cache Hit behavior for Prediction endpoint.`)
  const testParams = {
    home_team: "Real Madrid",
    away_team: "Barcelona",
    league: "spain",
    match_date: "2025-08-16", // Use a different date to ensure fresh calculation first
  }
  const queryString = new URLSearchParams(testParams).toString()
  const url = `${BASE_URL}/api/enhanced-prediction?${queryString}`

  // First call (should be cache miss)
  console.log("   First call (expecting cache miss)...")
  const res1 = await fetch(url)
  if (!res1.ok) throw new Error(`First prediction call failed: ${res1.status}`)
  const data1 = await res1.json()
  if (data1.meta.cache_hit) {
    throw new Error(`Expected cache miss on first call, but got cache hit.`)
  }
  console.log(`   First call: Cache Hit = ${data1.meta.cache_hit}, Time = ${data1.meta.generation_time_ms}ms`)

  // Second call (should be cache hit)
  console.log("   Second call (expecting cache hit)...")
  const res2 = await fetch(url)
  if (!res2.ok) throw new Error(`Second prediction call failed: ${res2.status}`)
  const data2 = await res2.json()
  if (!data2.meta.cache_hit) {
    throw new Error(`Expected cache hit on second call, but got cache miss.`)
  }
  if (data2.meta.generation_time_ms > 200) {
    console.warn(`   ⚠️ Warning: Cached prediction took ${data2.meta.generation_time_ms}ms, which is > 200ms.`)
  }
  console.log(`   Second call: Cache Hit = ${data2.meta.cache_hit}, Time = ${data2.meta.generation_time_ms}ms`)
}

// 6. Hibakezelés - Hibás route
async function checkInvalidRoute() {
  console.log(`Checking invalid route at: ${BASE_URL}/api/non-existent-route`)
  const res = await fetch(`${BASE_URL}/api/non-existent-route`)
  if (res.status !== 404) {
    const errorText = await res.text()
    throw new Error(`Expected 404 Not Found for invalid route, got ${res.status}: ${errorText}`)
  }
  console.log("   Invalid route returned 404 as expected.")
}
;(async () => {
  console.log("Starting backend functional checks...")
  let allPassed = true

  // Run checks sequentially
  allPassed = (await runCheck("Health Endpoint", checkHealthEndpoint)) && allPassed
  allPassed = (await runCheck("Matches List Endpoint", checkMatchesList)) && allPassed
  allPassed = (await runCheck("Single Match Endpoint", checkSingleMatch)) && allPassed
  allPassed = (await runCheck("Non-Existent Match Handling (404)", checkNonExistentMatch)) && allPassed
  allPassed = (await runCheck("Prediction Endpoint (Valid Params)", checkPredictionEndpoint)) && allPassed
  allPassed =
    (await runCheck("Prediction Endpoint (Missing Params)", checkPredictionEndpointMissingParams)) && allPassed
  allPassed = (await runCheck("Cache Hit Behavior", checkCacheHitBehavior)) && allPassed
  allPassed = (await runCheck("Invalid Route Handling (404)", checkInvalidRoute)) && allPassed

  if (allPassed) {
    console.log("\nAll backend functional checks passed ✅")
  } else {
    console.error("\n❌ Some backend functional checks FAILED.")
    process.exit(1) // Exit with a non-zero code to indicate failure
  }
})()
