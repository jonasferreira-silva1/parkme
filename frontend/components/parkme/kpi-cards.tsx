"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { ArrowDownRight, ArrowUpRight, Car, DollarSign, SquareParking, Timer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Kpi {
  label: string
  value: string
  sub: string
  delta: number
  icon: typeof Car
  spark: { v: number }[]
  color: string
}

const kpis: Kpi[] = [
  {
    label: "Ocupação atual",
    value: "84%",
    sub: "161 de 192 vagas",
    delta: 6.2,
    icon: SquareParking,
    color: "var(--chart-1)",
    spark: [40, 55, 62, 71, 68, 79, 84].map((v) => ({ v })),
  },
  {
    label: "Sessões ativas",
    value: "161",
    sub: "31 entradas na última hora",
    delta: 4.1,
    icon: Car,
    color: "var(--chart-2)",
    spark: [104, 118, 130, 142, 150, 156, 161].map((v) => ({ v })),
  },
  {
    label: "Faturamento hoje",
    value: "R$ 6.870",
    sub: "Pix + cartão",
    delta: 12.8,
    icon: DollarSign,
    color: "var(--chart-3)",
    spark: [3200, 3800, 4200, 4900, 5400, 6100, 6870].map((v) => ({ v })),
  },
  {
    label: "Permanência média",
    value: "2h 14m",
    sub: "Tarifa média R$ 18,40",
    delta: -3.4,
    icon: Timer,
    color: "var(--chart-5)",
    spark: [150, 148, 142, 138, 140, 136, 134].map((v) => ({ v })),
  },
]

export function KpiCards() {
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
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  up ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive",
                )}
              >
                {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(k.delta)}%
              </span>
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
