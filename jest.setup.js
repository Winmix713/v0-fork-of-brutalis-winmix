// jest.setup.js
// This file is executed before all tests.

// Mock environment variables for tests if needed
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key"

// Mock fetch API for tests
global.fetch = jest.fn((url, options) => {
  if (typeof url === "string" && url.includes("/api/enhanced-prediction")) {
    // Simulate successful prediction response
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          home_win_probability: 0.6,
          draw_probability: 0.2,
          away_win_probability: 0.2,
          predicted_home_goals: 2,
          predicted_away_goals: 1,
          predicted_total_goals: 3,
          confidence_score: 0.85,
          model_version: "test-v1.0",
          prediction_type: "test-enhanced",
          league: "Test League",
          predicted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          cache_key: "test-cache-key",
        }),
    })
  }
  // Default mock for other fetches
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
})

// Mock Supabase client for tests
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: { code: "PGRST116", message: "No rows found" } })), // Default to cache miss
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          distinct: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: { id: "mock-uuid", cache_key: "mock-cache-key" }, error: null }),
          ),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      rpc: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  })),
}))
