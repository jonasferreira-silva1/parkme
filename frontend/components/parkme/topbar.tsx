// =============================================================
// TOPBAR — Cabeçalho superior com título dinâmico
//
// Funcionalidades:
//   - Sino com badge real de notificações não lidas
//     (GET /notifications, atualiza a cada 60s)
//   - Busca por placa ou vaga: filtra sessões ativas e vagas
//     via GET /sessions/history e GET /spots
//   - Botão "Registrar entrada" → modal de seleção de veículo
//     com exibição da vaga atribuída após confirmar
//   - Avatar do usuário com botão de logout
// =============================================================

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, Radio, X, Car, LogIn, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-store"
import api from "@/lib/api"

// ID fixo do estacionamento — em produção viria de um contexto/seletor
const LOT_ID = "lot_001"

interface TopbarProps {
  titulo?:    string
  subtitulo?: string
}

// Tipo mínimo de veículo necessário para o modal de entrada
interface Veiculo {
  id:    string
  plate: string
  brand: string
  model: string
  color: string
}

// Dados da vaga retornados pela API após registrar a entrada
interface VagaAtribuida {
  floor:  number
  sector: string
  number: number
  lot:    { name: string }
}

// Resultado de busca — pode ser sessão ativa ou vaga
interface ResultadoBusca {
  tipo:     "sessao" | "vaga"
  id:       string
  label:    string    // texto principal (ex: placa ou "A3")
  detalhe:  string    // texto secundário (ex: "Andar 2 · Setor A")
  href:     string    // página para navegar ao clicar
}

function dataFormatada() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  }).format(new Date())
}

