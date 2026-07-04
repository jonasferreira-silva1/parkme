// =============================================================
// RevenueChart — Faturamento por método de pagamento
// Dados vindos de /analytics/revenue
// =============================================================

"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useAnalytics } from "@/lib/hooks/useAnalytics"

const config = {
  PIX:    { label: "Pix",    color: "var(--chart-2)" },
  CREDIT: { label: "Crédito", color: "var(--chart-1)" },
  DEBIT:  { label: "Débito",  color: "var(--chart-3)" },
} satisfies ChartConfig

export function RevenueChart() {
  const { receita, carregando } = useAnalytics()

  if (carregando && !receita) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturamento por método</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] animate-pulse rounded bg-secondary" />
        </CardContent>
      </Card>
    )
  }

  // Monta os dados de barras a partir do campo porMetodo
  // A API retorna { PIX: 1200, CREDIT: 800, DEBIT: 300 }
  const porMetodo = receita?.porMetodo ?? {}
  const totalReceita = receita?.totalReceita ?? 0

  // Formata como array para o recharts: [{ metodo, valor }]
  const dadosGrafico = Object.entries(porMetodo).map(([metodo, valor]) => ({
    metodo,
    valor: parseFloat((valor as number).toFixed(2)),
  }))

  // Formata o período para exibição
  const periodo = receita?.periodo
    ? `${new Date(receita.periodo.de).toLocaleDateString("pt-BR")} — ${new Date(receita.periodo.ate).toLocaleDateString("pt-BR")}`
    : "Últimos 30 dias"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Faturamento por método</CardTitle>
        <CardDescription>
          {periodo} · Total: {totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dadosGrafico.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Nenhum pagamento aprovado no período
          </div>
        ) : (
          <ChartContainer config={config} className="h-[240px] w-full">
            <BarChart data={dadosGrafico} margin={{ left: -8, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="metodo"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                tickFormatter={(v) => config[v as keyof typeof config]?.label ?? v}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={60}
                fontSize={12}
                tickFormatter={(v) => `R$ ${v}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    }
                  />
                }
              />
              <Bar
                dataKey="valor"
                fill="var(--chart-2)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
