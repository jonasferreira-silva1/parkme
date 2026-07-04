// =============================================================
// PÁGINA VAGAS — Grid com controle manual de status (OPERATOR+)
// GET /spots · PATCH /spots/:id/status
// =============================================================

"use client"

import { useState, useMemo } from "react"
import { Accessibility, Car, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import { useSpots, type Vaga } from "@/lib/hooks/useSpots"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

const LOT_ID = "lot_001"

const ICONE: Record<Vaga["type"], typeof Car> = {
  STANDARD: Car,
  DISABLED: Accessibility,
  VIP:      Car,
}

const ESTILO: Record<Vaga["status"], string> = {
  FREE:     "border-chart-2/40 bg-chart-2/10 text-chart-2",
  OCCUPIED: "border-chart-1/40 bg-chart-1/15 text-chart-1 opacity-80",
  RESERVED: "border-chart-3/40 bg-chart-3/10 text-chart-3",
}

const LABEL_STATUS: Record<Vaga["status"], string> = {
  FREE: "Livre", OCCUPIED: "Ocupada", RESERVED: "Reservada",
}

export default function SpotsPage() {
  const { vagas, carregando, conectado, livres, ocupadas, taxa, recarregar } = useSpots(LOT_ID)
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null)
  const [atualizando, setAtualizando]         = useState(false)
  const [andar, setAndar]                     = useState("1")

  const andares = useMemo(() => {
    const set = new Set(vagas.map((v) => v.floor))
    return Array.from(set).sort()
  }, [vagas])

  // Altera o status de uma vaga manualmente
  const alterarStatus = async (vaga: Vaga, novoStatus: Vaga["status"]) => {
    setAtualizando(true)
    try {
      await api.patch(`/spots/${vaga.id}/status`, { status: novoStatus })
      await recarregar()
      setVagaSelecionada(null)
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Erro ao atualizar vaga")
    } finally {
      setAtualizando(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Mapa de Vagas" subtitulo="Controle e status em tempo real" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total",    value: vagas.length, cor: "text-foreground"       },
              { label: "Livres",   value: livres,       cor: "text-chart-2"          },
              { label: "Ocupadas", value: ocupadas,     cor: "text-chart-1"          },
              { label: "Ocupação", value: `${taxa}%`,   cor: taxa > 80 ? "text-chart-4" : "text-foreground" },
            ].map((k) => (
              <Card key={k.label} className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${k.cor}`}>{k.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Mapa de vagas */}
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Grade de vagas
                    <span className={cn("size-2 rounded-full", conectado ? "bg-chart-2" : "bg-muted")} />
                  </CardTitle>
                  <CardDescription>Clique em uma vaga para alterar o status</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={recarregar} disabled={carregando}>
                  <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs value={andar} onValueChange={setAndar}>
                  <TabsList className="mb-4">
                    {andares.map((f) => (
                      <TabsTrigger key={f} value={String(f)}>Andar {f}</TabsTrigger>
                    ))}
                  </TabsList>
                  {andares.map((f) => (
                    <TabsContent key={f} value={String(f)} className="mt-0 space-y-4">
                      {Array.from(new Set(vagas.filter((v) => v.floor === f).map((v) => v.sector))).sort().map((setor) => {
                        const vs = vagas.filter((v) => v.floor === f && v.sector === setor)
                        return (
                          <div key={setor}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Setor {setor}
                            </p>
                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
                              {vs.map((v) => {
                                const Icone   = ICONE[v.type]
                                const selecionada = vagaSelecionada?.id === v.id
                                return (
                                  <button
                                    key={v.id}
                                    onClick={() => setVagaSelecionada(selecionada ? null : v)}
                                    title={`${v.sector}${v.number} · ${LABEL_STATUS[v.status]}`}
                                    className={cn(
                                      "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] font-medium transition-all",
                                      ESTILO[v.status],
                                      selecionada && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                                    )}
                                  >
                                    <Icone className="size-3" />
                                    <span>{v.number}</span>
                                    {v.type === "VIP" && (
                                      <span className="absolute left-0.5 top-0.5 text-[8px]">⭐</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Painel de controle da vaga selecionada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Controle de vaga</CardTitle>
                <CardDescription>
                  {vagaSelecionada
                    ? `Setor ${vagaSelecionada.sector} · Nº ${vagaSelecionada.number} · Andar ${vagaSelecionada.floor}`
                    : "Selecione uma vaga no mapa"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!vagaSelecionada ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    ← Clique em uma vaga
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Info da vaga */}
                    <div className="space-y-2 rounded-lg border bg-secondary/30 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Identificação</span>
                        <span className="font-mono font-medium">{vagaSelecionada.sector}{vagaSelecionada.number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Andar</span>
                        <span>{vagaSelecionada.floor}º</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tipo</span>
                        <Badge variant="outline" className="text-xs">
                          {vagaSelecionada.type === "STANDARD" ? "Padrão"
                           : vagaSelecionada.type === "DISABLED" ? "♿ PCD"
                           : "⭐ VIP"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status atual</span>
                        <Badge
                          variant="outline"
                          className={cn(ESTILO[vagaSelecionada.status], "text-xs")}
                        >
                          {LABEL_STATUS[vagaSelecionada.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Botões de alteração */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Alterar status
                      </p>
                      {(["FREE", "OCCUPIED", "RESERVED"] as Vaga["status"][]).map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start gap-2",
                            vagaSelecionada.status === s && "opacity-40 cursor-default pointer-events-none",
                          )}
                          disabled={atualizando || vagaSelecionada.status === s}
                          onClick={() => alterarStatus(vagaSelecionada, s)}
                        >
                          <span className={cn("size-2 rounded-full", {
                            "bg-chart-2": s === "FREE",
                            "bg-chart-1": s === "OCCUPIED",
                            "bg-chart-3": s === "RESERVED",
                          })} />
                          {LABEL_STATUS[s]}
                          {vagaSelecionada.status === s && " (atual)"}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </main>
      </div>
    </div>
  )
}
