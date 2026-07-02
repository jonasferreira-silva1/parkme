"use client"

import { Search, Bell, ChevronDown, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-store"

// Formata a data atual em português (ex: "Terça, 01 de julho")
function dataFormatada() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day:     "2-digit",
    month:   "long",
  }).format(new Date())
}

// Iniciais do nome para o avatar
function iniciais(nome?: string) {
  if (!nome) return "??"
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export function Topbar() {
  const { usuario, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div>
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">Visão Geral</h1>
        <p className="hidden text-xs text-muted-foreground sm:block capitalize">
          {dataFormatada()} · Estacionamento Shopping Vila Norte
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Indicador ao vivo */}
        <div className="hidden items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent md:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          Ao vivo · WebSocket
        </div>

        {/* Busca */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar placa, vaga..."
            className="h-9 w-56 rounded-md border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </div>

        {/* Notificações */}
        <Button variant="outline" size="icon" className="relative size-9 shrink-0">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
          <span className="sr-only">Notificações</span>
        </Button>

        {/* Botão registrar entrada */}
        <Button className="hidden gap-2 sm:flex">
          <Radio className="size-4" />
          Registrar entrada
        </Button>

        {/* Avatar do usuário logado */}
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
  )
}
