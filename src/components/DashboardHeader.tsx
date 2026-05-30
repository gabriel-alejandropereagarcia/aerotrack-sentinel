import { Badge } from "@/components/ui/badge"
import { Activity, Radio, ExternalLink } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-600/10 border border-cyan-600/30">
              <Activity className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                AeroTrack Sentinel
              </h1>
              <p className="text-xs text-zinc-500">
                Auditoría logística con IA · Datos verificables en Arkiv
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://data.arkiv.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-cyan-400 flex items-center gap-1"
            >
              Data Explorer <ExternalLink className="h-3 w-3" />
            </a>
            <Badge variant="outline" className="border-emerald-700 text-emerald-400 bg-emerald-950/50 gap-1.5">
              <Radio className="h-3 w-3" />
              Braga Testnet
            </Badge>
          </div>
        </div>
        <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-300">¿Qué hace esta app?</strong> Cada vez que un modelo de IA sugiere una ruta logística, AeroTrack registra esa decisión <strong className="text-cyan-400">inmutablemente</strong> en la blockchain de Arkiv. Nadie puede alterar o eliminar un registro a escondidas — cada decisión es verificable públicamente. Los números de transacción que ves en la tabla son la prueba: hacé clic en el ícono de enlace para verificar en el explorador de bloques.
        </div>
      </div>
    </header>
  )
}