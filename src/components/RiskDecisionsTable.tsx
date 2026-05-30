"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Clock, ExternalLink } from "lucide-react"
import type { RoutingDecision } from "@/types"

const DATA_EXPLORER = "https://data.arkiv.network"

function formatTimestamp(ms: number): string {
  if (!ms || ms === 0) return "—"
  return new Date(ms).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shortenHash(hash: string): string {
  if (!hash) return "—"
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 8) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {score}/10
      </Badge>
    )
  }
  if (score >= 5) {
    return (
      <Badge className="bg-amber-600 text-white gap-1">
        <Shield className="h-3 w-3" />
        {score}/10
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      {score}/10
    </Badge>
  )
}

interface RiskDecisionsTableProps {
  decisions: RoutingDecision[]
  isLoading: boolean
}

export function RiskDecisionsTable({ decisions, isLoading }: RiskDecisionsTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Decisiones de Ruta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (decisions.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Decisiones de Ruta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-zinc-500">
            <Shield className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm">Sin decisiones registradas.</p>
            <p className="text-xs mt-1">Usá "Simular IA" para generar datos de prueba.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Decisiones de Ruta
          </CardTitle>
          <Badge variant="outline" className="text-zinc-400 border-zinc-700">
            {decisions.length} registros
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Flota</TableHead>
                <TableHead className="text-zinc-400">Riesgo</TableHead>
                <TableHead className="text-zinc-400">Justificación IA</TableHead>
                <TableHead className="text-zinc-400">Modelo</TableHead>
                <TableHead className="text-zinc-400 text-right">
                  <Clock className="h-3 w-3 inline" /> Fecha
                </TableHead>
                <TableHead className="text-zinc-400 text-right">Entidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decisions.map((d) => (
                <TableRow key={d.arkivEntityKey} className="border-zinc-800/50 hover:bg-zinc-800/50">
                  <TableCell className="font-mono text-sm text-cyan-400">
                    {d.fleetId}
                  </TableCell>
                  <TableCell>
                    <RiskBadge score={d.riskScore} />
                  </TableCell>
                  <TableCell className="max-w-[260px] text-sm text-zinc-300 truncate" title={d.payload.aiJustification}>
                    {d.payload.aiJustification}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {d.payload.model}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 text-right">
                    {formatTimestamp(d.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`${DATA_EXPLORER}/${d.arkivEntityKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-zinc-600 hover:text-cyan-400 transition-colors flex items-center justify-end gap-1"
                      title="Ver en Data Explorer"
                    >
                      {shortenHash(d.arkivEntityKey)}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {decisions[0]?.creator && (
          <div className="mt-3 text-[10px] text-zinc-600 font-mono">
            Creador verificable: {decisions[0].creator}
          </div>
        )}
      </CardContent>
    </Card>
  )
}