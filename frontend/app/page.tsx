import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import { KpiCards } from "@/components/parkme/kpi-cards"
import { OccupancyChart } from "@/components/parkme/occupancy-chart"
import { SpotMixChart } from "@/components/parkme/spot-mix-chart"
import { RevenueChart } from "@/components/parkme/revenue-chart"
import { FloorOccupancy } from "@/components/parkme/floor-occupancy"
import { SpotMap } from "@/components/parkme/spot-map"
import { LiveFeed } from "@/components/parkme/live-feed"
import { ActiveSessions } from "@/components/parkme/active-sessions"

export default function Page() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 space-y-4 p-4 sm:p-6">
          <KpiCards />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <OccupancyChart />
            <SpotMixChart />
          </div>

          <SpotMap />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ActiveSessions />
            <LiveFeed />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RevenueChart />
            <FloorOccupancy />
          </div>

          <footer className="pt-2 pb-4 text-center text-xs text-muted-foreground">
            ParkMe · API NestJS :3000 · PostgreSQL :5432 · Redis :6379 · MIT © 2025
          </footer>
        </main>
      </div>
    </div>
  )
}
