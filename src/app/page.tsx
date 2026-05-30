"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/DashboardHeader"
import { FleetStatusPanel } from "@/components/FleetStatusPanel"
import { RiskDecisionsTable } from "@/components/RiskDecisionsTable"
import { SimulateIaButton } from "@/components/SimulateIaButton"
import { useFleetProfiles, useRoutingDecisions, useSimulateIa, useSeedDemo } from "@/hooks/useArkivData"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, ShieldAlert, BarChart3, ExternalLink } from "lucide-react"

const BLOCK_EXPLORER = "https://explorer.braga.hoodi.arkiv.network"

export default function DashboardPage() {
  const [selectedFleetId, setSelectedFleetId] = useState<string | null>(null)

  const { data: fleets = [], isLoading: fleetsLoading, error: fleetsError } = useFleetProfiles()
  const { data: decisions = [], isLoading: decisionsLoading, error: decisionsError } = useRoutingDecisions()

  const simulateIa = useSimulateIa()
  const seedDemo = useSeedDemo()

  const highRiskDecisions = selectedFleetId
    ? decisions.filter((d) => d.fleetId === selectedFleetId)
    : decisions.filter((d) => d.riskScore > 5)

  const error = fleetsError || decisionsError

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              No se pudo conectar con la red Arkiv. Verificá tu conexión e intentá de nuevo.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SimulateIaButton
            onSimulate={() => simulateIa.mutate()}
            onSeed={() => seedDemo.mutate()}
            isSimulating={simulateIa.isPending}
            isSeeding={seedDemo.isPending}
          />
        </div>

        {simulateIa.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al simular IA</AlertTitle>
            <AlertDescription>
              {(simulateIa.error as Error)?.message || "No se pudo crear la decisión en Arkiv."}
            </AlertDescription>
          </Alert>
        )}

        {seedDemo.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar datos</AlertTitle>
            <AlertDescription>
              {(seedDemo.error as Error)?.message || "No se pudo crear los datos de prueba en Arkiv."}
            </AlertDescription>
          </Alert>
        )}

        {simulateIa.isSuccess && simulateIa.data && (
          <Alert className="mb-4 bg-emerald-950/50 border-emerald-800 text-emerald-300">
            <AlertTitle>Decisión registrada en Arkiv</AlertTitle>
            <AlertDescription className="flex flex-col gap-1">
              <span>Flota: {simulateIa.data.fleetId} · Riesgo: {simulateIa.data.riskScore}/10</span>
              <a
                href={`${BLOCK_EXPLORER}/tx/${simulateIa.data.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Ver transacción en explorador: {simulateIa.data.txHash.slice(0, 16)}...
              </a>
            </AlertDescription>
          </Alert>
        )}

        {seedDemo.isSuccess && seedDemo.data && (
          <Alert className="mb-4 bg-emerald-950/50 border-emerald-800 text-emerald-300">
            <AlertTitle>Datos de prueba cargados en Arkiv</AlertTitle>
            <AlertDescription className="flex flex-col gap-1">
              <span>{seedDemo.data.fleetProfiles.length} flotas + {seedDemo.data.routingDecisions.length} decisiones de ruta creadas.</span>
              {seedDemo.data.fleetProfiles.length > 0 && (
                <a
                  href={`${BLOCK_EXPLORER}/tx/${seedDemo.data.fleetProfiles[0].txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver transacción batch en explorador
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Flotas
              </h2>
            </div>
            <FleetStatusPanel
              fleets={fleets}
              isLoading={fleetsLoading}
              selectedFleetId={selectedFleetId}
              onSelectFleet={setSelectedFleetId}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                {selectedFleetId
                  ? `Decisiones para ${selectedFleetId}`
                  : "Decisiones de Alto Riesgo (score > 5)"}
              </h2>
            </div>
            <RiskDecisionsTable
              decisions={highRiskDecisions}
              isLoading={decisionsLoading}
            />

            {selectedFleetId && (
              <button
                onClick={() => setSelectedFleetId(null)}
                className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                Ver solo alto riesgo
              </button>
            )}
          </div>
        </div>

        <Separator className="my-8 bg-zinc-800" />

        <div className="text-center text-xs text-zinc-600 pb-6 space-y-1">
          <p>AeroTrack Sentinel — Datos inmutables en Arkiv Testnet (Braga)</p>
          <p className="text-zinc-700">Hackathon ARKIV × PunaTech 2026 · Cada transacción es verificable en el explorador de bloques</p>
        </div>
      </main>
    </div>
  )
}