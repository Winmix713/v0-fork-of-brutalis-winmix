import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

export type Match = Database["public"]["Tables"]["matches"]["Row"]

// Client-side Supabase client (for public data and auth)
// This client uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// which are exposed to the browser.
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Server-side Supabase client (for sensitive operations using service role key)
// This client uses SUPABASE_SERVICE_ROLE_KEY which MUST NOT be exposed to the browser.
// It should only be used in server-side contexts (e.g., API routes, Server Actions).
let supabaseServiceRole: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseServiceRoleClient() {
  // Ensure this client is only initialized and used on the server.
  if (typeof window !== "undefined") {
    console.error("Supabase service role client should only be used on the server.")
    throw new Error("Supabase service role client cannot be used on the client-side.")
  }

  if (!supabaseServiceRole) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is not defined.")
      throw new Error("Supabase URL is not defined for service role client.")
    }
    if (!supabaseServiceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not defined. Cannot initialize service role client.")
      throw new Error("Supabase service role key is not defined for service role client.")
    }

    supabaseServiceRole = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false, // Service role client typically doesn't need session persistence
      },
    })
  }
  return supabaseServiceRole
}

// Helper function to save enhanced prediction data
// This function should only be called from server-side code (e.g., API routes, Server Actions)
export async function saveEnhancedPrediction(predictionData: Database["public"]["Tables"]["predictions"]["Insert"]) {
  const supabase = getSupabaseServiceRoleClient() // Get the server-side client

  console.log("Attempting to save predictionData:", JSON.stringify(predictionData, null, 2))

  const { data, error } = await supabase
    .from("predictions")
    .upsert(predictionData, { onConflict: "cache_key" })
    .select()
    .single()

  if (error) {
    console.error("Error saving enhanced prediction:", error)
    throw new Error(`Failed to save enhanced prediction: ${error.message}`)
  }

  console.log("Successfully saved enhanced prediction:", data)
  return data
}
