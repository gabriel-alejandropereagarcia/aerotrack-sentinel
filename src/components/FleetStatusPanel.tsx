"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Truck, ExternalLink } from "lucide-react"
import { useUpdateFleetStatus } from "@/hooks/useArkivData"
import type { FleetProfile } from "@/types"

const STATUS_MAP: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  0: { label: "Inactivo", variant: "secondary", color: "zinc" },
  1: { label: "Operativo", variant: "default", color: "emerald" },
  2: { label: "En Mantenci\u00f3n", variant: "outline", color: "amber" },
  3: { label: "Emergencia", variant: "destructive", color: "red" },
}

const STATUS_OPTIONS = [
  { value: 0, label: "Inactivo" },
  { value: 1, label: "Operativo" },
  { value: 2, label: "Mantenci\u00f3n" },
  { value: 3, label: "Emergencia" },
]

function shortenHash(hash: string | undefined): string {
  if (!hash) return ""
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

const BLOCK_EXPLORER = "https://explorer.braga.hoodi.arkiv.network"

interface FleetStatusPanelProps {
  fleets: FleetProfile[]
  isLoading: boolean
  selectedFleetId: string | null
  onSelectFleet: (fleetId: string | null) => void
}

export function FleetStatusPanel({ fleets, isLoading, selectedFleetId, onSelectFleet }: FleetStatusPanelProps) {
  const updateStatus = useUpdateFleetStatus()
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)

  const handleStatusChange = (fleet: FleetProfile, newStatus: number) => {
    setUpdatingKey(fleet.arkivEntityKey)
    updateStatus.mutate(
      {
        entityKey: fleet.arkivEntityKey,
        operationalStatus: newStatus,
        payload: fleet.payload,
        fleetId: fleet.fleetId,
      },
      {
        onSettled: () => setUpdatingKey(null),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-700 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (fleets.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 text-center text-zinc-500">
          No hay flotas registradas. Carg\u00e1 datos de prueba para comenzar.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {fleets.map((fleet) => {
        const status = STATUS_MAP[fleet.operationalStatus] ?? { label: "Desconocido", variant: "outline" as const, color: "zinc" }
        const isSelected = selectedFleetId === fleet.fleetId
        const isUpdating = updatingKey === fleet.arkivEntityKey

        return (
          <Card
            key={fleet.arkivEntityKey}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected
                ? "bg-zinc-800 border-cyan-500/70 ring-1 ring-cyan-500/30"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
            }`}
            onClick={() => onSelectFleet(isSelected ? null : fleet.fleetId)}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-zinc-100">{fleet.fleetId}</CardTitle>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <MapPin className="h-3 w-3" />
                <span>{fleet.payload.mainRoute}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <Truck className="h-3 w-3" />
                <span>{fleet.payload.vehicleType}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-zinc-800/50">
                <a
                  href={`${BLOCK_EXPLORER}/tx/${fleet.arkivEntityKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-zinc-600 hover:text-cyan-400 transition-colors flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                  title="Ver entidad en el explorador de bloques"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {shortenHash(fleet.arkivEntityKey)}
                </a>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {STATUS_OPTIONS.filter((o) => o.value !== fleet.operationalStatus).map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant="ghost"
                    className="h-5 text-[10px] px-1.5 text-zinc-500 hover:text-zinc-300"
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(fleet, opt.value)
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {updateStatus.isSuccess && updateStatus.data && (
                <div className="mt-1">
                  <a
                    href={`${BLOCK_EXPLORER}/tx/${updateStatus.data.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-500 hover:text-emerald-400 font-mono"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Tx: {shortenHash(updateStatus.data.txHash)} \u2713
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}