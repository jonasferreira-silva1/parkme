import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buildSpots, occupancyByFloor } from "@/lib/parkme-data"

export function FloorOccupancy() {
  const data = occupancyByFloor(buildSpots())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ocupação por andar</CardTitle>
        <CardDescription>Vagas ocupadas / capacidade total</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((f) => {
          const pct = Math.round((f.ocupadas / f.capacidade) * 100)
          return (
            <div key={f.floor} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{f.floor}</span>
                <span className="text-muted-foreground tabular-nums">
                  {f.ocupadas}/{f.capacidade} · {pct}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct > 85 ? "var(--chart-4)" : pct > 60 ? "var(--chart-3)" : "var(--chart-2)",
                  }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
