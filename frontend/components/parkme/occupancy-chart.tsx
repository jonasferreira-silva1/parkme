// =============================================================
// OccupancyChart — Ocupação atual por andar em barras
//
// A API não possui histórico de ocupação por hora ainda.
// Este gráfico mostra a ocupação em tempo real por andar.
// Quando o histórico estiver disponível, basta trocar os dados.
// =============================================================

"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useAnalytics } from "@/lib/hooks/useAnalytics"

const config = {
  ocupadas: { label: "Ocupadas", color: "var(--chart-1)" },
  livres:   { label: "Livres",   color: "var(--chart-2)" },
} satisfies ChartConfig

export function OccupancyChart() {
  const { ocupacao, carregando } = useAnalytics()

  if (carregando && !ocupacao) {
    return (
      <Card className="col-span-full xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Ocupação por andar</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse rounded bg-secondary" />
        </CardContent>
      </Card>
    )
  }

  // Monta dados por andar para o gráfico
  const dadosGrafico = ocupacao?.porAndar
    ? Object.entries(ocupacao.porAndar)
        .map(([num, dados]) => ({
          andar:    `Andar ${num}`,
          ocupadas: dados.ocupadas,
          livres:   dados.total - dados.ocupadas,
          pct:      dados.total > 0 ? Math.round((dados.ocupadas / dados.total) * 100) : 0,
        }))
        .sort((a, b) => a.andar.localeCompare(b.andar))
    : []

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Ocupação por andar</CardTitle>
          <CardDescription>
            Vagas ocupadas vs. livres em tempo real
            {ocupacao?.precoDinamicoAtivo && (
              <span className="ml-2 text-chart-4 font-medium">⚡ Preço dinâmico ativo</span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} />
            Ocupadas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} />
            Livres
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {dadosGrafico.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <ChartContainer config={config} className="h-[280px] w-full">
            <BarChart data={dadosGrafico} margin={{ left: -12, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="andar"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                fontSize={12}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [`${value} vagas`, name === "ocupadas" ? "Ocupadas" : "Livres"]}
                  />
                }
              />
              <Bar dataKey="ocupadas" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="livres"   stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
