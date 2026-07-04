// =============================================================
// PÁGINA NOTIFICAÇÕES — Lista com marcar como lida
// GET /notifications · PATCH /notifications/read-all
// =============================================================

"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, CheckCheck, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface Notificacao {
  id:        string
  type:      "PARKED" | "EXPIRING_SOON" | "REMINDER"
  message:   string
  sentAt:    string
  readAt:    string | null
  session:   { id: string; spot: { sector: string; number: number; floor: number } } | null
}

const COR_TIPO: Record<string, string> = {
  PARKED:       "bg-chart-2/15 text-chart-2 border-chart-2/30",
  EXPIRING_SOON:"bg-chart-4/15 text-chart-4 border-chart-4/30",
  REMINDER:     "bg-chart-3/15 text-chart-3 border-chart-3/30",
}

const EMOJI_TIPO: Record<string, string> = {
  PARKED: "🚗", EXPIRING_SOON: "⏰", REMINDER: "🔔",
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function NotificationsPage() {
  const [notifs, setNotifs]           = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas]       = useState(0)
  const [carregando, setCarregando]   = useState(true)
  const [marcando, setMarcando]       = useState(false)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get("/notifications", { params: { limit: 50 } })
      setNotifs(res.data.dados)
      setNaoLidas(res.data.naoLidas)
    } catch {/* silencia */} finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar() }, [])

  const marcarTodas = async () => {
    setMarcando(true)
    try {
      await api.patch("/notifications/read-all")
      await buscar()
    } catch {/* silencia */} finally {
      setMarcando(false)
    }
  }

  const marcarUma = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifs((prev) =>
        prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
      )
      setNaoLidas((v) => Math.max(0, v - 1))
    } catch {/* silencia */}
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Notificações" subtitulo="Alertas e avisos do sistema" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Notificações</CardTitle>
                {naoLidas > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    {naoLidas} não lida{naoLidas !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {naoLidas > 0 && (
                  <Button variant="outline" size="sm" onClick={marcarTodas} disabled={marcando}>
                    <CheckCheck className="size-4 mr-2" />
                    Marcar todas
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
                  <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {carregando ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Bell className="size-10 opacity-30" />
                  <p className="text-sm">Nenhuma notificação ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                        !n.readAt ? "bg-secondary/50 border-border" : "opacity-60 border-border/50",
                      )}
                    >
                      <span className="text-2xl">{EMOJI_TIPO[n.type] ?? "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn("text-xs", COR_TIPO[n.type])}>
                            {n.type.replace("_", " ")}
                          </Badge>
                          {n.session && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {n.session.spot.sector}{n.session.spot.number} · {n.session.spot.floor}º
                            </span>
                          )}
                          {!n.readAt && (
                            <span className="ml-auto flex size-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatarData(n.sentAt)}</p>
                      </div>
                      {!n.readAt && (
                        <Button
                          variant="ghost" size="sm"
                          className="shrink-0 text-xs h-7"
                          onClick={() => marcarUma(n.id)}
                        >
                          Lida
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  )
}
