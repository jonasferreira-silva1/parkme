// =============================================================
// PÁGINA DE LOGIN — Acesso ao dashboard de operações
//
// Apenas OPERATOR e ADMIN conseguem acessar o dashboard.
// O formulário fica em um sub-componente envolto em Suspense
// para satisfazer o requisito do Next.js com useSearchParams.
// =============================================================

"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ParkingCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-store"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

// -----------------------------------------------------------
// Formulário — usa useSearchParams, deve ficar dentro de Suspense
// -----------------------------------------------------------
function LoginForm() {
  const { login } = useAuth()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]       = useState("")
  const [senha, setSenha]       = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando]     = useState(false)
  const [erro, setErro]                 = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro("")

    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha")
      return
    }

    setCarregando(true)

    try {
      const resposta = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: senha,
      })

      const { usuario, accessToken, refreshToken } = resposta.data

      // Apenas OPERATOR e ADMIN acessam o dashboard
      if (usuario.role === "DRIVER") {
        setErro("Acesso restrito a operadores e administradores.")
        return
      }

      // Salva no store (define cookie + localStorage)
      login(usuario, accessToken, refreshToken)

      // Redireciona para a página original ou para o dashboard
      const redirect = searchParams.get("redirect") ?? "/"
      router.replace(redirect)
    } catch (e: any) {
      const msg = e.response?.data?.message
      setErro(Array.isArray(msg) ? msg[0] : (msg ?? "E-mail ou senha incorretos"))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* E-mail */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="operador@parkme.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErro("") }}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none",
            "placeholder:text-muted-foreground focus:border-ring transition-colors",
            erro ? "border-destructive" : "border-input",
          )}
        />
      </div>

      {/* Senha */}
      <div className="space-y-1.5">
        <label htmlFor="senha" className="text-sm font-medium text-foreground">
          Senha
        </label>
        <div className={cn(
          "flex items-center rounded-md border bg-background transition-colors focus-within:border-ring",
          erro ? "border-destructive" : "border-input",
        )}>
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro("") }}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="px-3 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
          {erro}
        </p>
      )}

      {/* Botão */}
      <Button type="submit" className="w-full" disabled={carregando}>
        {carregando
          ? <><Loader2 className="mr-2 size-4 animate-spin" />Entrando...</>
          : "Entrar"
        }
      </Button>

      {/* Credenciais de teste — só em desenvolvimento */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            🧪 Contas de teste
          </p>
          {[
            { label: "Operador", email: "operador@parkme.com" },
            { label: "Admin",    email: "admin@parkme.com"    },
          ].map((c) => (
            <button
              key={c.email}
              type="button"
              onClick={() => { setEmail(c.email); setSenha("Senha@123") }}
              className="block w-full text-left text-xs text-primary hover:underline"
            >
              {c.label}: {c.email}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

// -----------------------------------------------------------
// Página exportada — envolve o formulário em Suspense
// -----------------------------------------------------------
export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ParkingCircle className="size-7" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">ParkMe</h1>
            <p className="text-sm text-muted-foreground">Central de Operações</p>
          </div>
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>
              Acesso restrito a operadores e administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-secondary" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
