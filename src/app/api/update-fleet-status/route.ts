import { NextResponse } from "next/server"
import { updateFleetStatus } from "@/services/arkivmutations"
import { classifyArkivError } from "@/lib/arkiv-errors"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entityKey, operationalStatus, payload, fleetId } = body

    if (!entityKey || operationalStatus === undefined || !payload || !fleetId) {
      return NextResponse.json(
        { error: "Missing required fields: entityKey, operationalStatus, payload, fleetId" },
        { status: 400 }
      )
    }

    const result = await updateFleetStatus({
      entityKey,
      operationalStatus: Number(operationalStatus),
      payload,
      fleetId,
    })

    return NextResponse.json({ txHash: result.txHash })
  } catch (error) {
    console.error("Error updating fleet status:", error)
    const classified = classifyArkivError(error)
    return NextResponse.json(
      { error: classified.message, category: classified.category },
      { status: classified.retryable ? 503 : 500 }
    )
  }
}