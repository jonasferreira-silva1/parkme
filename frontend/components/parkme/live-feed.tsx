"use client"

import { useEffect, useState } from "react"
import { Car, CircleParking, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { feedSeed, type FeedEvent, type FeedType } from "@/lib/parkme-data"

const meta: Record<FeedType, { icon: typeof Car; color: string }> = {
  vaga_ocupada: { icon: Car, color: "var(--chart-1)" },
  vaga_livre: { icon: CircleParking, color: "var(--chart-2)" },
  sessao_expirando: { icon: TriangleAlert, color: "var(--chart-4)" },
}

// Payloads conforme docs: vaga_* { spotId, floor, sector, number }
// sessao_expirando { sessionId, minutesLeft, totalAmount }
const pool: Omit<FeedEvent, "id" | "time">[] = [
  { type: "vaga_ocupada", label: "vaga_ocupada", detail: "F2-B-07 · Setor B · nº 7" },
  { type: "vaga_livre", label: "vaga_livre", detail: "F1-D-11 · Setor D · nº 11" },
  { type: "sessao_expirando", label: "sessao_expirando", detail: "sessão #7h88 · 5 min · R$ 35,50" },
  { type: "vaga_ocupada", label: "vaga_ocupada", detail: "F3-A-02 · Setor A · nº 2" },
  { type: "vaga_livre", label: "vaga_livre", detail: "F4-C-09 · Setor C · nº 9" },
  { type: "sessao_expirando", label: "sessao_expirando", detail: "sessão #2c56 · 3 min · R$ 12,00" },
]

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>(feedSeed)

  useEffect(() => {
    let n = 0
    const t = setInterval(() => {
      const pick = pool[n % pool.length]
      n++
      setEvents((prev) => [{ ...pick, id: `live-${Date.now()}`, time: "agora" }, ...prev].slice(0, 12))
    }, 3200)
    return () => clearInterval(t)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          Eventos ao vivo
        </CardTitle>
        <CardDescription>Stream do gateway WebSocket /parking</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[300px] pr-3">
          <ul className="space-y-1">
            {events.map((e, i) => {
              const m = meta[e.type]
              return (
                <li
                  key={e.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md px-2 py-2.5",
                    i === 0 && "bg-secondary/60",
                  )}
                >
                  <span
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `color-mix(in oklch, ${m.color} 18%, transparent)`, color: m.color }}
                  >
                    <m.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{e.time}</span>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
