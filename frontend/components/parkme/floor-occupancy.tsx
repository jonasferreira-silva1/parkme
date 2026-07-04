// =============================================================
// FloorOccupancy — Ocupação por andar com barra de progresso
// Dados vindos de /analytics/occupancy (campo porAndar)
// =============================================================

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAnalytics } from "@/lib/hooks/useAnalytics"

export function FloorOccupancy() {
  const { ocupacao, carregando } = useAnalytics()

  // Esqueleto de loading
  if (carregando && !ocupacao) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ocupação por andar</CardTitle>
          <CardDescription>Vagas ocupadas / capacidade total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-full animate-pulse rounded bg-secondary" />
              <div className="h-2.5 w-full animate-pulse rounded-full bg-secondary" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Converte o objeto porAndar em array ordenado
  const andares = ocupacao?.porAndar
    ? Object.entries(ocupacao.porAndar)
        .map(([num, dados]) => ({
          label:    `Andar ${num}`,
          ocupadas: dados.ocupadas,
          total:    dados.total,
          pct:      dados.total > 0 ? Math.round((dados.ocupadas / dados.total) * 100) : 0,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ocupação por andar</CardTitle>
        <CardDescription>
          {ocupacao ? `${ocupacao.ocupadas} de ${ocupacao.total} vagas ocupadas` : "Carregando..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {andares.map((a) => (
          <div key={a.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{a.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {a.ocupadas}/{a.total} · {a.pct}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${a.pct}%`,
                  background:
                    a.pct > 85 ? "var(--chart-4)" :
                    a.pct > 60 ? "var(--chart-3)" :
                                 "var(--chart-2)",
                }}
              />
            </div>
          </div>
        ))}

        {/* Indicador de preço dinâmico */}
        {ocupacao?.precoDinamicoAtivo && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-xs text-chart-4">
            <span className="font-semibold">⚡ Preço dinâmico ativo</span>
            <span className="text-muted-foreground">— ocupação acima de 80%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
