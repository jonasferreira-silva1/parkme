// =============================================================
// PÁGINA SESSÕES — Histórico completo paginado
// GET /sessions/history?page=&limit=
// =============================================================

"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, LogIn, LogOut as LogOutIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import api from "@/lib/api"

interface Sessao {
  id:           string
  entryAt:      string
  exitAt:       string | null
  totalMinutes: number | null
  totalAmount:  number | null
  status:       "ACTIVE" | "COMPLETED" | "CANCELLED"
  spot:         { floor: number; sector: string; number: number }
  vehicle:      { plate: string }
  payment:      { status: string; method: string; paidAt: string | null } | null
}

interface Paginacao { total: number; pagina: number; totalPaginas: number; limite: number }

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatarDuracao(min: number | null) {
  if (!min) return "—"
  const h = Math.floor(min / 60), m = min % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

const BADGE_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: "Ativa",      className: "bg-chart-1/15 text-chart-1 border-chart-1/30"       },
  COMPLETED: { label: "Concluída",  className: "bg-chart-2/15 text-chart-2 border-chart-2/30"       },
  CANCELLED: { label: "Cancelada",  className: "bg-destructive/15 text-destructive border-destructive/30" },
}

const BADGE_PAG: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Pago",      className: "bg-chart-2/15 text-chart-2 border-chart-2/30"       },
  PENDING:  { label: "Pendente",  className: "bg-chart-3/15 text-chart-3 border-chart-3/30"       },
  FAILED:   { label: "Falhou",    className: "bg-destructive/15 text-destructive border-destructive/30" },
}

export default function SessionsPage() {
  const [sessoes, setSessoes]     = useState<Sessao[]>([])
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null)
  const [pagina, setPagina]       = useState(1)
  const [carregando, setCarregando] = useState(true)

  const buscar = useCallback(async (pg: number) => {
    setCarregando(true)
    try {
      const res = await api.get("/sessions/history", { params: { page: pg, limit: 15 } })
      setSessoes(res.data.dados)
      setPaginacao(res.data.paginacao)
    } catch {/* silencia */} finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar(pagina) }, [pagina])

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Sessões" subtitulo="Histórico completo de estacionamentos" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Histórico de sessões</CardTitle>
                <CardDescription>
                  {paginacao ? `${paginacao.total} sessão${paginacao.total !== 1 ? "ões" : ""} no total` : "Carregando..."}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => buscar(pagina)} disabled={carregando}>
                <RefreshCw className={`size-4 mr-2 ${carregando ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Placa</TableHead>
                      <TableHead>Vaga</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Sessão</TableHead>
                      <TableHead className="text-right">Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carregando
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <TableCell key={j}>
                                <div className="h-4 animate-pulse rounded bg-secondary" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : sessoes.map((s) => {
                          const bStatus = BADGE_STATUS[s.status] ?? BADGE_STATUS.COMPLETED
                          const bPag    = s.payment ? BADGE_PAG[s.payment.status] : null
                          return (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono font-medium">{s.vehicle.plate}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {s.spot.sector}{s.spot.number} · {s.spot.floor}º
                              </TableCell>
                              <TableCell className="tabular-nums text-muted-foreground text-xs">
                                {formatarData(s.entryAt)}
                              </TableCell>
                              <TableCell className="tabular-nums text-muted-foreground text-xs">
                                {s.exitAt ? formatarData(s.exitAt) : <span className="flex items-center gap-1 text-chart-1"><LogIn className="size-3" />em curso</span>}
                              </TableCell>
                              <TableCell className="tabular-nums">{formatarDuracao(s.totalMinutes)}</TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {s.totalAmount ? `R$ ${Number(s.totalAmount).toFixed(2)}` : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className={bStatus.className}>{bStatus.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {bPag
                                  ? <Badge variant="outline" className={bPag.className}>{bPag.label}</Badge>
                                  : <span className="text-xs text-muted-foreground">—</span>
                                }
                              </TableCell>
                            </TableRow>
                          )
                        })
                    }
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {paginacao && paginacao.totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Página {paginacao.pagina} de {paginacao.totalPaginas}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={pagina >= paginacao.totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  )
}
