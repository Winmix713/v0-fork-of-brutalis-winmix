import { NextResponse } from "next/server"
import { getMatches } from "@/lib/matches" // Assuming getMatches is in lib/matches.ts

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)

    const matches = await getMatches(limit, offset)
    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error in /api/matches:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ismeretlen hiba a meccsek lekérdezése során" },
      { status: 500 },
    )
  }
}
