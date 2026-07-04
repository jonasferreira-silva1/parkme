// =============================================================
// useSpots — Vagas em tempo real via REST + WebSocket
//
// 1. Carrega todas as vagas do lotId via GET /spots
// 2. Escuta vaga_ocupada / vaga_livre do WebSocket
// 3. Atualiza o estado local incrementalmente (sem reload)
// =============================================================

"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { getSocket, entrarEstacionamento } from "@/lib/socket"

export interface Vaga {
  id:      string
  floor:   number
  sector:  string
  number:  number
  status:  "FREE" | "OCCUPIED" | "RESERVED"
  type:    "STANDARD" | "DISABLED" | "VIP"
  coordX:  number
  coordY:  number
  lotId:   string
}

export function useSpots(lotId: string) {
  const [vagas, setVagas]             = useState<Vaga[]>([])
  const [carregando, setCarregando]   = useState(true)
  const [conectado, setConectado]     = useState(false)

  // Carrega as vagas iniciais via REST
  const carregarVagas = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await api.get("/spots", { params: { lotId } })
      setVagas(res.data)
    } catch (e) {
      console.error("Erro ao carregar vagas:", e)
    } finally {
      setCarregando(false)
    }
  }, [lotId])

  // Conecta ao WebSocket e escuta eventos de mudança de status
  useEffect(() => {
    carregarVagas()

    let socket: ReturnType<typeof getSocket>
    try {
      socket = getSocket()
    } catch {
      // SSR — ignora
      return
    }

    // Entra na sala do estacionamento
    entrarEstacionamento(lotId)

    const onVagaOcupada = (data: { spotId: string }) => {
      setVagas((prev) =>
        prev.map((v) => v.id === data.spotId ? { ...v, status: "OCCUPIED" as const } : v)
      )
    }

    const onVagaLivre = (data: { spotId: string }) => {
      setVagas((prev) =>
        prev.map((v) => v.id === data.spotId ? { ...v, status: "FREE" as const } : v)
      )
    }

    const onConectado    = () => setConectado(true)
    const onDesconectado = () => setConectado(false)

    socket.on("vaga_ocupada",  onVagaOcupada)
    socket.on("vaga_livre",    onVagaLivre)
    socket.on("connect",       onConectado)
    socket.on("disconnect",    onDesconectado)

    if (socket.connected) setConectado(true)

    return () => {
      socket.off("vaga_ocupada",  onVagaOcupada)
      socket.off("vaga_livre",    onVagaLivre)
      socket.off("connect",       onConectado)
      socket.off("disconnect",    onDesconectado)
    }
  }, [lotId])

  // Estatísticas derivadas
  const livres   = vagas.filter((v) => v.status === "FREE").length
  const ocupadas = vagas.filter((v) => v.status === "OCCUPIED").length
  const taxa     = vagas.length > 0 ? Math.round((ocupadas / vagas.length) * 100) : 0

  return { vagas, carregando, conectado, livres, ocupadas, taxa, recarregar: carregarVagas }
}
