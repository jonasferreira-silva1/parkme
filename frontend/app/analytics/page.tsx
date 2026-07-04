// =============================================================
// PÁGINA ANALYTICS — Painel completo de métricas (Admin)
// =============================================================

"use client"

import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import { KpiCards } from "@/components/parkme/kpi-cards"
import { OccupancyChart } from "@/components/parkme/occupancy-chart"
import { RevenueChart } from "@/components/parkme/revenue-chart"
import { FloorOccupancy } from "@/components/parkme/floor-occupancy"
import { SpotMixChart } from "@/components/parkme/spot-mix-chart"

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Analytics" subtitulo="Métricas e relatórios do estacionamento" />
        <main className="flex-1 space-y-4 p-4 sm:p-6">
          <KpiCards />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <OccupancyChart />
            <SpotMixChart />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RevenueChart />
            <FloorOccupancy />
          </div>
        </main>
      </div>
    </div>
  )
}
