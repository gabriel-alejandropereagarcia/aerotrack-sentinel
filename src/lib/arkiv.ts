import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk"
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts"
import { braga } from "@arkiv-network/sdk/chains"
import { ExpirationTime } from "@arkiv-network/sdk/utils"

export const PROJECT_ATTRIBUTE = {
  key: "project" as const,
  value: (process.env.PROJECT_SLUG ?? "aerotrack-sentinel"),
} as const

export const ENTITY_TYPES = {
  FLEET_PROFILE: "fleet_profile",
  ROUTING_DECISION: "routing_decision",
} as const

export const EXPIRATION = {
  FLEET_PROFILE: ExpirationTime.fromDays(30),
  ROUTING_DECISION: ExpirationTime.fromHours(24),
} as const

let _creatorWalletAddress: `0x${string}` | undefined

export function getCreatorWalletAddress(): `0x${string}` | undefined {
  if (_creatorWalletAddress) return _creatorWalletAddress
  const pk = process.env.PRIVATE_KEY
  if (!pk) return undefined
  _creatorWalletAddress = privateKeyToAccount(pk as `0x${string}`).address
  return _creatorWalletAddress
}

export const publicClient = createPublicClient({
  chain: braga,
  transport: http(),
})

export function getWalletClient() {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error("PRIVATE_KEY is not configured in environment variables")
  return createWalletClient({
    chain: braga,
    transport: http(),
    account: privateKeyToAccount(pk as `0x${string}`),
  })
}