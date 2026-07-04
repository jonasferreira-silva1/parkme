// =============================================================
// SIDEBAR — Navegação lateral com next/link
// =============================================================

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, SquareParking, Car, CarFront,
  CreditCard, BarChart3, Users, Settings,
  LifeBuoy, ParkingCircle, LogOut, Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-store"

// Rotas principais — visíveis para OPERATOR e ADMIN
const navPrincipal = [
  { label: "Visão Geral",   icon: LayoutDashboard, href: "/"              },
  { label: "Mapa de Vagas", icon: SquareParking,   href: "/spots"         },
  { label: "Sessões",       icon: Car,             href: "/sessions"      },
  { label: "Pagamentos",    icon: CreditCard,      href: "/payments"      },
  { label: "Notificações",  icon: Bell,            href: "/notifications" },
  { label: "Veículos",      icon: CarFront,        href: "/vehicles"      },
]

// Rotas exclusivas de ADMIN
const navAdmin = [
  { label: "Analytics",    icon: BarChart3, href: "/analytics"  },
  { label: "Motoristas",   icon: Users,     href: "/drivers"    },
]

const navSistema = [
  { label: "Configurações", icon: Settings,  href: "/settings" },
  { label: "Suporte",       icon: LifeBuoy,  href: "/support"  },
]

function labelRole(role?: string) {
  switch (role) {
    case "ADMIN":    return "🛡️ Administrador"
    case "OPERATOR": return "🔧 Operador"
    default:         return "Usuário"
  }
}

function iniciais(nome?: string) {
  if (!nome) return "??"
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export function Sidebar() {
  const pathname         = usePathname()
  const { usuario, logout } = useAuth()
  const isAdmin          = usuario?.role === "ADMIN"

  // Verifica se a rota está ativa (exact para "/" para não ativar em todas)
  const isAtivo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <aside className="hidden lg:flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ParkingCircle className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">ParkMe</p>
          <p className="text-[11px] text-muted-foreground">
            {isAdmin ? "Painel Admin" : "Central de Operações"}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">

        {/* Operação */}
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Operação
        </p>
        <ul className="flex flex-col gap-0.5">
          {navPrincipal.map((item) => {
            const ativo = isAtivo(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    ativo
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Admin — só aparece para ADMIN */}
        {isAdmin && (
          <>
            <p className="px-3 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Administração
            </p>
            <ul className="flex flex-col gap-0.5">
              {navAdmin.map((item) => {
                const ativo = isAtivo(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        ativo
                          ? "bg-purple-500/15 text-purple-300 font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {/* Sistema */}
        <p className="px-3 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Sistema
        </p>
        <ul className="flex flex-col gap-0.5">
          {navSistema.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Usuário logado */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            {iniciais(usuario?.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{usuario?.name ?? "..."}</p>
            <p className="text-[11px]" style={{
              color: isAdmin ? "#a78bfa" : "var(--muted-foreground)",
            }}>
              {labelRole(usuario?.role)}
            </p>
          </div>
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
