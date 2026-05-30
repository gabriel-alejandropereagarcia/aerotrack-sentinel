"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/DashboardHeader"
import { FleetStatusPanel } from "@/components/FleetStatusPanel"
import { RiskDecisionsTable } from "@/components/RiskDecisionsTable"
import { SimulateIaButton } from "@/components/SimulateIaButton"
import { useFleetProfiles, useRoutingDecisions, useSimulateIa, useSeedDemo } from "@/hooks/useArkivData"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, ShieldAlert, BarChart3 } from "lucide-react"

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
            <AlertTitle>Error de conexi\u00f3n</AlertTitle>
            <AlertDescription>
              No se pudo conectar con la red Arkiv. Verific\u00e1 tu conexi\u00f3n e intent\u00e1 de nuevo.
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
              {(simulateIa.error as Error)?.message || "No se pudo crear la decisi\u00f3n en Arkiv."}
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

        {simulateIa.isSuccess && (
          <Alert className="mb-4 bg-emerald-950/50 border-emerald-800 text-emerald-300">
            <AlertTitle>Decisi\u00f3n registrada</AlertTitle>
            <AlertDescription>
              Nueva decisi\u00f3n de ruta creada en Arkiv (Flota: {simulateIa.data.fleetId}, Riesgo: {simulateIa.data.riskScore}/10)
            </AlertDescription>
          </Alert>
        )}

        {seedDemo.isSuccess && (
          <Alert className="mb-4 bg-emerald-950/50 border-emerald-800 text-emerald-300">
            <AlertTitle>Datos de prueba cargados</AlertTitle>
            <AlertDescription>
              Se crearon {seedDemo.data.fleetProfiles.length} flotas y {seedDemo.data.routingDecisions.length} decisiones de ruta en Arkiv.
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

        <div className="text-center text-xs text-zinc-600 pb-6">
          AeroTrack Sentinel &mdash; Datos almacenados inmutablemente en Arkiv Testnet (Braga) &mdash; Hackathon ARKIV x PunaTech 2026
        </div>
      </main>
    </div>
  )
}