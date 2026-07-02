"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  SquareParking,
  Car,
  CarFront,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  LifeBuoy,
  ParkingCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-store"

const nav = [
  { label: "Visão Geral", icon: LayoutDashboard, active: true },
  { label: "Mapa de Vagas", icon: SquareParking },
  { label: "Sessões", icon: Car },
  { label: "Pagamentos", icon: CreditCard },
  { label: "Analytics", icon: BarChart3 },
  { label: "Veículos", icon: CarFront },
  { label: "Motoristas", icon: Users },
]

const secondary = [
  { label: "Configurações", icon: Settings },
  { label: "Suporte", icon: LifeBuoy },
]

// Rótulo legível do role
function labelRole(role?: string) {
  switch (role) {
    case "ADMIN":    return "Administrador"
    case "OPERATOR": return "Operador"
    default:         return "Motorista"
  }
}

// Iniciais do nome para o avatar
function iniciais(nome?: string) {
  if (!nome) return "??"
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export function Sidebar() {
  const [active, setActive] = useState("Visão Geral")
  const { usuario, logout } = useAuth()

  return (
    <aside className="hidden lg:flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ParkingCircle className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">ParkMe</p>
          <p className="text-[11px] text-muted-foreground">Central de Operações</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Operação
        </p>
        <ul className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const isActive = active === item.label
            return (
              <li key={item.label}>
                <button
                  onClick={() => setActive(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>

        <p className="px-3 pb-2 pt-6 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Sistema
        </p>
        <ul className="flex flex-col gap-0.5">
          {secondary.map((item) => (
            <li key={item.label}>
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground">
                <item.icon className="size-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Área do usuário logado */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          {/* Avatar com iniciais */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            {iniciais(usuario?.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{usuario?.name ?? "..."}</p>
            <p className="text-[11px] text-muted-foreground">{labelRole(usuario?.role)}</p>
          </div>
          {/* Botão de logout */}
          <button
            onClick={logout}
            title="Sair"
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
