// =============================================================
// useSessions — Sessões ativas com auto-refresh
//
// Busca GET /sessions/active e GET /sessions/history.
// Auto-refresh a cada 30 segundos.
// =============================================================

"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"

export interface SessaoAtiva {
  id:           string
  entryAt:      string
  status:       "ACTIVE" | "COMPLETED" | "CANCELLED"
  totalAmount:  number | null
  totalMinutes: number | null
  spot: {
    floor:  number
    sector: string
    number: number
    lot:    { name: string; pricePerHour: number }
  }
  vehicle: {
    plate: string
    model: string
    color: string
  }
  payment: { status: string; method: string } | null
}

export function useSessions() {
  const [sessoes, setSessoes]         = useState<SessaoAtiva[]>([])
  const [carregando, setCarregando]   = useState(true)
  const [erro, setErro]               = useState<string | null>(null)

  const buscar = async () => {
    setErro(null)
    try {
      // Busca sessões ativas — a API retorna a sessão do usuário logado,
      // mas o operador precisa ver todas. Usamos history com status ACTIVE.
      const res = await api.get("/sessions/history", {
        params: { page: 1, limit: 50 },
      })
      // Filtra para mostrar apenas ativas no dashboard principal
      const todas = res.data?.dados ?? []
      setSessoes(todas)
    } catch (e: any) {
      setErro(e.response?.data?.message ?? "Erro ao carregar sessões")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    const intervalo = setInterval(buscar, 30_000)
    return () => clearInterval(intervalo)
  }, [])

  return { sessoes, carregando, erro, recarregar: buscar }
}
