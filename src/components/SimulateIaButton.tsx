"use client"

import { Button } from "@/components/ui/button"
import { Zap, Database, Loader2 } from "lucide-react"

interface SimulateIaButtonProps {
  onSimulate: () => void
  onSeed: () => void
  isSimulating: boolean
  isSeeding: boolean
}

export function SimulateIaButton({ onSimulate, onSeed, isSimulating, isSeeding }: SimulateIaButtonProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={onSimulate}
        disabled={isSimulating}
        className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 font-semibold"
      >
        {isSimulating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {isSimulating ? "Registrando..." : "Simular IA"}
      </Button>
      <Button
        onClick={onSeed}
        disabled={isSeeding}
        variant="outline"
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
      >
        {isSeeding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        {isSeeding ? "Cargando datos..." : "Cargar datos de prueba"}
      </Button>
    </div>
  )
}