// =============================================================
// PÁGINA CONFIGURAÇÕES — Configurações do sistema ParkMe
// =============================================================

"use client"

import { useState } from "react"
import { Save, Building2, DollarSign, Bell, Shield, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/parkme/sidebar"
import { Topbar } from "@/components/parkme/topbar"
import { Separator } from "@/components/ui/separator"

// Seção de configuração reutilizável
function SecaoConfig({ titulo, descricao, icone: Icone, cor, children }: {
  titulo:    string
  descricao: string
  icone:     typeof Save
  cor:       string
  children:  React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${cor}20`, color: cor }}
        >
          <Icone className="size-5" />
        </div>
        <div>
          <CardTitle className="text-base">{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// Campo de configuração
function Campo({ label, valor, tipo = "text", readonly = false }: {
  label:    string
  valor:    string
  tipo?:    string
  readonly?: boolean
}) {
  const [v, setV] = useState(valor)
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={tipo}
        value={v}
        onChange={(e) => setV(e.target.value)}
        readOnly={readonly}
        className="flex h-9 w-full rounded-md border border-input bg-background/60 px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus:border-ring disabled:opacity-50 read-only:opacity-60 read-only:cursor-not-allowed transition-colors"
      />
    </div>
  )
}

// Toggle de configuração
function Toggle({ label, descricao, ativo }: { label: string; descricao: string; ativo: boolean }) {
  const [ligado, setLigado] = useState(ativo)
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{descricao}</p>
      </div>
      <button
        onClick={() => setLigado(!ligado)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ligado ? "bg-primary" : "bg-secondary"}`}
      >
        <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${ligado ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    setSalvando(true)
    // Simulação de salvamento — em produção chamaria a API
    await new Promise((r) => setTimeout(r, 800))
    setSalvando(false)
    alert("✅ Configurações salvas com sucesso!")
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo="Configurações" subtitulo="Parâmetros e preferências do sistema" />
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-3xl">

          {/* Estacionamento */}
          <SecaoConfig
            titulo="Estacionamento"
            descricao="Dados do estabelecimento exibidos no app e relatórios"
            icone={Building2}
            cor="var(--chart-1)"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Nome"     valor="ParkMe Shopping Center" />
              <Campo label="Endereço" valor="Av. Paulista, 1000 — São Paulo/SP" />
              <Campo label="Andares"  valor="3" tipo="number" />
              <Campo label="Total de vagas" valor="120" tipo="number" readonly />
            </div>
          </SecaoConfig>

          {/* Precificação */}
          <SecaoConfig
            titulo="Precificação"
            descricao="Valores e regras de cobrança por hora"
            icone={DollarSign}
            cor="var(--chart-2)"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Preço por hora (R$)"   valor="15.00" tipo="number" />
              <Campo label="Mínimo cobrado (horas)" valor="1"    tipo="number" />
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <Toggle
                label="Preço dinâmico"
                descricao="+20% quando ocupação ultrapassar 80%"
                ativo={true}
              />
              <Toggle
                label="Tarifa noturna"
                descricao="Redução de 30% entre 22h e 6h"
                ativo={false}
              />
            </div>
          </SecaoConfig>

          {/* Notificações */}
          <SecaoConfig
            titulo="Notificações"
            descricao="Alertas automáticos enviados aos motoristas"
            icone={Bell}
            cor="var(--chart-3)"
          >
            <div className="space-y-3">
              <Toggle
                label="Alerta de sessão expirando"
                descricao="Notificação 15 minutos antes do tempo contratado"
                ativo={true}
              />
              <Toggle
                label="Confirmação de entrada"
                descricao="Push notification ao registrar a entrada"
                ativo={true}
              />
              <Toggle
                label="Confirmação de pagamento"
                descricao="Aviso ao confirmar o pagamento via Pix ou cartão"
                ativo={true}
              />
            </div>
          </SecaoConfig>

          {/* Segurança */}
          <SecaoConfig
            titulo="Segurança"
            descricao="Autenticação e controle de acesso"
            icone={Shield}
            cor="var(--chart-4)"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Expiração do token (min)" valor="15" tipo="number" />
              <Campo label="Sessão de refresh (dias)"  valor="7"  tipo="number" />
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <Toggle
                label="Autenticação de dois fatores"
                descricao="Exige código adicional no login do admin"
                ativo={false}
              />
            </div>
          </SecaoConfig>

          {/* Sistema */}
          <SecaoConfig
            titulo="Sistema"
            descricao="Informações técnicas do ambiente"
            icone={Database}
            cor="var(--chart-5)"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Versão da API"       valor="1.0.0"       readonly />
              <Campo label="Ambiente"            valor="development"  readonly />
              <Campo label="Banco de dados"      valor="PostgreSQL 15" readonly />
              <Campo label="URL da API"          valor="http://localhost:3000" readonly />
            </div>
          </SecaoConfig>

          {/* Botão salvar */}
          <div className="flex justify-end pb-8">
            <Button onClick={salvar} disabled={salvando} className="gap-2 px-8">
              <Save className="size-4" />
              {salvando ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>

        </main>
      </div>
    </div>
  )
}
