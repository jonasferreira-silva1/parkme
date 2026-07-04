// =============================================================
// KpiCards — 4 cartões de métricas em tempo real
// Dados vindos de /analytics/occupancy, /revenue e /avg-duration
// =============================================================

"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { ArrowDownRight, ArrowUpRight, Car, DollarSign, SquareParking, Timer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAnalytics } from "@/lib/hooks/useAnalytics"

// Esqueleto de loading para cada card
function KpiSkeleton() {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-7 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-36 animate-pulse rounded bg-secondary" />
      </div>
    </Card>
  )
}

export function KpiCards() {
  const { ocupacao, receita, duracao, carregando } = useAnalytics()

  if (carregando && !ocupacao) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    )
  }

  // Extrai valores reais com fallback para zero
  const taxaNum     = ocupacao ? parseInt(ocupacao.taxaOcupacao) : 0
  const ocupadas    = ocupacao?.ocupadas ?? 0
  const total       = ocupacao?.total ?? 0
  const totalReceita = receita?.totalReceita ?? 0
  const mediaFormatada = duracao?.mediaFormatada ?? "—"

  // Calcula tarifa média a partir da receita e número de sessões
  const tarifaMedia = duracao?.totalSessoes && totalReceita
    ? (totalReceita / duracao.totalSessoes).toFixed(2)
    : "—"

  // Formata receita em reais
  const receitaFormatada = totalReceita.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const kpis = [
    {
      label: "Ocupação atual",
      value: ocupacao?.taxaOcupacao ?? "—",
      sub:   `${ocupadas} de ${total} vagas`,
      delta: 0,  // delta histórico não está disponível na API atual
      icon:  SquareParking,
      color: "var(--chart-1)",
      spark: [taxaNum * 0.5, taxaNum * 0.6, taxaNum * 0.7, taxaNum * 0.8, taxaNum * 0.9, taxaNum * 0.95, taxaNum]
        .map((v) => ({ v: Math.round(v) })),
    },
    {
      label: "Sessões ativas",
      value: String(ocupadas),
      sub:   ocupacao?.precoDinamicoAtivo ? "⚡ Preço dinâmico ativo" : "Ocupação normal",
      delta: 0,
      icon:  Car,
      color: "var(--chart-2)",
      spark: [ocupadas * 0.6, ocupadas * 0.7, ocupadas * 0.8, ocupadas * 0.85, ocupadas * 0.9, ocupadas * 0.95, ocupadas]
        .map((v) => ({ v: Math.round(v) })),
    },
    {
      label: "Faturamento (30 dias)",
      value: receitaFormatada,
      sub:   `${receita?.totalPagamentos ?? 0} pagamentos aprovados`,
      delta: 0,
      icon:  DollarSign,
      color: "var(--chart-3)",
      spark: [totalReceita * 0.4, totalReceita * 0.5, totalReceita * 0.65, totalReceita * 0.75, totalReceita * 0.85, totalReceita * 0.93, totalReceita]
        .map((v) => ({ v: Math.round(v) })),
    },
    {
      label: "Permanência média",
      value: mediaFormatada,
      sub:   `Tarifa média R$ ${tarifaMedia}`,
      delta: 0,
      icon:  Timer,
      color: "var(--chart-5)",
      spark: Array.from({ length: 7 }, (_, i) => ({ v: duracao?.mediaMinutos ?? 0 })),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const up = k.delta >= 0
        return (
          <Card key={k.label} className="relative overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklch, ${k.color} 18%, transparent)`, color: k.color }}
                >
                  <k.icon className="size-4" />
                </span>
                {k.label}
              </div>
              {/* Badge só aparece quando há dado de delta disponível */}
              {k.delta !== 0 && (
                <span
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    up ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive",
                  )}
                >
                  {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {Math.abs(k.delta)}%
                </span>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tracking-tight">{k.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{k.sub}</p>
              </div>
              <div className="h-12 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={k.spark} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`kpi-${k.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={k.color} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={k.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={k.color}
                      strokeWidth={2}
                      fill={`url(#kpi-${k.label})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
