# AGENTS.md — AeroTrack Sentinel

## Project Overview

AeroTrack Sentinel is a logistics audit dashboard for the ARKIV x PunaTech 2026 hackathon. It uses Arkiv (Braga testnet) as the data layer to immutably record AI-generated routing decisions.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (dark theme)
- @arkiv-network/sdk v0.6.8
- @tanstack/react-query

## Key Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Architecture

### Data Layer (Arkiv)

All data lives on Arkiv as entities, NOT in a traditional database.

**Two entity types:**

1. `fleet_profile` — Fleet metadata
   - Attributes: `project`, `type="fleet_profile"`, `fleetId` (string), `operationalStatus` (number)
   - Payload: `{ mainRoute, vehicleType }`
   - Expiration: 30 days

2. `routing_decision` — AI routing audit log
   - Attributes: `project`, `type="routing_decision"`, `fleetId` (FK), `riskScore` (number), `createdAt` (number)
   - Payload: `{ aiJustification, model }`
   - Expiration: 24 hours (86400s)

**Key file: `src/lib/arkiv.ts`**
- `PROJECT_ATTRIBUTE` — stamped on every entity and query
- `publicClient` — read-only, safe for frontend
- `getWalletClient()` — write operations, uses PRIVATE_KEY (server-side only)

### Conventions

- Every entity create and query MUST include `PROJECT_ATTRIBUTE`
- Numeric attributes (`riskScore`, `operationalStatus`, `createdAt`) are stored as numbers, NOT strings
- `fleetId` is the shared-attribute foreign key between both entities
- Use `ExpirationTime` helpers from `@arkiv-network/sdk/utils`
- The Arkiv SDK uses "expiration dates", never "TTL"
- Use `createdBy(trustedWallet)` for trusted data queries
- Blockchain is fully abstracted from the end user — no wallet signing in UI

### Environment

- `PRIVATE_KEY` — server-side wallet key for creating entities
- `NEXT_PUBLIC_ARKIV_RPC` — Arkiv Braga testnet RPC
- `PROJECT_SLUG` — unique namespace for this project in the shared Arkiv DB