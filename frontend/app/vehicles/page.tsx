// =============================================================
// PÁGINA VEÍCULOS — Lista de veículos cadastrados
// GET /vehicles (próprios do usuário logado)
// =============================================================

"use client"

import { useState, useEffect } from "react"
import { Car, Trash2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import api from "@/lib/api"

interface Veiculo {
  id:        string
  plate:     string
  brand:     string
  model:     string
  color:     string
  createdAt: string
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function VehiclesPage() {
  const [veiculos, setVeiculos]       = useState<Veiculo[]>([])
  const [carregando, setCarregando]   = useState(true)
  const [removendo, setRemovendo]     = useState<string | null>(null)

  const buscar = async () => {
    setCarregando(true)
    try {
      const res = await api.get("/vehicles")
      setVeiculos(res.data)
    } catch {/* silencia */} finally {
      setCarregando(false)
    }
  }

  useEffect(() => { buscar() }, [])

  const remover = async (id: string, placa: string) => {
    if (!confirm(`Remover o veículo ${placa}?`)) return
    setRemovendo(id)
    try {
      await api.delete(`/vehicles/${id}`)
      setVeiculos((prev) => prev.filter((v) => v.id !== id))
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Erro ao remover")
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Veículos" subtitulo="Veículos cadastrados no sistema" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Meus veículos</CardTitle>
                <CardDescription>{veiculos.length} veículo{veiculos.length !== 1 ? "s" : ""} cadastrado{veiculos.length !== 1 ? "s" : ""}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
                <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>

            <CardContent>
              {carregando ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
                  ))}
                </div>
              ) : veiculos.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Car className="size-10 opacity-30" />
                  <p className="text-sm">Nenhum veículo cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {veiculos.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono font-bold tracking-widest">{v.plate}</TableCell>
                          <TableCell>{v.brand}</TableCell>
                          <TableCell>{v.model}</TableCell>
                          <TableCell className="text-muted-foreground">{v.color}</TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {formatarData(v.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              disabled={removendo === v.id}
                              onClick={() => remover(v.id, v.plate)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
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
