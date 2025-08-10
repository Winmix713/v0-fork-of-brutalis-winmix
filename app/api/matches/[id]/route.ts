import { NextResponse } from "next/server"
import { getMatchById } from "@/lib/matches" // Assuming getMatchById is in lib/matches.ts

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const match = await getMatchById(id)

    if (!match) {
      return NextResponse.json({ error: "Mérkőzés nem található" }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error(`Error in /api/matches/${params.id}:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ismeretlen hiba a mérkőzés lekérdezése során" },
      { status: 500 },
    )
  }
}
