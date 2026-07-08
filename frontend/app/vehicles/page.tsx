// =============================================================
// PÁGINA VEÍCULOS — Lista, cadastro e remoção de veículos
//
// Endpoints utilizados:
//   GET    /vehicles              → carrega a lista de veículos
//   GET    /sessions/history      → busca sessões ativas para
//                                   mostrar onde cada carro está
//   POST   /vehicles              → cadastra novo veículo
//   DELETE /vehicles/:id          → remove veículo
//
// A placa é validada no frontend antes de enviar (formato
// Mercosul ABC1D23 ou antigo ABC1234) igual à regra do backend.
//
// Funcionalidade "Onde está meu carro":
//   Cruzamos a lista de veículos com as sessões ativas. Se um
//   veículo tiver sessão ACTIVE, mostramos o andar, setor e
//   número da vaga diretamente na tabela.
// =============================================================

"use client"

import { useState, useEffect } from "react"
import { Car, Trash2, RefreshCw, Plus, X, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import api from "@/lib/api"

// Tipo que representa um veículo retornado pela API
interface Veiculo {
  id:        string
  plate:     string
  brand:     string
  model:     string
  color:     string
  createdAt: string
}

// Dados da vaga onde o veículo está estacionado (sessão ativa)
interface VagaAtiva {
  floor:  number
  sector: string
  number: number
}

// Campos do formulário de cadastro
interface FormVeiculo {
  plate: string
  brand: string
  model: string
  color: string
}

// Valor inicial limpo para resetar o formulário
const FORM_VAZIO: FormVeiculo = { plate: "", brand: "", model: "", color: "" }

// Valida a placa no formato Mercosul (ABC1D23) ou antigo (ABC1234)
function placaValida(placa: string) {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa.toUpperCase())
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function VehiclesPage() {
  const [veiculos, setVeiculos]     = useState<Veiculo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [removendo, setRemovendo]   = useState<string | null>(null)

  // Mapa de vehicleId → vaga ativa (onde o carro está agora)
  const [vagasAtivas, setVagasAtivas] = useState<Record<string, VagaAtiva>>({})

  // Controle do modal de cadastro
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm]               = useState<FormVeiculo>(FORM_VAZIO)
  const [salvando, setSalvando]       = useState(false)
  const [erroForm, setErroForm]       = useState<string | null>(null)

  // Carrega veículos e sessões ativas em paralelo para montar o mapa
  const buscar = async () => {
    setCarregando(true)
    try {
      // Busca veículos e histórico de sessões ao mesmo tempo
      const [resVeiculos, resSessoes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/sessions/history", { params: { page: 1, limit: 100, status: "ACTIVE" } }),
      ])

      setVeiculos(resVeiculos.data)

      // Monta um dicionário { vehicleId: vaga } com as sessões ativas
      // para poder exibir rapidamente onde cada carro está
      const mapa: Record<string, VagaAtiva> = {}
      const sessoes = resSessoes.data?.dados ?? []
      sessoes.forEach((s: any) => {
        if (s.status === "ACTIVE" && s.spot) {
          mapa[s.vehicleId] = {
            floor:  s.spot.floor,
            sector: s.spot.sector,
            number: s.spot.number,
          }
        }
      })
      setVagasAtivas(mapa)
    } catch {/* silencia erros de rede */} finally {
      setCarregando(false)
    }
  }

  useEffect(() => { buscar() }, [])

  // Abre o modal e limpa o formulário
  const abrirModal = () => {
    setForm(FORM_VAZIO)
    setErroForm(null)
    setModalAberto(true)
  }

  // Fecha o modal sem salvar
  const fecharModal = () => {
    if (salvando) return
    setModalAberto(false)
    setErroForm(null)
  }

  // Atualiza um campo do formulário e converte a placa para maiúsculas
  const atualizarCampo = (campo: keyof FormVeiculo, valor: string) => {
    setErroForm(null)
    setForm((prev) => ({
      ...prev,
      [campo]: campo === "plate" ? valor.toUpperCase() : valor,
    }))
  }

  // Envia o formulário para POST /vehicles
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação de placa antes de bater na API
    if (!placaValida(form.plate)) {
      setErroForm("Placa inválida. Use o formato ABC1D23 (Mercosul) ou ABC1234 (antigo).")
      return
    }

    setSalvando(true)
    setErroForm(null)
    try {
      const res = await api.post("/vehicles", {
        plate: form.plate,
        brand: form.brand.trim(),
        model: form.model.trim(),
        color: form.color.trim(),
      })
      // Adiciona o veículo recém-criado no topo da lista sem recarregar tudo
      setVeiculos((prev) => [res.data, ...prev])
      setModalAberto(false)
    } catch (e: any) {
      // Exibe a mensagem de erro retornada pela API (ex: placa duplicada)
      setErroForm(e.response?.data?.message ?? "Erro ao cadastrar veículo.")
    } finally {
      setSalvando(false)
    }
  }

  // Remove um veículo após confirmação — impede remover se estiver estacionado
  const remover = async (id: string, placa: string) => {
    if (vagasAtivas[id]) {
      alert(`O veículo ${placa} está estacionado e não pode ser removido agora.`)
      return
    }
    if (!confirm(`Remover o veículo ${placa}?`)) return
    setRemovendo(id)
    try {
      await api.delete(`/vehicles/${id}`)
      setVeiculos((prev) => prev.filter((v) => v.id !== id))
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Erro ao remover veículo.")
    } finally {
      setRemovendo(null)
    }
  }

  // Quantos carros estão estacionados agora
  const estacionadosAgora = Object.keys(vagasAtivas).length

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Veículos" subtitulo="Veículos cadastrados no sistema" />
        <main className="flex-1 p-4 sm:p-6 space-y-4">

          {/* Banner — mostra quantos carros estão estacionados agora */}
          {estacionadosAgora > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3">
              <MapPin className="size-4 text-chart-2 shrink-0" />
              <p className="text-sm text-chart-2 font-medium">
                {estacionadosAgora} veículo{estacionadosAgora !== 1 ? "s" : ""} estacionado{estacionadosAgora !== 1 ? "s" : ""} agora
              </p>
              <span className="text-xs text-chart-2/70 ml-auto">
                Veja a coluna "Onde está" na tabela
              </span>
            </div>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Meus veículos</CardTitle>
                <CardDescription>
                  {veiculos.length} veículo{veiculos.length !== 1 ? "s" : ""} cadastrado{veiculos.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
                  <RefreshCw className={`size-4 ${carregando ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" onClick={abrirModal} className="gap-1.5">
                  <Plus className="size-4" />
                  Novo veículo
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {carregando ? (
                // Skeleton de carregamento
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
                  ))}
                </div>
              ) : veiculos.length === 0 ? (
                // Estado vazio — convida a cadastrar o primeiro veículo
                <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Car className="size-10 opacity-30" />
                  <p className="text-sm">Nenhum veículo cadastrado</p>
                  <Button size="sm" variant="outline" onClick={abrirModal} className="gap-1.5">
                    <Plus className="size-4" />
                    Cadastrar primeiro veículo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca / Modelo</TableHead>
                        <TableHead>Cor</TableHead>
                        {/* Coluna "Onde está" — mostra a vaga se o carro estiver estacionado */}
                        <TableHead>Onde está</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {veiculos.map((v) => {
                        // Busca no mapa se esse veículo tem sessão ativa
                        const vaga = vagasAtivas[v.id]
                        return (
                          <TableRow key={v.id}>
                            <TableCell className="font-mono font-bold tracking-widest">
                              {v.plate}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{v.brand}</span>
                              <span className="text-muted-foreground"> {v.model}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{v.color}</TableCell>

                            {/* Se tiver vaga ativa, exibe setor+número com badge verde */}
                            <TableCell>
                              {vaga ? (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="gap-1.5 bg-chart-2/10 text-chart-2 border-chart-2/30 font-mono font-bold tracking-wider"
                                  >
                                    <MapPin className="size-3" />
                                    {vaga.sector}{vaga.number}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {vaga.floor}º andar
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground tabular-nums">
                              {formatarData(v.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Botão desabilitado enquanto o veículo estiver estacionado */}
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                disabled={removendo === v.id || !!vaga}
                                onClick={() => remover(v.id, v.plate)}
                                title={vaga ? "Não é possível remover um veículo estacionado" : `Remover ${v.plate}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
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

        </main>
      </div>

      {/* ============================================================
          MODAL — Cadastro de novo veículo
          Exibido sobre um backdrop escuro, fecha clicando fora.
          ============================================================ */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={fecharModal}
        >
          {/* Clique dentro do modal não fecha */}
          <div
            className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Novo veículo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha os dados do veículo a cadastrar
                </p>
              </div>
              <button
                onClick={fecharModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={salvar} className="space-y-4">

              {/* Campo: Placa */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Placa <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  maxLength={7}
                  placeholder="ABC1D23"
                  value={form.plate}
                  onChange={(e) => atualizarCampo("plate", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal outline-none focus:border-ring transition-colors"
                />
                <p className="text-[11px] text-muted-foreground">
                  Formato Mercosul (ABC1D23) ou antigo (ABC1234)
                </p>
              </div>

              {/* Campos lado a lado: Marca e Modelo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Marca <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    maxLength={50}
                    placeholder="Toyota"
                    value={form.brand}
                    onChange={(e) => atualizarCampo("brand", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Modelo <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    maxLength={50}
                    placeholder="Corolla"
                    value={form.model}
                    onChange={(e) => atualizarCampo("model", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>
              </div>

              {/* Campo: Cor */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Cor <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  maxLength={30}
                  placeholder="Prata"
                  value={form.color}
                  onChange={(e) => atualizarCampo("color", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                />
              </div>

              {/* Mensagem de erro da API ou validação local */}
              {erroForm && (
                <p className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                  {erroForm}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={fecharModal} disabled={salvando}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvando} className="min-w-[100px]">
                  {salvando ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
