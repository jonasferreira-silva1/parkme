// =============================================================
// ActiveSessions — Tabela de sessões recentes da API
// Dados vindos de GET /sessions/history com auto-refresh 30s
// =============================================================

"use client"

import { useSessions } from "@/lib/hooks/useSessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// Formata a data de entrada para exibição
function formatarEntrada(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour:   "2-digit",
    minute: "2-digit",
  })
}

// Calcula duração em texto legível
function calcularDuracao(entryAt: string): string {
  const diff = Math.floor((Date.now() - new Date(entryAt).getTime()) / 60000)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

// Status do pagamento → badge
function badgePagamento(status?: string) {
  switch (status) {
    case "APPROVED": return { label: "Paga",      className: "bg-chart-2/15 text-chart-2 border-chart-2/30" }
    case "PENDING":  return { label: "Pendente",  className: "bg-chart-3/15 text-chart-3 border-chart-3/30" }
    case "FAILED":   return { label: "Falhou",    className: "bg-destructive/15 text-destructive border-destructive/30" }
    default:         return { label: "Ativa",     className: "bg-chart-1/15 text-chart-1 border-chart-1/30" }
  }
}

export function ActiveSessions() {
  const { sessoes, carregando, recarregar } = useSessions()

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Sessões recentes</CardTitle>
          <CardDescription>
            {carregando
              ? "Carregando..."
              : `${sessoes.length} sessão${sessoes.length !== 1 ? "ões" : ""} no histórico`}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={recarregar} disabled={carregando}>
          Atualizar
        </Button>
      </CardHeader>

      <CardContent>
        {carregando && sessoes.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        ) : sessoes.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Nenhuma sessão encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Placa</TableHead>
                  <TableHead className="hidden sm:table-cell">Vaga</TableHead>
                  <TableHead className="hidden sm:table-cell">Entrada</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessoes.slice(0, 8).map((s) => {
                  const badge = badgePagamento(s.payment?.status)
                  const valor = s.totalAmount
                    ? `R$ ${Number(s.totalAmount).toFixed(2)}`
                    : "—"

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium">
                        {s.vehicle.plate}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">
                        {s.spot.sector}{s.spot.number} · {s.spot.floor}º
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                        {formatarEntrada(s.entryAt)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {calcularDuracao(s.entryAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {valor}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
