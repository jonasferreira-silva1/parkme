// =============================================================
// LiveFeed — Stream de eventos ao vivo do WebSocket
//
// Escuta os eventos reais do gateway /parking:
//   vaga_ocupada, vaga_livre, sessao_expirando, ocupacao_geral
// Exibe os últimos 12 eventos com timestamp relativo.
// =============================================================

"use client"

import { useEffect, useState, useRef } from "react"
import { Car, CircleParking, TriangleAlert, BarChart2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getSocket, entrarEstacionamento, entrarSalaUsuario } from "@/lib/socket"
import { useAuth } from "@/lib/auth-store"

// ID do estacionamento — em produção viria de contexto
const LOT_ID = "lot_001"

type TipoEvento = "vaga_ocupada" | "vaga_livre" | "sessao_expirando" | "ocupacao_geral"

interface Evento {
  id:     string
  tipo:   TipoEvento
  titulo: string
  detalhe: string
  hora:   Date
}

const META: Record<TipoEvento, { icone: typeof Car; cor: string; titulo: string }> = {
  vaga_ocupada:     { icone: Car,           cor: "var(--chart-1)", titulo: "Vaga ocupada"    },
  vaga_livre:       { icone: CircleParking, cor: "var(--chart-2)", titulo: "Vaga liberada"   },
  sessao_expirando: { icone: TriangleAlert, cor: "var(--chart-4)", titulo: "Sessão expirando" },
  ocupacao_geral:   { icone: BarChart2,     cor: "var(--chart-3)", titulo: "Ocupação geral"  },
}

// Formata o tempo relativo (agora, há 1 min, há 5 min...)
function tempoRelativo(data: Date): string {
  const diff = Math.floor((Date.now() - data.getTime()) / 1000)
  if (diff < 10)  return "agora"
  if (diff < 60)  return `há ${diff}s`
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  return `há ${Math.floor(diff / 3600)}h`
}

export function LiveFeed() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const { usuario } = useAuth()
  // Tick para atualizar o tempo relativo a cada 30s
  const [tick, setTick] = useState(0)
  const contadorRef = useRef(0)

  const adicionarEvento = (tipo: TipoEvento, detalhe: string) => {
    contadorRef.current += 1
    const novo: Evento = {
      id:      `evt-${contadorRef.current}`,
      tipo,
      titulo:  META[tipo].titulo,
      detalhe,
      hora:    new Date(),
    }
    setEventos((prev) => [novo, ...prev].slice(0, 12))
  }

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>
    try {
      socket = getSocket()
    } catch {
      return // SSR
    }

    entrarEstacionamento(LOT_ID)
    if (usuario?.id) entrarSalaUsuario(usuario.id)

    // Handlers dos eventos WebSocket
    const onOcupada = (d: any) =>
      adicionarEvento("vaga_ocupada", `${d.sector ?? ""}${d.number ?? ""} · Andar ${d.floor ?? "?"}`)

    const onLivre = (d: any) =>
      adicionarEvento("vaga_livre", `${d.sector ?? ""}${d.number ?? ""} · Andar ${d.floor ?? "?"}`)

    const onExpirando = (d: any) =>
      adicionarEvento("sessao_expirando", `Sessão ${d.sessionId?.slice(-4) ?? "?"} · ${d.minutesLeft}min · R$ ${Number(d.totalAmount).toFixed(2)}`)

    const onOcupacao = (d: any) =>
      adicionarEvento("ocupacao_geral", `${d.ocupadas}/${d.total} vagas · ${d.percentual}%`)

    socket.on("vaga_ocupada",     onOcupada)
    socket.on("vaga_livre",       onLivre)
    socket.on("sessao_expirando", onExpirando)
    socket.on("ocupacao_geral",   onOcupacao)

    // Tick a cada 30s para atualizar tempos relativos
    const timer = setInterval(() => setTick((t) => t + 1), 30_000)

    return () => {
      socket.off("vaga_ocupada",     onOcupada)
      socket.off("vaga_livre",       onLivre)
      socket.off("sessao_expirando", onExpirando)
      socket.off("ocupacao_geral",   onOcupacao)
      clearInterval(timer)
    }
  }, [usuario?.id])

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-chart-2" />
          </span>
          Eventos ao vivo
        </CardTitle>
        <CardDescription>
          {eventos.length === 0
            ? "Aguardando eventos do WebSocket..."
            : `Stream do gateway WebSocket /parking`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ScrollArea className="h-[300px] pr-3">
          {eventos.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nenhum evento ainda. Conectado e aguardando...
            </div>
          ) : (
            <ul className="space-y-1">
              {eventos.map((e, i) => {
                const m = META[e.tipo]
                return (
                  <li
                    key={e.id}
                    className={cn(
                      "flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors",
                      i === 0 && "bg-secondary/60",
                    )}
                  >
                    <span
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${m.cor} 18%, transparent)`,
                        color: m.cor,
                      }}
                    >
                      <m.icone className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.titulo}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.detalhe}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {tempoRelativo(e.hora)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
