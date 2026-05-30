"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchAllFleetProfiles,
  fetchAllRoutingDecisions,
  fetchHighRiskDecisions,
  fetchDecisionsByFleet,
} from "@/services/arkivqueries"
import type { SimulateIaResponse, SeedDemoResponse } from "@/types"

export function useFleetProfiles() {
  return useQuery({
    queryKey: ["arkiv", "fleet_profiles"],
    queryFn: fetchAllFleetProfiles,
    refetchInterval: 30_000,
  })
}

export function useRoutingDecisions() {
  return useQuery({
    queryKey: ["arkiv", "routing_decisions"],
    queryFn: fetchAllRoutingDecisions,
    refetchInterval: 15_000,
  })
}

export function useHighRiskDecisions() {
  return useQuery({
    queryKey: ["arkiv", "high_risk_decisions"],
    queryFn: fetchHighRiskDecisions,
    refetchInterval: 15_000,
  })
}

export function useDecisionsByFleet(fleetId: string | null) {
  return useQuery({
    queryKey: ["arkiv", "routing_decisions", "fleet", fleetId],
    queryFn: () => fetchDecisionsByFleet(fleetId!),
    enabled: !!fleetId,
  })
}

export function useSimulateIa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<SimulateIaResponse> => {
      const res = await fetch("/api/simulate-ia", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Error al crear la decisión en Arkiv")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arkiv"] })
    },
  })
}

export function useSeedDemo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<SeedDemoResponse> => {
      const res = await fetch("/api/seed-demo", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Error al cargar datos de prueba")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arkiv"] })
    },
  })
}

export function useUpdateFleetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      entityKey: string
      operationalStatus: number
      payload: { mainRoute: string; vehicleType: string }
      fleetId: string
    }): Promise<{ txHash: string }> => {
      const res = await fetch("/api/update-fleet-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Error al actualizar estado de la flota")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arkiv"] })
    },
  })
}