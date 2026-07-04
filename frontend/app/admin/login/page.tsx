// =============================================================
// LOGIN ADMIN — Acesso ao painel administrativo
//
// Design sóbrio e corporativo — foco em analytics e gestão.
// Apenas ADMIN consegue acessar. OPERATOR é redirecionado
// para o login de operador.
// =============================================================

"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, ShieldCheck, BarChart3, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-store"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

function AdminLoginForm() {
  const { login } = useAuth()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]           = useState("")
  const [senha, setSenha]           = useState("")
  const [mostrarSenha, setMostrar]  = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro("")
    if (!email.trim() || !senha) { setErro("Preencha e-mail e senha"); return }

    setCarregando(true)
    try {
      const { data } = await api.post("/auth/login", {
        email:    email.trim().toLowerCase(),
        password: senha,
      })

      // Apenas ADMIN acessa este painel
      if (data.usuario.role !== "ADMIN") {
        setErro(
          data.usuario.role === "OPERATOR"
            ? "Este acesso é exclusivo para administradores. Use o login de operador."
            : "Acesso restrito a administradores."
        )
        return
      }

      login(data.usuario, data.accessToken, data.refreshToken)

      // Admin vai para /admin após login
      const redirect = searchParams.get("redirect") ?? "/admin"
      router.replace(redirect)
    } catch (e: any) {
      const msg = e.response?.data?.message
      setErro(Array.isArray(msg) ? msg[0] : (msg ?? "Credenciais inválidas"))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">E-mail</label>
        <input
          type="email" autoComplete="email"
          placeholder="admin@parkme.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErro("") }}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background/60 px-3 py-2 text-sm outline-none",
            "placeholder:text-muted-foreground focus:border-purple-500 transition-colors",
            erro ? "border-destructive" : "border-input",
          )}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Senha</label>
        <div className={cn(
          "flex items-center rounded-lg border bg-background/60 transition-colors focus-within:border-purple-500",
          erro ? "border-destructive" : "border-input",
        )}>
          <input
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro("") }}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button type="button" onClick={() => setMostrar(!mostrarSenha)}
            className="px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
            {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {erro && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
          {erro}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-10 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white"
        disabled={carregando}
      >
        {carregando
          ? <><Loader2 className="mr-2 size-4 animate-spin" />Verificando...</>
          : "Acessar painel admin"
        }
      </Button>

      {/* Credenciais de teste */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            🧪 Conta de teste
          </p>
          <button type="button"
            onClick={() => { setEmail("admin@parkme.com"); setSenha("Senha@123") }}
            className="block w-full text-left text-xs text-purple-400 hover:underline">
            Admin: admin@parkme.com
          </button>
        </div>
      )}
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-svh bg-background">

      {/* Painel esquerdo — identidade corporativa */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center gap-8 p-12"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)" }}>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/30 shadow-lg">
            <ShieldCheck className="size-8 text-purple-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">ParkMe Admin</h1>
            <p className="text-purple-300 mt-1">Painel Administrativo</p>
          </div>
        </div>

        {/* Features do painel admin */}
        <div className="w-full max-w-xs space-y-3">
          {[
            { icone: BarChart3, texto: "Analytics completo e relatórios financeiros"  },
            { icone: Users,     texto: "Gestão de usuários, motoristas e operadores"  },
            { icone: Settings,  texto: "Configurações do sistema e precificação"       },
          ].map(({ icone: Icone, texto }) => (
            <div key={texto} className="flex items-center gap-3 rounded-lg border border-purple-400/20 bg-white/5 px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-purple-300">
                <Icone className="size-4" />
              </div>
              <p className="text-sm text-purple-200/80">{texto}</p>
            </div>
          ))}
        </div>

        {/* Aviso de acesso restrito */}
        <div className="flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300">
          <ShieldCheck className="size-3.5" />
          Acesso exclusivo para administradores
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Header mobile */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-600 text-white">
              <ShieldCheck className="size-7" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">ParkMe Admin</h1>
              <p className="text-sm text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Acesso administrativo</h2>
            <p className="text-sm text-muted-foreground">
              Área restrita. Apenas administradores do sistema.
            </p>
          </div>

          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-secondary" />}>
            <AdminLoginForm />
          </Suspense>

          {/* Link para o operador */}
          <p className="text-center text-xs text-muted-foreground">
            É operador?{" "}
            <a href="/login" className="text-primary hover:underline font-medium">
              Acessar painel operacional
            </a>
          </p>
        </div>
      </div>

    </div>
  )
}
