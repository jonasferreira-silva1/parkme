// =============================================================
// SpotMixChart — Composição das vagas (Padrão, PCD, VIP)
// Dados vindos de /spots?lotId= agrupados por tipo
// =============================================================

"use client"

import { useEffect, useState } from "react"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import api from "@/lib/api"

interface VagaTipo {
  tipo:  string
  valor: number
  fill:  string
}

const config = {
  valor:    { label: "Vagas" },
  STANDARD: { label: "Padrão",  color: "var(--chart-1)" },
  DISABLED: { label: "PCD",     color: "var(--chart-2)" },
  VIP:      { label: "VIP",     color: "var(--chart-3)" },
} satisfies ChartConfig

const COR_POR_TIPO: Record<string, string> = {
  STANDARD: "var(--chart-1)",
  DISABLED: "var(--chart-2)",
  VIP:      "var(--chart-3)",
}

const LABEL_POR_TIPO: Record<string, string> = {
  STANDARD: "Padrão",
  DISABLED: "PCD",
  VIP:      "VIP",
}

export function SpotMixChart() {
  const [dados, setDados]         = useState<VagaTipo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get("/spots")
      .then((res) => {
        // Agrupa vagas por tipo e conta
        const contagem: Record<string, number> = {}
        for (const vaga of res.data) {
          contagem[vaga.type] = (contagem[vaga.type] ?? 0) + 1
        }

        const lista: VagaTipo[] = Object.entries(contagem).map(([tipo, valor]) => ({
          tipo:  LABEL_POR_TIPO[tipo] ?? tipo,
          valor,
          fill:  COR_POR_TIPO[tipo] ?? "var(--chart-5)",
        }))

        setDados(lista)
      })
      .catch(() => { /* silencia — mostra vazio */ })
      .finally(() => setCarregando(false))
  }, [])

  const total = dados.reduce((acc, d) => acc + d.valor, 0)

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composição das vagas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mx-auto aspect-square max-h-[220px] animate-pulse rounded-full bg-secondary" />
        </CardContent>
      </Card>
    )
  }

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
            <Pie data={dados} dataKey="valor" nameKey="tipo" innerRadius={58} strokeWidth={4}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-semibold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
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
          {dados.map((d) => (
            <div key={d.tipo} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-sm" style={{ background: d.fill }} />
              <span className="text-muted-foreground">{d.tipo}</span>
              <span className="ml-auto font-medium">{d.valor}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
