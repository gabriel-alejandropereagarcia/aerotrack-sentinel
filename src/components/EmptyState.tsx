import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="py-16 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
        <h3 className="text-zinc-400 font-medium mb-1">{title}</h3>
        <p className="text-zinc-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}