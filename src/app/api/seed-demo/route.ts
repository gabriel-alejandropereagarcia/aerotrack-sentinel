import { NextResponse } from "next/server"
import { seedDemoData } from "@/services/arkivmutations"
import { classifyArkivError } from "@/lib/arkiv-errors"

export async function POST() {
  try {
    const result = await seedDemoData()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error seeding demo data:", error)
    const classified = classifyArkivError(error)
    return NextResponse.json(
      { error: classified.message, category: classified.category },
      { status: classified.retryable ? 503 : 500 }
    )
  }
}