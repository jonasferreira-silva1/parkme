// =============================================================
// PÁGINA MOTORISTAS — Listagem de motoristas cadastrados (Admin)
// GET /auth/users?role=DRIVER
// =============================================================

"use client"

import { useState, useEffect } from "react"
import { Users, RefreshCw, Accessibility } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import api from "@/lib/api"

interface Veiculo {
  id:    string
  plate: string
  brand: string
  model: string
  color: string
}

interface Motorista {
  id:        string
  name:      string
  email:     string
  phone:     string | null
  pcd:       boolean
  createdAt: string
  vehicles:  Veiculo[]
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function DriversPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [carregando, setCarregando] = useState(true)

  const buscar = async () => {
    setCarregando(true)
    try {
      // Busca usuários com o papel DRIVER
      const res = await api.get("/auth/users", { params: { role: "DRIVER" } })
      setMotoristas(res.data)
    } catch (e) {
      console.error("Erro ao carregar motoristas:", e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
  }, [])

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Motoristas" subtitulo="Motoristas cadastrados no sistema" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Todos os motoristas</CardTitle>
                <CardDescription>
                  {motoristas.length} motorista{motoristas.length !== 1 ? "s" : ""} cadastrado{motoristas.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
                <RefreshCw className={`size-4 mr-2 ${carregando ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>

            <CardContent>
              {carregando ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
                  ))}
                </div>
              ) : motoristas.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Users className="size-10 opacity-30" />
                  <p className="text-sm">Nenhum motorista cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>PCD</TableHead>
                        <TableHead>Veículos</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {motoristas.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell className="text-muted-foreground">{m.email}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {m.phone ?? "—"}
                          </TableCell>
                          <TableCell>
                            {m.pcd ? (
                              <BadgePcd />
                            ) : (
                              <span className="text-muted-foreground text-xs">Não</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {m.vehicles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {m.vehicles.map((v) => (
                                  <span key={v.id} className="text-xs font-mono">
                                    🚙 {v.plate} ({v.brand} {v.model} · {v.color})
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {formatarData(m.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  )
}

function BadgePcd() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/30">
      <Accessibility className="size-3" />
      Sim (PCD)
    </span>
  )
}