function iniciais(nome?: string) {
  if (!nome) return "??"
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export function Topbar({ titulo = "Visão Geral", subtitulo }: TopbarProps) {
  const { usuario, logout } = useAuth()
  const router = useRouter()

  const sub = subtitulo ?? `${dataFormatada()} · Estacionamento Shopping Vila Norte`

  // ── Notificações não lidas ─────────────────────────────────
  const [naoLidas, setNaoLidas] = useState(0)

  // Busca a contagem de não lidas e atualiza a cada 60 segundos
  useEffect(() => {
    const buscarNaoLidas = async () => {
      try {
        const res = await api.get("/notifications", { params: { limit: 1 } })
        // A API retorna { dados: [...], naoLidas: N }
        setNaoLidas(res.data?.naoLidas ?? 0)
      } catch {/* silencia — usuário pode não estar logado ainda */}
    }

    buscarNaoLidas()
    const intervalo = setInterval(buscarNaoLidas, 60_000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Busca por placa ou vaga ────────────────────────────────
  const [termoBusca, setTermoBusca]           = useState("")
  const [resultados, setResultados]           = useState<ResultadoBusca[]>([])
  const [buscando, setBuscando]               = useState(false)
  const [buscaAberta, setBuscaAberta]         = useState(false)
  const refBusca                              = useRef<HTMLDivElement>(null)
  const timerBusca                            = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Executa busca com debounce de 400ms para não disparar a cada tecla
  useEffect(() => {
    const termo = termoBusca.trim()

    if (termo.length < 2) {
      setResultados([])
      setBuscaAberta(false)
      return
    }

    // Cancela timer anterior antes de criar novo
    if (timerBusca.current) clearTimeout(timerBusca.current)

    timerBusca.current = setTimeout(async () => {
      setBuscando(true)
      try {
        // Busca sessões ativas que contenham a placa pesquisada
        const [resSessoes, resVagas] = await Promise.all([
          api.get("/sessions/history", { params: { page: 1, limit: 20, status: "ACTIVE" } }),
          api.get("/spots", { params: { lotId: LOT_ID } }),
        ])

        const termoUpper = termo.toUpperCase()
        const lista: ResultadoBusca[] = []

        // Filtra sessões ativas pela placa
        const sessoes = resSessoes.data?.dados ?? []
        sessoes.forEach((s: any) => {
          if (s.vehicle?.plate?.toUpperCase().includes(termoUpper)) {
            lista.push({
              tipo:    "sessao",
              id:      s.id,
              label:   s.vehicle.plate,
              detalhe: `${s.spot.sector}${s.spot.number} · ${s.spot.floor}º andar · ativa`,
              href:    "/sessions",
            })
          }
        })

        // Filtra vagas pelo setor+número (ex: "A3", "B12")
        const vagas = resVagas.data ?? []
        vagas.forEach((v: any) => {
          const vagaLabel = `${v.sector}${v.number}`
          if (vagaLabel.toUpperCase().includes(termoUpper)) {
            lista.push({
              tipo:    "vaga",
              id:      v.id,
              label:   vagaLabel,
              detalhe: `${v.floor}º andar · ${v.status === "FREE" ? "Livre" : v.status === "OCCUPIED" ? "Ocupada" : "Reservada"}`,
              href:    "/spots",
            })
          }
        })

        setResultados(lista.slice(0, 6)) // máximo de 6 resultados
        setBuscaAberta(true)
      } catch {/* silencia */} finally {
        setBuscando(false)
      }
    }, 400)

    return () => {
      if (timerBusca.current) clearTimeout(timerBusca.current)
    }
  }, [termoBusca])

  // Fecha o dropdown de busca ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (refBusca.current && !refBusca.current.contains(e.target as Node)) {
        setBuscaAberta(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const limparBusca = () => {
    setTermoBusca("")
    setResultados([])
    setBuscaAberta(false)
  }

  const navegarResultado = (href: string) => {
    limparBusca()
    router.push(href)
  }

  // ── Modal de registrar entrada ─────────────────────────────
  const [modalAberto, setModalAberto]               = useState(false)
  const [veiculos, setVeiculos]                     = useState<Veiculo[]>([])
  const [carregandoVeic, setCarregandoVeic]         = useState(false)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<string>("")
  const [registrando, setRegistrando]               = useState(false)
  const [erroModal, setErroModal]                   = useState<string | null>(null)
  const [vagaAtribuida, setVagaAtribuida]           = useState<VagaAtribuida | null>(null)

  // Busca a lista de veículos ao abrir o modal
  const abrirModal = async () => {
    setModalAberto(true)
    setVeiculoSelecionado("")
    setErroModal(null)
    setVagaAtribuida(null)
    setCarregandoVeic(true)
    try {
      const res = await api.get("/vehicles")
      setVeiculos(res.data)
    } catch {
      setErroModal("Não foi possível carregar os veículos.")
    } finally {
      setCarregandoVeic(false)
    }
  }

  // Fecha o modal e limpa o estado interno
  const fecharModal = () => {
    if (registrando) return
    setModalAberto(false)
    setVagaAtribuida(null)
    setErroModal(null)
  }

  // Envia POST /sessions/entry e exibe a vaga atribuída
  const registrarEntrada = async () => {
    if (!veiculoSelecionado) {
      setErroModal("Selecione um veículo para continuar.")
      return
    }
    setRegistrando(true)
    setErroModal(null)
    try {
      const res = await api.post("/sessions/entry", {
        vehicleId: veiculoSelecionado,
        lotId:     LOT_ID,
      })
      // Guarda a vaga para exibir na tela de confirmação
      setVagaAtribuida(res.data.spot)
    } catch (e: any) {
      setErroModal(e.response?.data?.message ?? "Erro ao registrar entrada.")
    } finally {
      setRegistrando(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <div>
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">{titulo}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block capitalize">{sub}</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">

          {/* Indicador de conexão WebSocket ao vivo */}
          <div className="hidden items-center gap-2 rounded-full border border-chart-2/30 bg-chart-2/10 px-3 py-1.5 text-xs font-medium text-chart-2 md:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-chart-2" />
            </span>
            Ao vivo · WebSocket
          </div>

          {/* ── Busca por placa ou vaga ── */}
          <div ref={refBusca} className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onFocus={() => resultados.length > 0 && setBuscaAberta(true)}
              placeholder="Buscar placa, vaga..."
              className="h-9 w-56 rounded-md border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring transition-colors"
            />

            {/* Dropdown com resultados da busca */}
            {buscaAberta && (
              <div className="absolute top-full mt-1 w-72 rounded-lg border border-border bg-background shadow-xl z-50 overflow-hidden">
                {buscando ? (
                  // Skeleton enquanto busca
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded bg-secondary" />
                    ))}
                  </div>
                ) : resultados.length === 0 ? (
                  // Sem resultados
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    Nenhum resultado para "{termoBusca}"
                  </p>
                ) : (
                  // Lista de resultados clicáveis
                  <ul className="py-1">
                    {resultados.map((r) => (
                      <li key={`${r.tipo}-${r.id}`}>
                        <button
                          type="button"
                          onClick={() => navegarResultado(r.href)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 transition-colors"
                        >
                          {/* Ícone diferente por tipo de resultado */}
                          <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
                            r.tipo === "sessao" ? "bg-chart-1/15" : "bg-chart-2/15"
                          }`}>
                            {r.tipo === "sessao"
                              ? <Car className="size-3.5 text-chart-1" />
                              : <MapPin className="size-3.5 text-chart-2" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-mono font-bold">{r.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.detalhe}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Rodapé com atalho para limpar */}
                <div className="border-t border-border px-4 py-2">
                  <button
                    onClick={limparBusca}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpar busca
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sino com badge real de não lidas ── */}
          <Button
            variant="outline"
            size="icon"
            className="relative size-9 shrink-0"
            onClick={() => router.push("/notifications")}
            title={naoLidas > 0 ? `${naoLidas} notificação${naoLidas !== 1 ? "ões" : ""} não lida${naoLidas !== 1 ? "s" : ""}` : "Notificações"}
          >
            <Bell className="size-4" />
            {/* Badge só aparece quando há notificações não lidas */}
            {naoLidas > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
            <span className="sr-only">Notificações</span>
          </Button>

          {/* Botão que abre o modal de registrar entrada */}
          <Button className="hidden gap-2 sm:flex" onClick={abrirModal}>
            <Radio className="size-4" />
            Registrar entrada
          </Button>

          {/* Avatar do usuário com logout */}
          <button
            onClick={logout}
            title={`${usuario?.name ?? ""} — clique para sair`}
            className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 hover:bg-secondary/60 transition-colors"
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {iniciais(usuario?.name)}
            </div>
            <span className="hidden text-xs font-medium sm:block max-w-[100px] truncate">
              {usuario?.name ?? "..."}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* ============================================================
          MODAL — Registrar entrada de veículo
          Fluxo:
            1. Lista veículos cadastrados → usuário seleciona um
            2. Clica em "Confirmar entrada"
            3. API atribui vaga automaticamente e retorna qual é
            4. Exibe a vaga em destaque para o motorista saber onde ir
          ============================================================ */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={fecharModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Tela de sucesso: exibe a vaga atribuída ── */}
            {vagaAtribuida ? (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-chart-2/15">
                  <MapPin className="size-8 text-chart-2" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-chart-2">Entrada registrada!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dirija o veículo para a vaga indicada abaixo
                  </p>
                </div>
                {/* Vaga em destaque — número grande para fácil leitura */}
                <div className="w-full rounded-xl border-2 border-chart-2/40 bg-chart-2/10 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-chart-2/70 mb-3">
                    Sua vaga reservada
                  </p>
                  <p className="text-5xl font-black tracking-tight text-chart-2">
                    {vagaAtribuida.sector}{vagaAtribuida.number}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {vagaAtribuida.floor}º Andar · Setor {vagaAtribuida.sector}
                  </p>
                  {vagaAtribuida.lot?.name && (
                    <p className="mt-1 text-xs text-muted-foreground">{vagaAtribuida.lot.name}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Anote ou memorize o número da vaga — você precisará dela na saída.
                </p>
                <Button className="w-full" onClick={fecharModal}>Entendido</Button>
              </div>

            ) : (
              /* ── Tela padrão: seleção de veículo ── */
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Registrar entrada</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione o veículo — o sistema atribuirá a melhor vaga disponível
                    </p>
                  </div>
                  <button onClick={fecharModal} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="size-5" />
                  </button>
                </div>

                {carregandoVeic ? (
                  <div className="space-y-2 py-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
                    ))}
                  </div>
                ) : veiculos.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
                    <Car className="size-10 opacity-30" />
                    <p className="text-sm">Nenhum veículo cadastrado</p>
                    <p className="text-xs">
                      Cadastre um veículo na página{" "}
                      <a href="/vehicles" className="text-primary underline">Veículos</a>{" "}
                      antes de registrar uma entrada.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {veiculos.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setVeiculoSelecionado(v.id); setErroModal(null) }}
                        className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                          veiculoSelecionado === v.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        }`}
                      >
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                          veiculoSelecionado === v.id ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <Car className={`size-4 ${veiculoSelecionado === v.id ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono font-bold tracking-widest text-sm">{v.plate}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {v.brand} {v.model} · {v.color}
                          </p>
                        </div>
                        {veiculoSelecionado === v.id && (
                          <div className="ml-auto size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {erroModal && (
                  <p className="mb-3 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                    {erroModal}
                  </p>
                )}

                {veiculos.length > 0 && (
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={fecharModal} disabled={registrando}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={registrarEntrada}
                      disabled={!veiculoSelecionado || registrando}
                      className="gap-2 min-w-[140px]"
                    >
                      <LogIn className="size-4" />
                      {registrando ? "Registrando..." : "Confirmar entrada"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
