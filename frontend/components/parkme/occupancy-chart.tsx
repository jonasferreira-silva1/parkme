"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { occupancyTimeline } from "@/lib/parkme-data"

const config = {
  ocupacao: { label: "Ocupação %", color: "var(--chart-1)" },
  entradas: { label: "Entradas", color: "var(--chart-2)" },
  saidas: { label: "Saídas", color: "var(--chart-4)" },
} satisfies ChartConfig

export function OccupancyChart() {
  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Ocupação ao longo do dia</CardTitle>
          <CardDescription>Percentual de ocupação · fluxo de entradas e saídas</CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} /> Ocupação
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} /> Entradas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-4)" }} /> Saídas
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[280px] w-full">
          <AreaChart data={occupancyTimeline} margin={{ left: -12, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillOcup" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-ocupacao)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-ocupacao)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillEnt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-entradas)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-entradas)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="hora" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={40} fontSize={12} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="entradas"
              stroke="var(--color-entradas)"
              strokeWidth={2}
              fill="url(#fillEnt)"
            />
            <Area
              type="monotone"
              dataKey="ocupacao"
              stroke="var(--color-ocupacao)"
              strokeWidth={2.5}
              fill="url(#fillOcup)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
