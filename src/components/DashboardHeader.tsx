import { Badge } from "@/components/ui/badge"
import { Activity, Radio } from "lucide-react"

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
                Dashboard de Auditor\u00eda Log\u00edstica con IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-700 text-emerald-400 bg-emerald-950/50 gap-1.5">
              <Radio className="h-3 w-3" />
              Arkiv Testnet
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}