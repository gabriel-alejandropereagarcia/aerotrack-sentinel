import { jsonToPayload } from "@arkiv-network/sdk/utils"
import { getWalletClient, PROJECT_ATTRIBUTE, ENTITY_TYPES, EXPIRATION } from "@/lib/arkiv"
import { publicClient } from "@/lib/arkiv"
import { serializeWrite } from "@/lib/arkiv-errors"
import type { FleetProfilePayload, RoutingDecisionPayload } from "@/types"

export async function updateFleetStatus(params: {
  entityKey: string
  operationalStatus: number
  payload: FleetProfilePayload
  fleetId: string
}): Promise<{ txHash: string }> {
  const walletClient = getWalletClient()

  const { txHash } = await serializeWrite(() =>
    walletClient.updateEntity({
      entityKey: params.entityKey as `0x${string}`,
      payload: jsonToPayload(params.payload),
      contentType: "application/json",
      attributes: [
        PROJECT_ATTRIBUTE,
        { key: "type", value: ENTITY_TYPES.FLEET_PROFILE },
        { key: "fleetId", value: params.fleetId },
        { key: "operationalStatus", value: params.operationalStatus },
      ],
      expiresIn: EXPIRATION.FLEET_PROFILE,
    })
  )

  return { txHash }
}

export async function getEntityDetails(entityKey: string) {
  const entity = await publicClient.getEntity(entityKey as `0x${string}`)
  return {
    key: entity.key,
    payload: entity.toJson(),
    attributes: entity.attributes,
  }
}

export async function createFleetProfile(params: {
  fleetId: string
  operationalStatus: number
  payload: FleetProfilePayload
}): Promise<{ entityKey: string; txHash: string }> {
  const walletClient = getWalletClient()

  const result = await serializeWrite(() =>
    walletClient.createEntity({
      payload: jsonToPayload(params.payload),
      contentType: "application/json",
      attributes: [
        PROJECT_ATTRIBUTE,
        { key: "type", value: ENTITY_TYPES.FLEET_PROFILE },
        { key: "fleetId", value: params.fleetId },
        { key: "operationalStatus", value: params.operationalStatus },
      ],
      expiresIn: EXPIRATION.FLEET_PROFILE,
    })
  )

  return { entityKey: result.entityKey, txHash: result.txHash }
}

export async function createRoutingDecision(params: {
  fleetId: string
  riskScore: number
  payload: RoutingDecisionPayload
}): Promise<{ entityKey: string; txHash: string }> {
  const walletClient = getWalletClient()

  const result = await serializeWrite(() =>
    walletClient.createEntity({
      payload: jsonToPayload(params.payload),
      contentType: "application/json",
      attributes: [
        PROJECT_ATTRIBUTE,
        { key: "type", value: ENTITY_TYPES.ROUTING_DECISION },
        { key: "fleetId", value: params.fleetId },
        { key: "riskScore", value: params.riskScore },
        { key: "createdAt", value: Date.now() },
      ],
      expiresIn: EXPIRATION.ROUTING_DECISION,
    })
  )

  return { entityKey: result.entityKey, txHash: result.txHash }
}

export async function seedDemoData(): Promise<{
  fleetProfiles: Array<{ entityKey: string; txHash: string }>
  routingDecisions: Array<{ entityKey: string; txHash: string }>
}> {
  const walletClient = getWalletClient()

  const fleets: Array<{
    fleetId: string
    operationalStatus: number
    payload: FleetProfilePayload
  }> = [
    {
      fleetId: "flota-norte-01",
      operationalStatus: 1,
      payload: { mainRoute: "Ruta 9 - Norte", vehicleType: "Transporte Pesado" },
    },
    {
      fleetId: "flota-sur-02",
      operationalStatus: 1,
      payload: { mainRoute: "Ruta 3 - Sur", vehicleType: "Refrigerado" },
    },
    {
      fleetId: "flota-centro-03",
      operationalStatus: 0,
      payload: { mainRoute: "Ruta 2 - Centro", vehicleType: "Carga Liviana" },
    },
  ]

  const decisions: Array<{
    fleetId: string
    riskScore: number
    payload: RoutingDecisionPayload
  }> = [
    { fleetId: "flota-norte-01", riskScore: 8, payload: { aiJustification: "Desv\u00edo sugerido por clima adverso en Ruta 9 Norte. Tormenta el\u00e9ctrica con visibilidad reducida.", model: "aero-v2" } },
    { fleetId: "flota-norte-01", riskScore: 3, payload: { aiJustification: "Tr\u00e1fico leve detectado. Ruta habitual sin inconvenientes.", model: "aero-v2" } },
    { fleetId: "flota-sur-02", riskScore: 7, payload: { aiJustification: "Alerta de corte de ruta por protestas en Ruta 3 Sur. Desv\u00edo recomendado.", model: "aero-v2" } },
    { fleetId: "flota-sur-02", riskScore: 9, payload: { aiJustification: "Nieve intensa en pasos andinos. Riesgo extremo para transporte refrigerado.", model: "aero-v2" } },
    { fleetId: "flota-centro-03", riskScore: 2, payload: { aiJustification: "Condiciones \u00f3ptimas en Ruta 2 Centro. Sin alertas.", model: "aero-v1" } },
    { fleetId: "flota-norte-01", riskScore: 6, payload: { aiJustification: "Obra en tramo de Ruta 9. Retraso estimado 45 min. Desv\u00edo alternativo disponible.", model: "aero-v2" } },
    { fleetId: "flota-sur-02", riskScore: 4, payload: { aiJustification: "Lluvia moderada en Ruta 3 Sur. Precauci\u00f3n pero sin necesidad de desv\u00edo.", model: "aero-v1" } },
    { fleetId: "flota-centro-03", riskScore: 10, payload: { aiJustification: "Emergencia: puente colapsado en Ruta 2. Desv\u00edo obligatorio por Ruta Alternativa 5.", model: "aero-v2" } },
  ]

  const fleetCreates = fleets.map((f) => ({
    payload: jsonToPayload(f.payload),
    contentType: "application/json" as const,
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.FLEET_PROFILE },
      { key: "fleetId", value: f.fleetId },
      { key: "operationalStatus", value: f.operationalStatus },
    ],
    expiresIn: EXPIRATION.FLEET_PROFILE,
  }))

  const decisionCreates = decisions.map((d) => ({
    payload: jsonToPayload(d.payload),
    contentType: "application/json" as const,
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "type", value: ENTITY_TYPES.ROUTING_DECISION },
      { key: "fleetId", value: d.fleetId },
      { key: "riskScore", value: d.riskScore },
      { key: "createdAt", value: Date.now() - Math.floor(Math.random() * 86400000) },
    ],
    expiresIn: EXPIRATION.ROUTING_DECISION,
  }))

  const fleetResult = await serializeWrite(() =>
    walletClient.mutateEntities({ creates: fleetCreates })
  )
  const decisionResult = await serializeWrite(() =>
    walletClient.mutateEntities({ creates: decisionCreates })
  )

  return {
    fleetProfiles: fleetResult.createdEntities.map((key) => ({ entityKey: key, txHash: fleetResult.txHash })),
    routingDecisions: decisionResult.createdEntities.map((key) => ({ entityKey: key, txHash: decisionResult.txHash })),
  }
}