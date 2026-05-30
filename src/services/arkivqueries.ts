import { eq, gt, desc } from "@arkiv-network/sdk/query"
import { publicClient, PROJECT_ATTRIBUTE, ENTITY_TYPES, getCreatorWalletAddress } from "@/lib/arkiv"
import type { FleetProfile, RoutingDecision } from "@/types"

function getAttrValue(attrs: Array<{ key: string; value: string | number }>, key: string): string | number | undefined {
  const attr = attrs.find((a) => a.key === key)
  return attr?.value
}

function parseFleetProfile(entity: { key: string; attributes: Array<{ key: string; value: string | number }>; toJson: () => Record<string, unknown>; owner?: string; creator?: string }): FleetProfile {
  const payload = entity.toJson()
  const attrs = entity.attributes
  return {
    arkivEntityKey: entity.key,
    fleetId: String(getAttrValue(attrs, "fleetId") ?? ""),
    operationalStatus: Number(getAttrValue(attrs, "operationalStatus") ?? 0),
    payload: {
      mainRoute: String(payload.mainRoute ?? ""),
      vehicleType: String(payload.vehicleType ?? ""),
    },
    creator: entity.creator,
    owner: entity.owner,
  }
}

function parseRoutingDecision(entity: { key: string; attributes: Array<{ key: string; value: string | number }>; toJson: () => Record<string, unknown>; owner?: string; creator?: string }): RoutingDecision {
  const payload = entity.toJson()
  const attrs = entity.attributes
  return {
    arkivEntityKey: entity.key,
    fleetId: String(getAttrValue(attrs, "fleetId") ?? ""),
    riskScore: Number(getAttrValue(attrs, "riskScore") ?? 0),
    createdAt: Number(getAttrValue(attrs, "createdAt") ?? 0),
    payload: {
      aiJustification: String(payload.aiJustification ?? ""),
      model: String(payload.model ?? ""),
    },
    creator: entity.creator,
    owner: entity.owner,
  }
}

export async function fetchAllFleetProfiles(): Promise<FleetProfile[]> {
  const creatorWallet = getCreatorWalletAddress()

  let query = publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", ENTITY_TYPES.FLEET_PROFILE),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(100)

  if (creatorWallet) {
    query = query.createdBy(creatorWallet)
  }

  const result = await query.fetch()

  const profiles: FleetProfile[] = []
  for (const entity of result.entities) {
    try {
      profiles.push(parseFleetProfile(entity as unknown as Parameters<typeof parseFleetProfile>[0]))
    } catch {
      continue
    }
  }

  if (result.hasNextPage()) {
    await result.next()
    for (const entity of result.entities) {
      try {
        profiles.push(parseFleetProfile(entity as unknown as Parameters<typeof parseFleetProfile>[0]))
      } catch {
        continue
      }
    }
  }

  return profiles
}

export async function fetchAllRoutingDecisions(): Promise<RoutingDecision[]> {
  const creatorWallet = getCreatorWalletAddress()

  let query = publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", ENTITY_TYPES.ROUTING_DECISION),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .orderBy(desc("createdAt", "number"))
    .limit(100)

  if (creatorWallet) {
    query = query.createdBy(creatorWallet)
  }

  const result = await query.fetch()

  const decisions: RoutingDecision[] = []
  for (const entity of result.entities) {
    try {
      decisions.push(parseRoutingDecision(entity as unknown as Parameters<typeof parseRoutingDecision>[0]))
    } catch {
      continue
    }
  }
  return decisions
}

export async function fetchHighRiskDecisions(): Promise<RoutingDecision[]> {
  const creatorWallet = getCreatorWalletAddress()

  let query = publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", ENTITY_TYPES.ROUTING_DECISION),
      gt("riskScore", 5),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .orderBy(desc("riskScore", "number"))
    .limit(100)

  if (creatorWallet) {
    query = query.createdBy(creatorWallet)
  }

  const result = await query.fetch()

  const decisions: RoutingDecision[] = []
  for (const entity of result.entities) {
    try {
      decisions.push(parseRoutingDecision(entity as unknown as Parameters<typeof parseRoutingDecision>[0]))
    } catch {
      continue
    }
  }
  return decisions
}

export async function fetchDecisionsByFleet(fleetId: string): Promise<RoutingDecision[]> {
  const creatorWallet = getCreatorWalletAddress()

  let query = publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("type", ENTITY_TYPES.ROUTING_DECISION),
      eq("fleetId", fleetId),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .orderBy(desc("createdAt", "number"))
    .limit(50)

  if (creatorWallet) {
    query = query.createdBy(creatorWallet)
  }

  const result = await query.fetch()

  const decisions: RoutingDecision[] = []
  for (const entity of result.entities) {
    try {
      decisions.push(parseRoutingDecision(entity as unknown as Parameters<typeof parseRoutingDecision>[0]))
    } catch {
      continue
    }
  }
  return decisions
}