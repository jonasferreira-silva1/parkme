"use client"

import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { spotTypeMix } from "@/lib/parkme-data"

const config = {
  valor: { label: "Vagas" },
  Comuns: { label: "Comuns", color: "var(--chart-1)" },
  PCD: { label: "PCD", color: "var(--chart-2)" },
} satisfies ChartConfig

const total = spotTypeMix.reduce((a, b) => a + b.valor, 0)

export function SpotMixChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Composição das vagas</CardTitle>
        <CardDescription>Distribuição por tipo · {total} no total</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[220px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={spotTypeMix} dataKey="valor" nameKey="tipo" innerRadius={58} strokeWidth={4}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                          {total}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                          vagas
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {spotTypeMix.map((s) => (
            <div key={s.tipo} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-sm" style={{ background: s.fill }} />
              <span className="text-muted-foreground">{s.tipo}</span>
              <span className="ml-auto font-medium">{s.valor}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
