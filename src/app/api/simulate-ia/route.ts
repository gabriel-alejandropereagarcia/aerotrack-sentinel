import { NextResponse } from "next/server"
import { createRoutingDecision } from "@/services/arkivmutations"
import { classifyArkivError } from "@/lib/arkiv-errors"

const JUSTIFICATIONS = [
  "Desvío sugerido por clima adverso. Visibilidad reducida en ruta principal.",
  "Tráfico intenso detectado. Ruta alternativa más eficiente.",
  "Alerta de accidente vehicular en trayecto. Demora estimada 30 minutos.",
  "Nieve intensa en pasos andinos. Riesgo extremo para transporte.",
  "Obra en tramo de ruta. Desvío alternativo disponible.",
  "Protestas bloqueando Ruta 3. Desvío obligatorio por Ruta Alternativa.",
  "Condiciones óptimas. Sin alertas significativas.",
  "Emergencia: puente colapsado. Ruta completamente interrumpida.",
  "Lluvia moderada. Precaución pero sin necesidad de desvío.",
  "Viento fuerte con riesgo de vuelco para transporte pesado.",
]

const FLEET_IDS = ["flota-norte-01", "flota-sur-02", "flota-centro-03"]

export async function POST() {
  try {
    const fleetId = FLEET_IDS[Math.floor(Math.random() * FLEET_IDS.length)]
    const riskScore = Math.floor(Math.random() * 10) + 1
    const aiJustification = JUSTIFICATIONS[Math.floor(Math.random() * JUSTIFICATIONS.length)]
    const model = Math.random() > 0.5 ? "aero-v2" : "aero-v1"

    const result = await createRoutingDecision({
      fleetId,
      riskScore,
      payload: { aiJustification, model },
    })

    return NextResponse.json({
      entityKey: result.entityKey,
      txHash: result.txHash,
      fleetId,
      riskScore,
      aiJustification,
    })
  } catch (error) {
    console.error("Error simulating IA decision:", error)
    const classified = classifyArkivError(error)
    return NextResponse.json(
      { error: classified.message, category: classified.category },
      { status: classified.retryable ? 503 : 500 }
    )
  }
}