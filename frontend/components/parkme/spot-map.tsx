// =============================================================
// SpotMap — Mapa de vagas em tempo real via WebSocket
//
// Carrega as vagas via REST e escuta vaga_ocupada / vaga_livre
// do Socket.io para atualizar o mapa sem recarregar a página.
// =============================================================

"use client"

import { useMemo, useState } from "react"
import { Accessibility, Car, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useSpots, type Vaga } from "@/lib/hooks/useSpots"

// ID do estacionamento — em produção viria de seleção/contexto
const LOT_ID = "lot_001"

const ICONE_TIPO: Record<Vaga["type"], typeof Car> = {
  STANDARD: Car,
  DISABLED: Accessibility,
  VIP:      Car,
}

const ESTILO_STATUS: Record<Vaga["status"], string> = {
  FREE:     "border-chart-2/40 bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 cursor-default",
  OCCUPIED: "border-chart-1/40 bg-chart-1/15 text-chart-1 opacity-80",
  RESERVED: "border-chart-3/40 bg-chart-3/10 text-chart-3",
}

function Legenda({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  )
}

export function SpotMap() {
  const { vagas, carregando, conectado, livres, ocupadas, taxa } = useSpots(LOT_ID)

  // Andares únicos presentes nas vagas
  const andares = useMemo(() => {
    const set = new Set(vagas.map((v) => v.floor))
    return Array.from(set).sort()
  }, [vagas])

  const [andar, setAndar] = useState("1")

  // Garante que o andar selecionado existe após carregar
  const andarAtual = andares.includes(Number(andar)) ? andar : String(andares[0] ?? 1)

  if (carregando && vagas.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-base">Mapa de vagas em tempo real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse rounded bg-secondary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            Mapa de vagas em tempo real
            {/* Indicador de conexão WebSocket */}
            {conectado
              ? <span className="flex items-center gap-1 text-xs font-normal text-chart-2"><Wifi className="size-3.5" />ao vivo</span>
              : <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground"><WifiOff className="size-3.5" />reconectando...</span>
            }
          </CardTitle>
          <CardDescription>
            {livres} livres · {ocupadas} ocupadas · {taxa}% de ocupação
            {taxa > 80 && <span className="ml-2 font-medium text-chart-4">⚡ Preço dinâmico ativo</span>}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Legenda className="bg-chart-2"  label="Livre"     />
          <Legenda className="bg-chart-1"  label="Ocupada"   />
          <Legenda className="bg-chart-3"  label="Reservada" />
          <Legenda className="bg-chart-3 opacity-60" label="VIP" />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={andarAtual} onValueChange={setAndar}>
          <TabsList className="mb-4">
            {andares.map((f) => {
              const vagasAndar = vagas.filter((v) => v.floor === f)
              const livresAndar = vagasAndar.filter((v) => v.status === "FREE").length
              return (
                <TabsTrigger key={f} value={String(f)}>
                  Andar {f}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">({livresAndar} livres)</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {andares.map((f) => (
            <TabsContent key={f} value={String(f)} className="mt-0">
              {/* Agrupa por setor para melhor visualização */}
              {Array.from(new Set(vagas.filter((v) => v.floor === f).map((v) => v.sector)))
                .sort()
                .map((setor) => {
                  const vagasSetor = vagas.filter((v) => v.floor === f && v.sector === setor)
                  return (
                    <div key={setor} className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Setor {setor}
                      </p>
                      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15">
                        {vagasSetor.map((v) => {
                          const Icone = ICONE_TIPO[v.type]
                          return (
                            <div
                              key={v.id}
                              title={`${v.sector}${v.number} · ${v.status === "FREE" ? "Livre" : v.status === "OCCUPIED" ? "Ocupada" : "Reservada"} · ${v.type}`}
                              className={cn(
                                "group relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] font-medium transition-all duration-300",
                                ESTILO_STATUS[v.status],
                              )}
                            >
                              <Icone className="size-3" />
                              <span className="tabular-nums">{v.number}</span>
                              {v.status === "OCCUPIED" && (
                                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-chart-1" />
                              )}
                              {v.type === "VIP" && (
                                <span className="absolute left-1 top-1 text-[8px]">⭐</span>
                              )}
                            </div>
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
  )
}
