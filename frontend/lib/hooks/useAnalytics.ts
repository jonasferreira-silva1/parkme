// =============================================================
// useAnalytics — Busca todos os dados de analytics da API
//
// Chama em paralelo os 3 endpoints de analytics e retorna
// o estado unificado para os componentes de KPI e gráficos.
// =============================================================

"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"

// --- Tipos que espelham o retorno da API ---

export interface OcupacaoPorAndar {
  [andar: number]: {
    total:    number
    ocupadas: number
    taxa:     string
  }
}

export interface DadosOcupacao {
  total:               number
  ocupadas:            number
  livres:              number
  taxaOcupacao:        string   // ex: "84%"
  precoDinamicoAtivo:  boolean
  porAndar:            OcupacaoPorAndar
}

export interface DadosReceita {
  periodo:         { de: string; ate: string }
  totalPagamentos: number
  totalReceita:    number
  porMetodo:       Record<string, number>  // { PIX: 1200, CREDIT: 800 }
}

export interface DadosDuracao {
  totalSessoes:   number
  mediaMinutos:   number
  mediaFormatada: string  // ex: "1h 45min"
}

export interface DadosAnalytics {
  ocupacao:  DadosOcupacao  | null
  receita:   DadosReceita   | null
  duracao:   DadosDuracao   | null
  carregando: boolean
  erro:       string | null
  // Recarrega os dados manualmente
  recarregar: () => void
}

export function useAnalytics(lotId?: string): DadosAnalytics {
  const [ocupacao, setOcupacao]   = useState<DadosOcupacao  | null>(null)
  const [receita,  setReceita]    = useState<DadosReceita   | null>(null)
  const [duracao,  setDuracao]    = useState<DadosDuracao   | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro,     setErro]       = useState<string | null>(null)

  const buscar = async () => {
    setCarregando(true)
    setErro(null)

    try {
      // Busca os 3 endpoints em paralelo para máxima performance
      const params = lotId ? { lotId } : {}

      const [resOcupacao, resReceita, resDuracao] = await Promise.all([
        api.get("/analytics/occupancy", { params }),
        api.get("/analytics/revenue"),
        api.get("/analytics/avg-duration", { params }),
      ])

      setOcupacao(resOcupacao.data)
      setReceita(resReceita.data)
      setDuracao(resDuracao.data)
    } catch (e: any) {
      setErro(e.response?.data?.message ?? "Erro ao carregar analytics")
    } finally {
      setCarregando(false)
    }
  }

  // Carrega ao montar e recarrega a cada 30 segundos
  useEffect(() => {
    buscar()
    const intervalo = setInterval(buscar, 30_000)
    return () => clearInterval(intervalo)
  }, [lotId])

  return { ocupacao, receita, duracao, carregando, erro, recarregar: buscar }
}
