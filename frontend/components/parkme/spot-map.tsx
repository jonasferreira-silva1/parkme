"use client"

import { useEffect, useMemo, useState } from "react"
import { Accessibility, Car } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { buildSpots, type Spot, type SpotType } from "@/lib/parkme-data"

const typeIcon: Record<SpotType, typeof Car> = {
  comum: Car,
  pcd: Accessibility,
}

const statusStyle: Record<Spot["status"], string> = {
  livre: "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20",
  ocupada: "border-primary/40 bg-primary/15 text-primary",
  reservada: "border-chart-3/40 bg-chart-3/10 text-chart-3",
}

export function SpotMap() {
  const [spots, setSpots] = useState<Spot[]>(() => buildSpots())
  const [floor, setFloor] = useState("1")

  // Simula eventos de WebSocket: vaga_ocupada / vaga_livre
  useEffect(() => {
    const t = setInterval(() => {
      setSpots((prev) => {
        const next = [...prev]
        const i = Math.floor(Math.random() * next.length)
        const s = next[i]
        next[i] = {
          ...s,
          status: s.status === "livre" ? "ocupada" : s.status === "ocupada" ? "livre" : "ocupada",
        }
        return next
      })
    }, 1800)
    return () => clearInterval(t)
  }, [])

  const floorSpots = useMemo(() => spots.filter((s) => s.floor === Number(floor)), [spots, floor])
  const livres = floorSpots.filter((s) => s.status === "livre").length

  return (
    <Card className="col-span-full">
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Mapa de vagas em tempo real</CardTitle>
          <CardDescription>
            {livres} vagas livres neste andar · atualização via WebSocket
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Legend className="bg-accent" label="Livre" />
          <Legend className="bg-primary" label="Ocupada" />
          <Legend className="bg-chart-3" label="Reservada" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={floor} onValueChange={setFloor}>
          <TabsList className="mb-4">
            {[1, 2, 3, 4].map((f) => (
              <TabsTrigger key={f} value={String(f)}>
                Andar {f}
              </TabsTrigger>
            ))}
          </TabsList>
          {[1, 2, 3, 4].map((f) => (
            <TabsContent key={f} value={String(f)} className="mt-0">
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12">
                {spots
                  .filter((s) => s.floor === f)
                  .map((s) => {
                    const Icon = typeIcon[s.type]
                    return (
                      <div
                        key={s.id}
                        title={`${s.id} · ${s.status}`}
                        className={cn(
                          "group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-[10px] font-medium transition-all",
                          statusStyle[s.status],
                        )}
                      >
                        <Icon className="size-3.5" />
                        <span className="tabular-nums">{s.sector}{s.number}</span>
                        {s.status === "ocupada" && (
                          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    )
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  )
}
