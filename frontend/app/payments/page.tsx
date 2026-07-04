// =============================================================
// PÁGINA PAGAMENTOS — Listagem e confirmação manual [DEV]
// =============================================================

"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import api from "@/lib/api"

interface Pagamento {
  id:          string
  amount:      number
  method:      "PIX" | "CREDIT" | "DEBIT"
  status:      "PENDING" | "APPROVED" | "FAILED"
  mpPaymentId: string | null
  paidAt:      string | null
  createdAt:   string
  session: {
    entryAt:      string
    exitAt:       string | null
    totalMinutes: number | null
    spot:         { sector: string; number: number; floor: number }
  }
}

const BADGE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Aprovado",  className: "bg-chart-2/15 text-chart-2 border-chart-2/30"           },
  PENDING:  { label: "Pendente",  className: "bg-chart-3/15 text-chart-3 border-chart-3/30"           },
  FAILED:   { label: "Falhou",    className: "bg-destructive/15 text-destructive border-destructive/30" },
}

const METODO: Record<string, string> = { PIX: "Pix 🔑", CREDIT: "Crédito 💳", DEBIT: "Débito 💳" }

function formatarData(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function PaymentsPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    try {
      // Busca todas as sessões completadas com pagamento
      const res = await api.get("/sessions/history", { params: { page: 1, limit: 50 } })
      const comPagamento = res.data.dados
        .filter((s: any) => s.payment)
        .map((s: any) => ({
          ...s.payment,
          session: { ...s, spot: s.spot },
        }))
      setPagamentos(comPagamento)
    } catch {/* silencia */} finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { buscar() }, [])

  // Confirma pagamento manualmente (DEV)
  const confirmarDev = async (paymentId: string) => {
    setConfirmando(paymentId)
    try {
      await api.post(`/payments/${paymentId}/confirm-dev`)
      await buscar()
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Erro ao confirmar")
    } finally {
      setConfirmando(null)
    }
  }

  // Totais por status
  const totalAprovado = pagamentos
    .filter((p) => p.status === "APPROVED")
    .reduce((acc, p) => acc + Number(p.amount), 0)
  const totalPendente = pagamentos.filter((p) => p.status === "PENDING").length

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Pagamentos" subtitulo="Histórico e status de pagamentos" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          {/* Resumo rápido */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Total aprovado",  value: totalAprovado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), cor: "text-chart-2" },
              { label: "Pagamentos",      value: String(pagamentos.length),  cor: "text-foreground" },
              { label: "Pendentes",       value: String(totalPendente),      cor: totalPendente > 0 ? "text-chart-3" : "text-muted-foreground" },
            ].map((k) => (
              <Card key={k.label} className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${k.cor}`}>{k.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Todos os pagamentos</CardTitle>
                <CardDescription>{pagamentos.length} registro{pagamentos.length !== 1 ? "s" : ""}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
                <RefreshCw className={`size-4 mr-2 ${carregando ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Vaga</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Pago em</TableHead>
                      {process.env.NODE_ENV === "development" && <TableHead className="text-right">Ação</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carregando
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <TableCell key={j}><div className="h-4 animate-pulse rounded bg-secondary" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      : pagamentos.map((p) => {
                          const b = BADGE[p.status] ?? BADGE.PENDING
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs">
                                {p.session.spot.sector}{p.session.spot.number} · {p.session.spot.floor}º
                              </TableCell>
                              <TableCell className="text-sm">{METODO[p.method] ?? p.method}</TableCell>
                              <TableCell className="text-right tabular-nums font-semibold">
                                R$ {Number(p.amount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={b.className}>{b.label}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground tabular-nums">
                                {formatarData(p.createdAt)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground tabular-nums">
                                {formatarData(p.paidAt)}
                              </TableCell>
                              {process.env.NODE_ENV === "development" && (
                                <TableCell className="text-right">
                                  {p.status === "PENDING" && (
                                    <Button
                                      size="sm" variant="outline"
                                      className="h-7 text-xs gap-1 text-chart-2 border-chart-2/30"
                                      disabled={confirmando === p.id}
                                      onClick={() => confirmarDev(p.id)}
                                    >
                                      <CheckCircle className="size-3" />
                                      {confirmando === p.id ? "..." : "Confirmar"}
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })
                    }
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  )
}
