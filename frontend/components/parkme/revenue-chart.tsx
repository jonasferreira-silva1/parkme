"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { revenueWeek } from "@/lib/parkme-data"

const config = {
  pix: { label: "Pix", color: "var(--chart-2)" },
  cartao: { label: "Cartão", color: "var(--chart-1)" },
} satisfies ChartConfig

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Faturamento por método</CardTitle>
        <CardDescription>Últimos 7 dias · Pix vs. cartão (R$)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={revenueWeek} margin={{ left: -8, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} width={44} fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="pix" stackId="a" fill="var(--color-pix)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="cartao" stackId="a" fill="var(--color-cartao)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
