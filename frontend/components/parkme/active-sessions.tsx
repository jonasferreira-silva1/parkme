import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { activeSessions, type SessionRow } from "@/lib/parkme-data"

const statusBadge: Record<SessionRow["status"], { label: string; className: string }> = {
  ativa: { label: "Ativa", className: "bg-accent/15 text-accent border-accent/30" },
  expirando: { label: "Expirando", className: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  paga: { label: "Paga", className: "bg-primary/15 text-primary border-primary/30" },
}

export function ActiveSessions() {
  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Sessões ativas</CardTitle>
          <CardDescription>Veículos atualmente no estacionamento</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          Ver histórico
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Placa</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Vaga</TableHead>
                <TableHead className="hidden sm:table-cell">Entrada</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-right">Tarifa</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((s) => {
                const b = statusBadge[s.status]
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-medium">{s.placa}</TableCell>
                    <TableCell className="text-muted-foreground">{s.motorista}</TableCell>
                    <TableCell className="font-mono text-xs">{s.vaga}</TableCell>
                    <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                      {s.entrada}
                    </TableCell>
                    <TableCell className="tabular-nums">{s.duracao}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      R$ {s.tarifa.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={b.className}>
                        {b.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
