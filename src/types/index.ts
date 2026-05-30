export interface FleetProfilePayload {
  mainRoute: string
  vehicleType: string
}

export interface RoutingDecisionPayload {
  aiJustification: string
  model: string
}

export interface FleetProfile {
  arkivEntityKey: string
  fleetId: string
  operationalStatus: number
  payload: FleetProfilePayload
  creator?: string
  owner?: string
}

export interface RoutingDecision {
  arkivEntityKey: string
  fleetId: string
  riskScore: number
  createdAt: number
  payload: RoutingDecisionPayload
  creator?: string
  owner?: string
}

export interface SimulateIaResponse {
  entityKey: string
  txHash: string
  fleetId: string
  riskScore: number
  aiJustification: string
}

export interface SeedDemoResponse {
  fleetProfiles: Array<{ entityKey: string; txHash: string }>
  routingDecisions: Array<{ entityKey: string; txHash: string }>
}